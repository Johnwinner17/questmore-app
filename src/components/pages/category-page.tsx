"use client";

import { useState, useEffect } from "react";
import type { Category, Subcategory, NavigateFunction } from "@/lib/types";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/subcategories?categoryId=${category.id}`)
      .then(res => res.json())
      .then(data => { setSubcats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category.id]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      {/* Header with cover image */}
      <div className="relative">
        <div className="aspect-[2.5/1] overflow-hidden bg-slate-100 relative">
          {category.imageUrl && (
            <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
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
          <h1 className="text-[24px] font-extrabold text-white tracking-tight">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-[13px] font-medium text-slate-200 line-clamp-2">{category.description}</p>
          )}
        </div>
      </div>

      {/* Subcategories */}
      <div className="px-5 py-5 pb-36">
        <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">
          Select a Subcategory
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-3xl skeleton" />
            ))}
          </div>
        ) : subcats.length > 0 ? (
          <div className="space-y-3">
            {subcats.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onNavigate({ type: "subcategory", subcategory: sub, category })}
                className="flex w-full items-center gap-4 rounded-3xl pro-glass-card pro-card-hover p-4 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 shrink-0 border border-amber-200/60 shadow-2xs">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2" stroke="#F59E0B" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="#F59E0B" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="#F59E0B" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="#F59E0B" strokeWidth="2"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14.5px] font-extrabold text-slate-900">{sub.name}</h3>
                  {sub.description && (
                    <p className="text-[11.5px] font-medium text-slate-500 mt-0.5 line-clamp-1">{sub.description}</p>
                  )}
                </div>
                <svg className="shrink-0 text-slate-400" width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-[36px]">📦</span>
            <p className="mt-3 text-[15px] font-extrabold text-slate-900">Coming Soon</p>
            <p className="mt-1 text-[12px] font-medium text-slate-400">We&apos;re adding services to this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

