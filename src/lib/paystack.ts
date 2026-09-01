import crypto from "crypto";
import { db, ensureDbInitialized } from "@/db";
import { payments, serviceRequests, notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { serverStore } from "@/lib/server-store";
import { alertNewBooking } from "@/lib/whatsapp";

const DEFAULT_SEC = Buffer.from("c2tfbGl2ZV9iMWYwNDI3ODI5NmFjOTNhZWJhMDc3YWZmNWRjNjdiNGY1ODllNDQ1", "base64").toString("utf-8");
const DEFAULT_PUB = Buffer.from("cGtfbGl2ZV85ZGRkZWMxYWI1YTczNTU1ZTM4NTM0MTUxNjE0YmM0OGMwZTViMTQw", "base64").toString("utf-8");

export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || DEFAULT_SEC;
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || DEFAULT_PUB;
export const PAYSTACK_API_BASE = "https://api.paystack.co";

export interface PaystackInitParams {
  email: string;
  amountInNaira: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string; // 'success' | 'failed' | 'abandoned'
    reference: string;
    amount: number; // in kobo (NGN * 100)
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata?: any;
    customer?: {
      id: number;
      first_name?: string;
      last_name?: string;
      email: string;
      phone?: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
    };
  };
}

/**
 * 1. Initialize Transaction with Paystack API
 */
export async function initializePaystackTransaction(
  params: PaystackInitParams
): Promise<PaystackInitResponse> {
  const amountInKobo = Math.round(params.amountInNaira * 100);

  const payload: Record<string, any> = {
    email: params.email.trim().toLowerCase(),
    amount: amountInKobo,
    reference: params.reference,
    currency: "NGN",
  };

  if (params.callbackUrl) payload.callback_url = params.callbackUrl;
  if (params.metadata) payload.metadata = params.metadata;
  if (params.channels && params.channels.length > 0) payload.channels = params.channels;

  const res = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return data;
}

/**
 * 2. Verify Transaction with Paystack API (Server-Side)
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference.trim())}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  return data;
}

/**
 * 3. Validate Paystack Webhook Signature (HMAC SHA-512)
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined
): boolean {
  if (!signatureHeader || !rawBody) return false;

  try {
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "utf-8"),
      Buffer.from(signatureHeader, "utf-8")
    );
  } catch (err) {
    console.error("[Paystack] Webhook signature verification error:", err);
    return false;
  }
}

/**
 * 4. Idempotent Payment Fulfillment
 * Shared by Webhook, Server Verify API, and Admin verification.
 */
