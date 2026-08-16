"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import type { Category, Service, NavigateFunction, SelectedServiceItem } from "@/lib/types";

const categoryIcons: Record<string, string> = {
  building: "🏗️", zap: "⚡", droplets: "🔧", home: "🏠", wrench: "🛠️", "hard-hat": "👷",
};

export function ExploreTab({
  categories, onNavigate, basket, onToggleBasket, onClearBasket,
}: {
  categories: Category[]; onNavigate: NavigateFunction;
  basket: SelectedServiceItem[]; onToggleBasket: (item: SelectedServiceItem) => void; onClearBasket: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(categories[0] || null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    fetch(`/api/services/by-category?categoryId=${activeCategory.id}`)
      .then(res => res.json())
      .then(data => { setServices(data); setLoading(false); })
      .catch(() => { setServices([]); setLoading(false); });
  }, [activeCategory?.id]);

  useEffect(() => {
    if (!tabsRef.current || !activeCategory) return;
    const el = tabsRef.current.querySelector(`[data-category-id="${activeCategory.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory?.id]);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.shortDescription && s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const isInBasket = (serviceId: number) => basket.some(b => b.id === serviceId);

  // Basket financial calculation
  const BOOKING_FEE = 5000;
  let basketServicesTotal = 0;
  basket.forEach(b => {
    if (b.price && typeof b.price === "number" && !b.isNegotiable) {
      basketServicesTotal += b.price;
    }
  });
  const basketTotalWithFee = basketServicesTotal + BOOKING_FEE;

  return (
    <div className="h-full flex flex-col relative bg-surface-50">
      <div className="safe-top" />

      {/* ─── HEADER ─── */}
      <header className="flex-shrink-0 bg-surface-50/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="px-4 sm:px-5 pt-3.5 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-black tracking-tight text-slate-900 leading-none">Services & Catalogue</h1>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Verified engineering & technical trades</p>
          </div>
          {basket.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black bg-amber-400 text-slate-950 shadow-sm animate-pulse-glow">
              <span>🛒</span><span>{basket.length} in Cart</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 sm:px-5 py-2">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-2xl bg-white shadow-2xs border border-slate-200/80 pl-9 pr-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-amber-500"
            />
          </div>
        </div>

        {/* ─── CATEGORY TABS ─── */}
        <div ref={tabsRef} className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-5 pb-2.5">
          {categories.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                data-category-id={cat.id}
                onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                className={clsx(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-extrabold whitespace-nowrap transition-all active:scale-[0.97]",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
                )}
              >
                <span className="text-[14px]">{categoryIcons[cat.icon || "building"] || "🏗️"}</span>
                <span>{cat.name}</span>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-amber-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── 2-COLUMN LISTINGS GRID (2 PER ROW ON MOBILE) ─── */}
      <div className={clsx("flex-1 overflow-y-auto no-scrollbar overscroll-contain", basket.length > 0 ? "pb-44" : "pb-36")}>
        <div className="p-3.5 sm:p-5">
          {activeCategory && (
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-black text-slate-900">{activeCategory.name}</h2>
                {activeCategory.description && <p className="text-[11px] font-medium text-slate-500">{activeCategory.description}</p>}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl bg-white p-2.5 border border-slate-100 shadow-2xs space-y-2">
                  <div className="aspect-[1.3/1] skeleton rounded-xl w-full" />
                  <div className="h-3 w-3/4 skeleton rounded" />
                  <div className="h-3 w-1/2 skeleton rounded" />
                  <div className="h-7 w-full skeleton rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredServices.length > 0 ? (
            /* EXACT 2-COLUMN GRID (Row 1: 1 & 2, Row 2: 3 & 4, Row 3: 5 & 6) */
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {filteredServices.map((service) => {
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
                    {/* Top: Image & Tag */}
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

                      {/* Title & Category Badge */}
                      <h3 className="text-[12.5px] font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[34px]">
                        {service.name}
                      </h3>

                      {/* Price Only When It Exists */}
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

                    {/* Bottom Action Buttons: See Details & Add to Cart */}
                    <div className="flex flex-col sm:flex-row gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => activeCategory && onNavigate({ type: "service", service, category: activeCategory })}
                        className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold transition-colors text-center"
                      >
                        See Details
                      </button>

                      <button
                        type="button"
                        onClick={() => activeCategory && onToggleBasket({
                          id: service.id,
                          name: service.name,
                          categoryId: activeCategory.id,
                          categoryName: activeCategory.name,
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs mb-3">
                <span className="text-[26px]">📦</span>
              </div>
              <h3 className="text-[15px] font-black text-slate-900">{searchQuery ? "No services found" : "Services Expanding"}</h3>
              <p className="mt-1 text-[11.5px] text-slate-500 font-medium max-w-[220px]">
                {searchQuery ? "Try a different search term" : "We are adding more verified services in this category."}
              </p>
            </div>
          )}

          {!loading && filteredServices.length > 0 && (
            <div className="mt-5 text-center">
              <p className="text-[10.5px] font-bold text-slate-400">
                {filteredServices.length} listing{filteredServices.length !== 1 ? "s" : ""} available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── FLOATING BASKET BAR ─── */}
      {basket.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-30 fade-in">
          <div className="flex items-center justify-between rounded-2xl p-3 bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700/60 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-black text-slate-900 bg-amber-400 shadow-xs">
                {basket.length}
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-black leading-tight truncate">
                  {basket.length} {basket.length === 1 ? "Item" : "Items"} • ₦{basketTotalWithFee.toLocaleString()}
                </p>
                <p className="text-[9.5px] text-slate-300 truncate">
                  Includes ₦5,000 Booking Fee
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={onClearBasket} className="px-2 py-1 text-[10.5px] font-bold text-slate-400 hover:text-white">
                Clear
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ type: "request", preselectedServices: basket })}
                className="inline-flex items-center gap-1 rounded-xl btn-pro-amber px-3.5 py-2 text-[11.5px] font-black shadow-md"
              >
                Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
