"use client";

import { useState, useEffect } from "react";
import type { SelectedServiceItem } from "@/lib/types";

interface PaymentModalProps {
  services: SelectedServiceItem[];
  bookingFee?: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  requestId?: number;
  userId?: number;
  onPaymentSuccess: (paymentData: {
    reference: string;
    method: string;
    amount: number;
    bookingFee: number;
    servicesTotal: number;
  }) => void;
  onCancel: () => void;
}

export function PaymentModal({
  services,
  bookingFee = 5000,
  clientName,
  clientEmail,
  clientPhone,
  requestId,
  userId,
  onPaymentSuccess,
  onCancel,
}: PaymentModalProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentReference, setCurrentReference] = useState("");
  const [paystackAuthUrl, setPaystackAuthUrl] = useState("");

  // Load Paystack Inline JS
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).PaystackPop) return;

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep script cached in page
    };
  }, []);

  // Calculate financials
  let servicesTotal = 0;
  let hasNegotiable = false;

  services.forEach((s) => {
    if (s.price && typeof s.price === "number" && !s.isNegotiable) {
      servicesTotal += s.price;
    } else {
      hasNegotiable = true;
    }
  });

  // Strict rule: ₦5,000 charged ONCE per cart/request
  const totalDueNow = servicesTotal + bookingFee;

  const handlePaystackCheckout = async () => {
    setErrorMessage("");
    setIsInitializing(true);

    try {
      // 1. Initialize transaction on backend with Paystack Secret Key
      const initRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientEmail,
          fullName: clientName,
          phone: clientPhone,
          userId,
          requestId,
          amount: totalDueNow,
          services,
          bookingFee,
        }),
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || "Failed to initialize Paystack checkout.");
      }

      setCurrentReference(initData.reference);
      if (initData.authorizationUrl) {
        setPaystackAuthUrl(initData.authorizationUrl);
      }

      // 2. Open Paystack Inline Popup
      if (typeof window !== "undefined" && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: initData.publicKey,
          email: clientEmail.trim().toLowerCase(),
          amount: initData.amountInKobo,
          ref: initData.reference,
          currency: "NGN",
          metadata: {
            custom_fields: [
              { display_name: "Client Name", variable_name: "client_name", value: clientName },
              { display_name: "Services Count", variable_name: "services_count", value: services.length },
              { display_name: "Request ID", variable_name: "request_id", value: requestId || "N/A" },
            ],
          },
          callback: async (response: { reference: string }) => {
            // 3. Server-side verification with Paystack API
            setIsVerifying(true);
            try {
              const verifyRes = await fetch("/api/paystack/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference: response.reference }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                setPaymentDone(true);
                setTimeout(() => {
                  onPaymentSuccess({
                    reference: response.reference,
                    method: verifyData.payment?.paymentChannel || "paystack",
                    amount: totalDueNow,
                    bookingFee,
                    servicesTotal,
                  });
                }, 1500);
              } else {
                setErrorMessage(
                  verifyData.error || "Payment could not be verified automatically by Paystack."
                );
              }
            } catch (vErr: any) {
              setErrorMessage("Verification network issue. Please check your activity tab.");
            } finally {
              setIsVerifying(false);
            }
          },
          onClose: () => {
            setIsInitializing(false);
          },
        });

        handler.openIframe();
      } else {
        // Fallback: Redirect to Paystack Checkout URL
        if (initData.authorizationUrl) {
          window.location.href = initData.authorizationUrl;
        } else {
          throw new Error("Paystack checkout unavailable. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("[Paystack Checkout Error]", err);
      setErrorMessage(err.message || "Could not start payment. Please check connection.");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
        {/* Header - Fixed */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-auto bg-white p-1 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/questmore_logo.jpg"
                alt="QuestMore Engineering Services Limited (RC: 6907014)"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[14.5px] font-black tracking-tight text-white leading-none">Paystack Checkout</h3>
                <span className="text-[8px] font-mono font-black text-amber-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                  RC: 6907014
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 truncate">
                {currentReference ? `Ref: ${currentReference}` : "QuestMore Engineering Services Ltd"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isInitializing || isVerifying}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {paymentDone ? (
          <div className="p-8 text-center space-y-3 my-auto">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-[32px] animate-bounce">
              ✓
            </div>
            <h4 className="text-[19px] font-black text-slate-900">Payment Verified with Paystack!</h4>
            <p className="text-[13px] font-medium text-slate-600">
              ₦{totalDueNow.toLocaleString()} confirmed via Paystack. Ref:{" "}
              <span className="font-mono font-bold text-slate-900">{currentReference}</span>.
            </p>
            <p className="text-[11px] text-slate-400 font-medium max-w-[280px] mx-auto">
              Your request is now in queue for QuestMore Admin review and specialist assignment.
            </p>
          </div>
        ) : (
          <>
            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12.5px] font-bold flex items-start gap-2">
                  <span className="text-[16px]">⚠️</span>
                  <div className="flex-1">
                    <p>{errorMessage}</p>
                    {paystackAuthUrl && (
                      <a
                        href={paystackAuthUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1 text-[11px] font-black text-red-900 underline"
                      >
                        Open Paystack Checkout in New Tab →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary Breakdown */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Selected Services
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-700">
                    {services.length} item{services.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {services.map((item) => (
                    <div key={item.id} className="flex items-start justify-between text-[12.5px] gap-2">
                      <span className="text-slate-700 font-medium line-clamp-1">{item.name}</span>
                      <span className="font-extrabold shrink-0 text-slate-900">
                        {item.price ? (
                          `₦${item.price.toLocaleString()}`
                        ) : (
                          <span className="text-amber-700 font-extrabold">Price: Negotiable</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Subtotals */}
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Services Subtotal:</span>
                    <span className="font-bold text-slate-900">
                      {servicesTotal > 0 ? `₦${servicesTotal.toLocaleString()}` : "₦0 (Negotiable)"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-amber-950 bg-amber-100/80 px-2.5 py-1.5 rounded-xl border border-amber-200/70">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px]">🛡️</span>
                      <span className="font-bold text-[12px]">
                        {hasNegotiable ? "Inquiry / Dispatch Slot Fee:" : "Fixed Booking Fee:"}
                      </span>
                    </div>
                    <span className="font-black text-[13px]">₦{bookingFee.toLocaleString()}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    * ₦{bookingFee.toLocaleString()} fee is charged once per request to verify
                    engineering dispatch and unlock direct specialist communication.
                  </p>

                  <div className="flex justify-between text-[15px] font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Payable Now:</span>
                    <span className="text-emerald-700 font-black text-[16px]">
                      ₦{totalDueNow.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {hasNegotiable && (
                <div className="rounded-2xl bg-blue-50/90 border border-blue-200 p-3 text-[11.5px] text-blue-950 font-medium leading-relaxed">
                  🤝 <span className="font-bold">Negotiable Services Included:</span> The ₦5,000 you
                  pay now is an <strong>inquiry/request fee</strong> to submit your job. QuestMore
                  Admin will review your scope and provide the quoted cost before a provider is
                  dispatched.
                </div>
              )}

              {/* Official Paystack Security Guarantee */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px]">🛡️</span>
                    <span className="text-[12px] font-extrabold text-slate-800">
                      Secured by Paystack
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Instant Bank Verification
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-slate-600">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">💳 Card (Mastercard / Visa / Verve)</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">🏦 Bank Transfer</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">📱 USSD</span>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar with Pay Button */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 safe-bottom">
              <button
                type="button"
                disabled={isInitializing || isVerifying}
                onClick={handlePaystackCheckout}
                className="w-full rounded-2xl py-3.5 text-[14.5px] font-black btn-pro-amber shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isInitializing || isVerifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                    <span>
                      {isVerifying ? "Verifying with Paystack..." : "Connecting to Paystack..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {hasNegotiable
                      ? `Pay ₦${bookingFee.toLocaleString()} with Paystack`
                      : `Pay ₦${totalDueNow.toLocaleString()} with Paystack`}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
