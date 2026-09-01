import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/db";
import { verifyPaystackWebhookSignature, fulfillPayment } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});

    // 1. Read raw body string for HMAC SHA-512 signature validation
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 2. Validate Signature
    const isSignatureValid = verifyPaystackWebhookSignature(rawBody, signature);
    if (!isSignatureValid) {
      console.warn("[Paystack Webhook] Invalid signature rejected!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Parse Event JSON
    let event: any = null;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = event.event;
    console.log(`[Paystack Webhook] Received verified event: ${eventType}`);

    // 4. Handle 'charge.success'
    if (eventType === "charge.success" && event.data) {
      const reference = event.data.reference;

      if (!reference) {
        return NextResponse.json({ error: "Missing reference in charge.success" }, { status: 400 });
      }

      // 5. Automatic Server-Side Fulfillment (Idempotent & Verified)
      const fulfillResult = await fulfillPayment(reference, event.data);

      if (!fulfillResult.success) {
        console.error(`[Paystack Webhook] Fulfillment issue for ${reference}:`, fulfillResult.error);
      } else {
        console.log(`[Paystack Webhook] Successfully processed payment for ${reference}`);
      }
    }

    // Acknowledge receipt to Paystack
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Paystack Webhook] Processing error:", error);
    // Still return 200 to prevent webhook flood after logging internal error
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
