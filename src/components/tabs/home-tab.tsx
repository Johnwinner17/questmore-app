"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { Category, Service, NavigateFunction } from "@/lib/types";

interface HomeTabProps {
  data: {
    categories: Category[];
    banners: { id: number; title: string; subtitle: string | null; imageUrl: string | null }[];
    featured: Service[];
    reviews: { id: number; clientName: string; rating: number; comment: string | null; location: string | null }[];
  };
  onNavigate: NavigateFunction;
  onSwitchToExplore: () => void;
}

export function HomeTab({ data, onNavigate, onSwitchToExplore }: HomeTabProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    if (data.banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % data.banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [data.banners.length]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50">
      <div className="safe-top" />

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-20 bg-surface-50/95 backdrop-blur-md px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 shadow-md shadow-amber-400/20">
            <span className="text-[18px] font-black text-slate-950">Q</span>
          </div>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-slate-900 leading-none">QuestMore</h1>
            <p className="text-[9.5px] font-extrabold text-amber-700 tracking-wider uppercase mt-1">ENGINEERING & SERVICES</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate({ type: "notifications" })}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 transition-transform active:scale-95"
            aria-label="Notifications"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>
        </div>
      </header>

      <div className="px-5 pb-28 space-y-6 pt-3">
        {/* ─── IMMERSIVE PREMIUM HERO CARD ─── */}
        <div
          className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-200/90 bg-white"
          style={{
            minHeight: "380px",
          }}
        >
          {/* Integrated Engineering Scene Background (Upper & Right Half) */}
          <div className="absolute right-0 top-0 bottom-0 w-[72%] sm:w-[60%] pointer-events-none overflow-hidden select-none">
            <img
              src="/hero_engineering.jpg"
              alt="Civil & Structural Engineering Site"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover object-center sm:object-right transition-transform duration-700 ease-out"
              style={{
                maskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 12%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,1) 100%)",
                WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 12%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,1) 100%)",
              }}
            />
            {/* Smooth gradient overlay covering the left text area & bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0.94) 22%, rgba(255,255,255,0.4) 48%, rgba(255,255,255,0) 78%), linear-gradient(to top, #FFFFFF 0%, rgba(255,255,255,0.8) 10%, rgba(255,255,255,0) 30%)",
              }}
            />
          </div>

          {/* Left Hero Content */}
          <div className="relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white mb-4 shadow-sm border border-slate-800">
              <span className="text-amber-400 font-black text-xs">🛡️</span>
              <span className="text-[11px] font-extrabold tracking-tight">Verified Engineering Platform</span>
            </div>

            {/* Headline & Description */}
            <div className="max-w-[78%] sm:max-w-[56%]">
              <h2 className="text-[23px] sm:text-[27px] font-black text-slate-950 leading-[1.18] tracking-tight">
                Engineering & Technical Services in Nigeria
              </h2>
              <p className="mt-3 text-[13px] text-slate-600 leading-relaxed font-medium">
                Connect with verified artisans, licensed technicians, and construction engineers with QA warranties.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="relative z-10 pt-6 mt-4 border-t border-slate-200/70 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={onSwitchToExplore}
              className="rounded-2xl btn-pro-amber px-6 py-3 text-[13.5px] font-black shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Services</span>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <div className="flex items-center gap-2 text-[11.5px] font-extrabold text-slate-700 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">★ 4.9</span>
              <span>· 5,000+ Completed Jobs</span>
            </div>
          </div>
        </div>

        {/* ─── BANNER CAROUSEL ─── */}
        {data.banners.length > 0 && (
          <div>
            <div className="relative overflow-hidden rounded-[26px] aspect-[2/1] shadow-md border border-slate-200/60">
              {data.banners.map((banner, i) => (
                <div
                  key={banner.id}
                  className={clsx(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    i === activeBanner ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  )}
                >
                  {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-[17px] font-black text-white leading-snug">{banner.title}</h3>
                    {banner.subtitle && <p className="mt-1 text-[12px] text-slate-300 line-clamp-1 font-medium">{banner.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
            {data.banners.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {data.banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBanner(i)}
                    className={clsx("rounded-full transition-all duration-300", i === activeBanner ? "w-6 h-1.5 bg-amber-500" : "w-1.5 h-1.5 bg-slate-300")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── WHY QUESTMORE ─── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-black tracking-tight text-slate-900">Why QuestMore?</h3>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Quality Verified</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "🛡️", label: "Verified", sub: "Trade Certified" },
              { icon: "⚡", label: "Fast Dispatch", sub: "Under 24 Hours" },
              { icon: "✨", label: "Warranty", sub: "Client Protected" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center rounded-2xl bg-white border border-slate-200/80 p-3.5 text-center shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-[20px] mb-1.5">
                  {item.icon}
                </div>
                <p className="text-[12.5px] font-black text-slate-900">{item.label}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <div>
          <h3 className="text-[16px] font-black tracking-tight text-slate-900 mb-3">How It Works</h3>
          <div className="space-y-2.5">
            {[
              { step: "01", title: "Select Services", desc: "Choose single or bundled engineering tasks to add to your cart" },
              { step: "02", title: "Submit & Secure Fee", desc: "Pay fixed booking fee or inquiry fee to confirm site schedule" },
              { step: "03", title: "Admin Review & Specialist Dispatch", desc: "Admin reviews scope and assigns certified technician to execute work" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3.5 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-amber-400 font-black text-[12px] shadow-sm">
                  {item.step}
                </div>
                <div className="pt-0.5">
                  <p className="text-[13.5px] font-black text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CLIENT TESTIMONIALS ─── */}
        {data.reviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-black tracking-tight text-slate-900">Client Reviews</h3>
              <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">★ 4.9 Rating</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {data.reviews.map((review) => (
                <div key={review.id} className="flex-shrink-0 w-[275px] rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i} className="text-amber-500 text-[12px]">★</span>
                      ))}
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-slate-600 font-medium line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                  </div>
                  <div className="mt-3.5 flex items-center gap-2.5 pt-3 border-t border-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-amber-400 text-[11px] font-black">
                      {review.clientName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900">{review.clientName}</p>
                      {review.location && <p className="text-[10px] font-medium text-slate-400">{review.location}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── BOTTOM CTA ─── */}
        <div
          className="rounded-[28px] p-6 text-center relative overflow-hidden shadow-xl text-white border border-slate-800"
          style={{ background: "linear-gradient(135deg, #07111F 0%, #0F1D30 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl mb-3 bg-amber-400 text-slate-950 font-black shadow-md text-xl">
            ⚡
          </div>
          <h3 className="text-[18px] font-black text-white tracking-tight">Need an Engineering Specialist?</h3>
          <p className="mt-1.5 text-[12.5px] text-slate-300 max-w-[280px] mx-auto leading-relaxed font-medium">
            Submit your job request now and QuestMore will assign certified professionals.
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ type: "request" })}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl btn-pro-amber px-6 py-3.5 text-[13.5px] font-black shadow-lg"
          >
            <span>Request a Service Now</span>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
