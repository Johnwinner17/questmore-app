import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/db";
import { fulfillPayment } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized().catch(() => {});
    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "Transaction reference is required for verification." },
        { status: 400 }
      );
    }

    // Call server-side idempotent fulfillment
    const result = await fulfillPayment(reference);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyFulfilled: Boolean(result.alreadyFulfilled),
      message: "Payment successfully verified and fulfilled!",
      payment: result.payment,
      request: result.request,
    });
  } catch (error: any) {
    console.error("[Paystack Verify Route] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
