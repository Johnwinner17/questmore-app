"use client";

import { useState, useEffect } from "react";
import type { ServiceArea } from "@/lib/types";

export function AreasPage({ onBack }: { onBack: () => void }) {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/areas")
      .then(res => res.json())
      .then(data => { setAreas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by state
  const groupedAreas = areas.reduce((acc, area) => {
    if (!acc[area.state]) acc[area.state] = [];
    acc[area.state].push(area);
    return acc;
  }, {} as Record<string, ServiceArea[]>);

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
            <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900">Service Coverage</h1>
            <p className="text-[11.5px] font-medium text-slate-400">Operating across Abuja and major Nigerian regions</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 pb-24">
        {/* Map banner */}
        <div className="rounded-3xl p-6 mb-6 text-center relative overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl mb-3 bg-gradient-to-b from-amber-400 to-amber-500 shadow-md text-[22px]">📍</div>
          <h3 className="text-[18px] font-extrabold text-white tracking-tight">Active Coverage & Expansion</h3>
          <p className="mt-1.5 text-[12.5px] text-slate-300 font-medium max-w-[270px] mx-auto leading-relaxed">
            QuestMore provides verified engineering teams across Abuja and major Nigerian hubs.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl bg-white p-4.5 shadow-sm">
                <div className="h-4 w-1/3 skeleton rounded mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-8 w-20 skeleton rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedAreas).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedAreas).map(([state, stateAreas]) => (
              <div key={state} className="rounded-3xl pro-glass-card pro-card-hover p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="text-[18px]">🏙️</span>
                  <h3 className="text-[15px] font-extrabold text-slate-900">{state}</h3>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    {stateAreas.length} location{stateAreas.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stateAreas.map((area) => (
                    <span
                      key={area.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-[12px] font-bold text-slate-800 shadow-2xs"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#F59E0B" strokeWidth="2.2"/>
                        <circle cx="12" cy="10" r="3" stroke="#F59E0B" strokeWidth="2.2"/>
                      </svg>
                      {area.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-[40px]">📍</span>
            <h3 className="mt-4 text-[16px] font-extrabold text-slate-900">No areas listed</h3>
            <p className="mt-1 text-[12px] font-medium text-slate-400">Check back soon</p>
          </div>
        )}

        {/* Request new area */}
        <div className="mt-6 rounded-3xl pro-glass-card p-5 text-center">
          <p className="text-[13.5px] font-extrabold text-slate-900">Don&apos;t see your location?</p>
          <p className="mt-1 text-[12px] font-medium text-slate-500">Reach out to our operations team — we can assist!</p>
          <a
            href="https://wa.me/2348156307091?text=Hello%20QuestMore!%20Do%20you%20serve%20my%20area?"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-[12.5px] font-bold shadow-md active:scale-95 transition-all"
          >
            Inquire Location on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

