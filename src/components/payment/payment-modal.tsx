"use client";

import { useState } from "react";
import type { SelectedServiceItem } from "@/lib/types";

interface PaymentModalProps {
  services: SelectedServiceItem[];
  bookingFee?: number;
  clientName: string;
  clientEmail: string;
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
  onPaymentSuccess,
  onCancel,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"card" | "transfer" | "ussd">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [generatedRef] = useState(`QM-PAY-${Math.floor(10000000 + Math.random() * 90000000)}`);

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

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDone(true);
      setTimeout(() => {
        onPaymentSuccess({
          reference: generatedRef,
          method,
          amount: totalDueNow,
          bookingFee,
          servicesTotal,
        });
      }, 1200);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
        {/* Header - Fixed */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-sm shadow-sm">
              💳
            </div>
            <div>
              <h3 className="text-[15px] font-black tracking-tight">QuestMore Secure Checkout</h3>
              <p className="text-[11px] text-slate-400 font-mono">Ref: {generatedRef}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
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
            <h4 className="text-[19px] font-black text-slate-900">Payment Verified!</h4>
            <p className="text-[13px] font-medium text-slate-600">
              ₦{totalDueNow.toLocaleString()} received. Your request is now <strong>awaiting QuestMore review</strong>.
            </p>
            <p className="text-[11px] text-slate-400 font-medium max-w-[280px] mx-auto">
              Admin is reviewing scope and will assign a verified technician immediately.
            </p>
          </div>
        ) : (
          <>
            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
              {/* Order Summary Breakdown */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Selected Services</span>
                  <span className="text-[11.5px] font-bold text-slate-700">{services.length} item{services.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {services.map((item) => (
                    <div key={item.id} className="flex items-start justify-between text-[12.5px] gap-2">
                      <span className="text-slate-700 font-medium line-clamp-1">{item.name}</span>
                      <span className="font-extrabold shrink-0 text-slate-900">
                        {item.price ? `₦${item.price.toLocaleString()}` : <span className="text-amber-700 font-extrabold">Price: Negotiable</span>}
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
                    * ₦{bookingFee.toLocaleString()} fee is charged once per request to verify engineering dispatch and unlock direct specialist communication.
                  </p>

                  <div className="flex justify-between text-[15px] font-black text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Due Now:</span>
                    <span className="text-emerald-700 font-black text-[16px]">₦{totalDueNow.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {hasNegotiable && (
                <div className="rounded-2xl bg-blue-50/90 border border-blue-200 p-3 text-[11.5px] text-blue-950 font-medium leading-relaxed">
                  🤝 <span className="font-bold">Negotiable Services Included:</span> The ₦5,000 you pay now is an <strong>inquiry/request fee</strong> to submit your job. QuestMore Admin will review your scope and provide the quoted cost before a provider is dispatched.
                </div>
              )}

              {/* Payment Method Switcher */}
              <div>
                <label className="block text-[12px] font-black text-slate-800 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "card", label: "Debit Card", icon: "💳" },
                    { id: "transfer", label: "Bank Transfer", icon: "🏦" },
                    { id: "ussd", label: "USSD Code", icon: "📱" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        method === m.id
                          ? "border-slate-900 bg-slate-900 text-white font-black shadow-sm"
                          : "border-slate-200 text-slate-700 font-bold hover:bg-slate-50 bg-white"
                      }`}
                    >
                      <span className="text-[17px] block mb-0.5">{m.icon}</span>
                      <span className="text-[11.5px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Channel Details */}
              {method === "card" && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <input
                    type="text"
                    placeholder="Card Number (5399 •••• •••• ••••)"
                    defaultValue="5399 4120 8940 3810"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] font-mono bg-white outline-none focus:border-amber-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="12/28"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] font-mono bg-white outline-none focus:border-amber-500"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="894"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] font-mono bg-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {method === "transfer" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[12px] space-y-1.5">
                  <p className="text-slate-500 font-medium">Transfer to QuestMore Engineering Account:</p>
                  <p className="font-black text-slate-900 text-[13px]">Wema Bank / QuestMore Corp</p>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900">
                    <span className="text-[14px]">0294819041</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">COPY</span>
                  </div>
                </div>
              )}

              {method === "ussd" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[12px] space-y-1 text-center font-mono">
                  <p className="text-slate-500 font-medium">Dial on your registered bank line:</p>
                  <p className="font-black text-[16px] text-slate-900 py-1">*737*50*{totalDueNow}#</p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Action Bar with Pay Button - NEVER HIDDEN */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 safe-bottom">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full rounded-2xl py-3.5 text-[14.5px] font-black btn-pro-amber shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                    <span>Verifying Payment...</span>
                  </>
                ) : (
                  <span>
                    {hasNegotiable
                      ? `Pay ₦${bookingFee.toLocaleString()} Inquiry Fee & Submit`
                      : `Pay ₦${totalDueNow.toLocaleString()} & Confirm Job`
                    }
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
