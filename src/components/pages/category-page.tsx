"use client";

import { useState, useEffect } from "react";
import type { Category, Subcategory, Service, NavigateFunction } from "@/lib/types";

export function CategoryPage({
  category,
  onBack,
  onNavigate,
}: {
  category: Category;
  onBack: () => void;
  onNavigate: NavigateFunction;
}) {
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/subcategories?categoryId=${category.id}`)
        .then((res) => res.json())
        .catch(() => []),
      fetch(`/api/services/by-category?categoryId=${category.id}`)
        .then((res) => res.json())
        .catch(() => []),
    ])
      .then(([subData, servData]) => {
        if (Array.isArray(subData)) setSubcats(subData);
        if (Array.isArray(servData)) setServicesList(servData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category.id]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      {/* Header with cover image */}
      <div className="relative">
        <div className="aspect-[2.5/1] overflow-hidden bg-slate-100 relative">
          {category.imageUrl ? (
            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center text-4xl">
              🏗️
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 safe-top flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md shadow-md border border-white/60 transition-transform active:scale-95 z-10"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-md backdrop-blur-sm inline-block mb-1">
            Category
          </span>
          <h1 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-[12px] sm:text-[13px] font-medium text-slate-200 line-clamp-2">{category.description}</p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 py-5 pb-36 space-y-6">
        {/* Subcategories (if available) */}
        {subcats.length > 0 && (
          <div>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wider mb-3">
              Subcategories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subcats.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onNavigate({ type: "subcategory", subcategory: sub, category })}
                  className="flex w-full items-center gap-3.5 rounded-2xl pro-glass-card p-3.5 text-left border border-slate-200/80 hover:border-amber-400 transition-all bg-white"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shrink-0 border border-amber-200">
                    <span className="text-lg">📁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13.5px] font-extrabold text-slate-900 truncate">{sub.name}</h3>
                    {sub.description && (
                      <p className="text-[11px] text-slate-500 truncate">{sub.description}</p>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listings / Services under this Category */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-wider">
              Listings in {category.name} ({servicesList.length})
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-2xl skeleton" />
              ))}
            </div>
          ) : servicesList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {servicesList.map((service) => (
                <div
                  key={service.id}
                  onClick={() => onNavigate({ type: "service", service, category })}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[1.3/1] w-full overflow-hidden rounded-xl bg-slate-100 mb-2 shrink-0">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-amber-50 text-2xl">
                          🔧
                        </div>
                      )}
                      {service.featured && (
                        <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                          ★ VERIFIED
                        </span>
                      )}
                    </div>
                    <h3 className="text-[12.5px] font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[34px]">
                      {service.name}
                    </h3>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {service.price && Number(service.price) > 0 ? (
                        <p className="text-[12px] font-black text-slate-900">
                          ₦{Number(service.price).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          Quote on Site
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-6">
              <span className="text-[36px]">📦</span>
              <p className="mt-3 text-[14px] font-extrabold text-slate-800">No Listings in This Category Yet</p>
              <p className="mt-1 text-[11.5px] text-slate-400">Services created by admin under this category will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

