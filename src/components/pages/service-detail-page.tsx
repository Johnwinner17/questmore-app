"use client";

import clsx from "clsx";
import type { Category, Service, NavigateFunction, SelectedServiceItem } from "@/lib/types";

export function ServiceDetailPage({
  service,
  category,
  onBack,
  onNavigate,
  basket = [],
  onToggleBasket,
}: {
  service: Service;
  category: Category;
  onBack: () => void;
  onNavigate: NavigateFunction;
  basket?: SelectedServiceItem[];
  onToggleBasket?: (item: SelectedServiceItem) => void;
}) {
  const isInBasket = basket.some(b => b.id === service.id);
  const BOOKING_FEE = 5000;
  const isNegotiable = !service.price;

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      {/* Cover image */}
      <div className="relative">
        <div className="aspect-[1.8/1] overflow-hidden bg-slate-100 relative">
          {service.imageUrl ? (
            <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white text-5xl">
              🔧
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
        </div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 safe-top flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-white/60 transition-transform active:scale-95 z-10"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Category badge */}
        <div className="absolute bottom-4 left-5 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1 text-[11px] font-black shadow-sm border border-white/20">
            {category.name}
          </span>
          {service.featured && (
            <span className="inline-flex items-center rounded-full bg-amber-400 text-slate-950 px-2.5 py-1 text-[10px] font-black shadow-sm">
              ✓ VERIFIED
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 pb-36 space-y-5">
        <div>
          <h1 className="text-[23px] font-black tracking-tight text-slate-950 leading-tight">
            {service.name}
          </h1>

          {/* Pricing Highlight Card */}
          <div className="mt-3.5 p-4.5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Service Cost</span>
              {service.price ? (
                <span className="text-[19px] font-black text-slate-950">₦{service.price.toLocaleString()}</span>
              ) : (
                <span className="text-[12px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl">
                  Price: Negotiable / Scope Based
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-600 font-medium">
              <span>{isNegotiable ? "Inquiry / Request Slot Fee:" : "Fixed Booking Fee:"}</span>
              <span className="font-bold text-amber-900">₦{BOOKING_FEE.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-[12.5px] font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-2xl">
              <span>Payable Now on Request:</span>
              <span className="text-emerald-700 font-black text-[15px]">
                ₦{(service.price ? service.price + BOOKING_FEE : BOOKING_FEE).toLocaleString()}
              </span>
            </div>

            {isNegotiable && (
              <p className="text-[11px] text-slate-500 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70 leading-relaxed">
                🤝 <strong>Negotiable Service:</strong> Pay only the ₦5,000 inquiry fee upfront to submit your requirements. QuestMore Admin will review and reply with the quoted service cost before specialist dispatch.
              </p>
            )}
          </div>
        </div>

        {service.shortDescription && (
          <p className="text-[13.5px] text-slate-600 font-medium leading-relaxed">
            {service.shortDescription}
          </p>
        )}

        {/* Multi-Service Basket status if in basket */}
        {isInBasket && (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-900 text-[13px] font-black">
              <span>✓</span>
              <span>Included in your Service Cart</span>
            </div>
            <span className="text-[11.5px] text-emerald-800 font-extrabold">({basket.length} total in cart)</span>
          </div>
        )}

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: "🛡️", label: "Trade Certified" },
            { icon: "⚡", label: "Admin Verified" },
            { icon: "✨", label: "QA Warranty" },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white border border-slate-200 p-3 text-center shadow-xs">
              <span className="text-[20px]">{item.icon}</span>
              <span className="text-[11px] font-black text-slate-800">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Full description */}
        {service.fullDescription && (
          <div>
            <h2 className="text-[15px] font-black text-slate-900 mb-2">Scope & Service Details</h2>
            <p className="text-[13px] text-slate-600 font-medium leading-[1.7] bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              {service.fullDescription}
            </p>
          </div>
        )}

        {/* How it works */}
        <div>
          <h2 className="text-[15px] font-black text-slate-900 mb-2.5">How this Service Works</h2>
          <div className="space-y-2.5">
            {[
              { step: "1", title: "Submit Request & Pay Fee", desc: "Covers engineer scoping & holds your certified dispatch slot" },
              { step: "2", title: "Admin Review & Specialist Match", desc: "QuestMore assigns a verified, trade-licensed technician" },
              { step: "3", title: "Site Execution & Client Sign-off", desc: "Work completed with client inspection & quality warranty" },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[12px] font-black text-amber-400 shadow-xs">
                  {item.step}
                </div>
                <div>
                  <p className="text-[13px] font-black text-slate-900">{item.title}</p>
                  <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-md p-4 safe-bottom z-30 shadow-2xl">
        <div className="flex gap-2.5 max-w-lg mx-auto">
          {onToggleBasket && (
            <button
              type="button"
              onClick={() => onToggleBasket({
                id: service.id,
                name: service.name,
                categoryId: category.id,
                categoryName: category.name,
                imageUrl: service.imageUrl,
                price: service.price ?? null,
                isNegotiable: !service.price,
              })}
              className={clsx(
                "flex-1 rounded-2xl py-3.5 text-[13px] font-black transition-all active:scale-[0.98] border",
                isInBasket
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
              )}
            >
              {isInBasket ? "✓ In Cart" : "+ Add to Cart"}
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate({
              type: "request",
              service,
              category,
              preselectedServices: isInBasket && basket.length > 1 ? basket : [{
                id: service.id,
                name: service.name,
                categoryId: category.id,
                categoryName: category.name,
                imageUrl: service.imageUrl,
                price: service.price ?? null,
                isNegotiable: !service.price,
              }],
            })}
            className="flex-1 rounded-2xl btn-pro-amber py-3.5 text-[13.5px] font-black shadow-lg"
          >
            {isInBasket && basket.length > 1 ? `Checkout Cart (${basket.length})` : "Request Now →"}
          </button>
        </div>
      </div>
    </div>
  );
}
