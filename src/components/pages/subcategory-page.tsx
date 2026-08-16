"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { Category, Subcategory, Service, NavigateFunction, SelectedServiceItem } from "@/lib/types";

export function SubcategoryPage({
  subcategory,
  category,
  onBack,
  onNavigate,
  basket = [],
  onToggleBasket,
}: {
  subcategory: Subcategory;
  category: Category;
  onBack: () => void;
  onNavigate: NavigateFunction;
  basket?: SelectedServiceItem[];
  onToggleBasket?: (item: SelectedServiceItem) => void;
}) {
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services?subcategoryId=${subcategory.id}`)
      .then(res => res.json())
      .then(data => { setServicesList(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [subcategory.id]);

  const isInBasket = (serviceId: number) => basket.some(b => b.id === serviceId);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      {/* Header bar */}
      <div className="safe-top" />
      <header className="sticky top-0 z-20 bg-surface-50/95 backdrop-blur-md border-b border-slate-200/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/60 transition-transform active:scale-95"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-black text-slate-900 truncate">{subcategory.name}</h1>
            <p className="text-[11px] font-bold text-amber-700">{category.name}</p>
          </div>
        </div>
      </header>

      <div className="px-3.5 sm:px-5 py-4 pb-36">
        {subcategory.description && (
          <p className="text-[12.5px] font-medium text-slate-500 leading-relaxed mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {subcategory.description}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl bg-white p-2.5 border border-slate-100 shadow-2xs space-y-2">
                <div className="aspect-[1.3/1] skeleton rounded-xl w-full" />
                <div className="h-3 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
                <div className="h-7 w-full skeleton rounded-xl" />
              </div>
            ))}
          </div>
        ) : servicesList.length > 0 ? (
          /* EXACT 2-COLUMN GRID (2 per row on mobile) */
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {servicesList.map((service) => {
              const selected = isInBasket(service.id);
              return (
                <div
                  key={service.id}
                  className={clsx(
                    "group flex flex-col justify-between rounded-2xl border bg-white p-2.5 shadow-2xs transition-all duration-200 hover:shadow-xs",
                    selected
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20"
                      : "border-slate-200/80 hover:border-slate-300"
                  )}
                >
                  {/* Image */}
                  <div>
                    <div className="relative aspect-[1.3/1] w-full overflow-hidden rounded-xl bg-slate-100 mb-2 shrink-0">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-2xl">
                          🔧
                        </div>
                      )}
                      {service.featured && (
                        <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                          ★ VERIFIED
                        </span>
                      )}
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shadow-xs">
                          ✓ In Cart
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[12.5px] font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[34px]">
                      {service.name}
                    </h3>

                    {/* Price (only when exists) */}
                    <div className="mt-1 mb-2.5 min-h-[22px] flex items-center">
                      {service.price ? (
                        <span className="text-[13px] font-black text-slate-950">
                          ₦{service.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Negotiable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: See Details & Add to Cart */}
                  <div className="flex flex-col sm:flex-row gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: "service", service, category })}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold transition-colors text-center"
                    >
                      See Details
                    </button>

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
                          "flex-1 py-1.5 rounded-xl text-[10.5px] font-black transition-all active:scale-[0.96] text-center shadow-2xs",
                          selected
                            ? "bg-emerald-600 text-white"
                            : "btn-pro-amber"
                        )}
                      >
                        {selected ? "✓ Added" : "+ Add"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-[36px]">📦</span>
            <p className="mt-3 text-[15px] font-black text-slate-900">No services found</p>
            <p className="mt-1 text-[12px] font-medium text-slate-400">Engineering services are being assigned to this subcategory</p>
          </div>
        )}
      </div>
    </div>
  );
}