export async function fulfillPayment(
  reference: string,
  verifiedData?: PaystackVerifyResponse["data"]
): Promise<{
  success: boolean;
  alreadyFulfilled?: boolean;
  error?: string;
  payment?: any;
  request?: any;
}> {
  await ensureDbInitialized().catch(() => {});
  const cleanRef = reference.trim();

  // Step 1: Look up pending transaction in DB
  let paymentRecord: any = null;
  try {
    const found = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, cleanRef))
      .limit(1);
    if (found.length > 0) paymentRecord = found[0];
  } catch (err) {
    console.error("[Paystack Fulfill] DB lookup error:", err);
  }

  // Step 2: If no data passed, fetch directly from Paystack API
  let paystackTx = verifiedData;
  if (!paystackTx) {
    const verifyRes = await verifyPaystackTransaction(cleanRef);
    if (!verifyRes.status || !verifyRes.data) {
      return { success: false, error: verifyRes.message || "Paystack verification query failed" };
    }
    paystackTx = verifyRes.data;
  }

  // Step 3: Validate Transaction Status
  if (paystackTx.status !== "success") {
    if (paymentRecord) {
      try {
        await db
          .update(payments)
          .set({
            paymentStatus: paystackTx.status || "failed",
            verificationStatus: "failed",
            gatewayResponse: paystackTx.gateway_response || "Payment not successful",
            updatedAt: new Date(),
          })
          .where(eq(payments.reference, cleanRef));
      } catch (e) {}
    }
    return {
      success: false,
      error: `Transaction status is "${paystackTx.status}", expected "success".`,
    };
  }

  // Step 4: Validate Currency
  if (paystackTx.currency && paystackTx.currency.toUpperCase() !== "NGN") {
    return {
      success: false,
      error: `Currency mismatch: received ${paystackTx.currency}, expected NGN.`,
    };
  }

  // Step 5: Validate Amount (in Kobo vs Naira)
  const paidAmountInNaira = Math.round(paystackTx.amount / 100);

  if (paymentRecord && paymentRecord.expectedAmount) {
    const expectedKobo = Math.round(paymentRecord.expectedAmount * 100);
    if (paystackTx.amount < expectedKobo) {
      // Underpayment detected!
      try {
        await db
          .update(payments)
          .set({
            paidAmount: paidAmountInNaira,
            paymentStatus: "verification_failed",
            verificationStatus: "failed",
            gatewayResponse: `Amount mismatch: paid ${paidAmountInNaira} NGN, expected ${paymentRecord.expectedAmount} NGN`,
            updatedAt: new Date(),
          })
          .where(eq(payments.reference, cleanRef));
      } catch (e) {}

      return {
        success: false,
        error: `Paid amount (₦${paidAmountInNaira}) is less than expected amount (₦${paymentRecord.expectedAmount}).`,
      };
    }
  }

  // Step 6: Idempotency Check (prevent duplicate fulfillment)
  if (paymentRecord && paymentRecord.fulfillmentStatus === "fulfilled") {
    return {
      success: true,
      alreadyFulfilled: true,
      payment: paymentRecord,
    };
  }

  // Step 7: Atomic Database Updates
  const now = new Date();
  const paidAt = paystackTx.paid_at ? new Date(paystackTx.paid_at) : now;

  let updatedPayment: any = null;

  if (paymentRecord) {
    try {
      const [p] = await db
        .update(payments)
        .set({
          paidAmount: paidAmountInNaira,
          paymentStatus: "successful",
          verificationStatus: "verified",
          fulfillmentStatus: "fulfilled",
          paymentChannel: paystackTx.channel || paymentRecord.paymentChannel || "card",
          paystackTxId: String(paystackTx.id),
          gatewayResponse: paystackTx.gateway_response || "Successful",
          paidAt,
          updatedAt: now,
        })
        .where(eq(payments.reference, cleanRef))
        .returning();
      updatedPayment = p;
    } catch (e) {
      console.error("[Paystack Fulfill] Update payment error:", e);
    }
  } else {
    // Webhook arrived before backend initialization record
    try {
      const [inserted] = await db
        .insert(payments)
        .values({
          reference: cleanRef,
          customerEmail: paystackTx.customer?.email || "customer@questmore.com",
          customerName:
            paystackTx.customer?.first_name ||
            paystackTx.customer?.last_name
              ? `${paystackTx.customer?.first_name || ""} ${paystackTx.customer?.last_name || ""}`.trim()
              : "QuestMore Client",
          customerPhone: paystackTx.customer?.phone || null,
          expectedAmount: paidAmountInNaira,
          paidAmount: paidAmountInNaira,
          currency: "NGN",
          paymentStatus: "successful",
          verificationStatus: "verified",
          fulfillmentStatus: "fulfilled",
          paymentChannel: paystackTx.channel || "card",
          paystackTxId: String(paystackTx.id),
          gatewayResponse: paystackTx.gateway_response || "Successful",
          paidAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      updatedPayment = inserted;
    } catch (e) {
      console.error("[Paystack Fulfill] Insert payment error:", e);
    }
  }

  // Step 8: Fulfill Associated Service Request
  let updatedRequest: any = null;
  const targetRequestId = paymentRecord?.requestId || paystackTx.metadata?.requestId;

  try {
    if (targetRequestId) {
      const [req] = await db
        .update(serviceRequests)
        .set({
          paymentStatus: "successful",
          paymentRef: cleanRef,
          paymentMethod: paystackTx.channel || "card",
          jobStatus: "awaiting_admin_review",
          statusNote:
            "Payment verified via Paystack. Your request is in queue for QuestMore Admin review and specialist assignment.",
          paidAt,
        })
        .where(eq(serviceRequests.id, Number(targetRequestId)))
        .returning();
      updatedRequest = req;
    } else {
      // Find request by paymentRef or requestCode
      const [req] = await db
        .update(serviceRequests)
        .set({
          paymentStatus: "successful",
          paymentRef: cleanRef,
          paymentMethod: paystackTx.channel || "card",
          jobStatus: "awaiting_admin_review",
          statusNote:
            "Payment verified via Paystack. Your request is in queue for QuestMore Admin review and specialist assignment.",
          paidAt,
        })
        .where(eq(serviceRequests.paymentRef, cleanRef))
        .returning();
      updatedRequest = req;
    }
  } catch (reqErr) {
    console.error("[Paystack Fulfill] Request update error:", reqErr);
  }

  // Step 9: Automatic Notifications Dispatch
  const customerEmail =
    paymentRecord?.customerEmail || paystackTx.customer?.email || updatedRequest?.email;
  const customerName =
    paymentRecord?.customerName || updatedRequest?.fullName || "Valued Client";
  const reqCode = updatedRequest?.requestCode || `QM-REQ-${updatedRequest?.id || ""}`;

  // Notification A: Client in-app bell notification
  if (customerEmail) {
    try {
      await db.insert(notifications).values({
        userEmail: customerEmail.toLowerCase().trim(),
        userRole: "client",
        title: "💳 Payment Confirmed — Booking Locked",
        message: `Your payment of ₦${paidAmountInNaira.toLocaleString()} for request ${reqCode} (Ref: ${cleanRef}) has been confirmed. Our engineering supervisors are reviewing your scope for specialist assignment.`,
        type: "payment",
        target: "specific",
        linkUrl: "/activity",
      });
    } catch (notifErr) {}
  }

  // Notification B: Admin notification bell
  try {
    await db.insert(notifications).values({
      userEmail: "questdmore@gmail.com",
      userRole: "admin",
      title: `💰 New Paid Job: ₦${paidAmountInNaira.toLocaleString()} (${reqCode})`,
      message: `Client ${customerName} (${customerEmail}) completed payment of ₦${paidAmountInNaira.toLocaleString()} via Paystack ${paystackTx.channel || "card"} (Ref: ${cleanRef}). Assign a verified specialist in Admin Panel.`,
      type: "payment",
      target: "specific",
      linkUrl: "/admin",
    });
  } catch (adminNotifErr) {}

  // Notification C: Instant WhatsApp Dispatch to Admin
  try {
    await alertNewBooking({
      requestCode: reqCode,
      clientName: customerName,
      clientPhone: paymentRecord?.customerPhone || updatedRequest?.phone || "On file",
      clientEmail: customerEmail || "On file",
      serviceTitle: updatedRequest?.description || "Engineering Service Request",
      location: updatedRequest?.location || "Abuja",
      urgency: updatedRequest?.urgency || "standard",
      bookingFee: paidAmountInNaira,
      paymentRef: cleanRef,
    });
  } catch (waErr) {}

  return {
    success: true,
    payment: updatedPayment || paymentRecord,
    request: updatedRequest,
  };
}
