"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { ProjectGalleryItem } from "@/lib/types";

export function GalleryPage({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<ProjectGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProjectGalleryItem | null>(null);
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    fetch("/api/gallery")
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      <div className="safe-top" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-50/90 backdrop-blur-md border-b border-slate-200/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/60 transition-transform active:scale-95"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900">Project Gallery</h1>
            <p className="text-[11.5px] font-medium text-slate-400">Before & After Engineering Transformations</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl overflow-hidden bg-white p-3 shadow-sm">
                <div className="aspect-video skeleton rounded-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-full skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setShowAfter(false); }}
                className="w-full rounded-3xl pro-glass-card pro-card-hover overflow-hidden text-left"
              >
                <div className="aspect-video overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.afterImageUrl || item.beforeImageUrl || ""}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center rounded-full bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 text-[10px] font-extrabold shadow-sm">
                      BEFORE & AFTER
                    </span>
                  </div>
                </div>
                <div className="p-4.5">
                  <h3 className="text-[15.5px] font-extrabold text-slate-900">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1.5 text-[12.5px] text-slate-500 font-medium leading-relaxed line-clamp-2">{item.description}</p>
                  )}
                  {item.location && (
                    <p className="mt-2.5 text-[11.5px] text-slate-400 font-medium flex items-center gap-1">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#64748B" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="#64748B" strokeWidth="2"/></svg>
                      {item.location}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-[40px]">📸</span>
            <h3 className="mt-4 text-[16px] font-extrabold text-slate-900">No projects yet</h3>
            <p className="mt-1 text-[12px] font-medium text-slate-400">Check back soon for engineering project showcases</p>
          </div>
        )}
      </div>

      {/* Full-screen viewer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col">
          <div className="safe-top" />
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <button
              onClick={() => setSelectedItem(null)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition-transform active:scale-95"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
            <div className="text-center">
              <p className="text-[14px] font-extrabold text-white">{selectedItem.title}</p>
              <p className="text-[11px] font-semibold text-amber-400">{showAfter ? "After Transformation" : "Before State"}</p>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex-1 flex items-center justify-center p-5">
            <img
              src={showAfter ? (selectedItem.afterImageUrl || "") : (selectedItem.beforeImageUrl || "")}
              alt={selectedItem.title}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          <div className="p-5 safe-bottom bg-slate-900/90">
            <div className="flex gap-3">
              <button
                onClick={() => setShowAfter(false)}
                className={clsx("flex-1 py-3.5 rounded-2xl text-[13px] font-extrabold transition-all",
                  !showAfter ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                Before State
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={clsx("flex-1 py-3.5 rounded-2xl text-[13px] font-extrabold transition-all",
                  showAfter ? "btn-pro-amber shadow-md" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                After Transformation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

