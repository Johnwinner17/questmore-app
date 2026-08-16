"use client";

import { useState } from "react";
import clsx from "clsx";

const slides = [
  { icon: "🏗️", title: "Welcome to QuestMore", description: "Nigeria's trusted platform for professional engineering, construction, and property services.", bg: "from-brand-700 to-brand-900" },
  { icon: "✅", title: "Verified Professionals", description: "Every professional is background-checked, skill-verified, and committed to delivering quality work.", bg: "from-emerald-600 to-emerald-800" },
  { icon: "⚡", title: "Fast & Efficient", description: "Browse services, submit a request, and get matched with the right professional within 24 hours.", bg: "from-amber-500 to-amber-700" },
  { icon: "🛡️", title: "Quality Guaranteed", description: "Your satisfaction is our priority. All work meets professional standards with our assurance.", bg: "from-indigo-600 to-indigo-800" },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={{ height: "100dvh", background: "linear-gradient(160deg, #0F2040 0%, #111827 50%, #0A1628 100%)" }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="safe-top" />
      <div className="flex justify-end p-5 relative z-10">
        <button onClick={onComplete} className="text-[13px] font-bold text-slate-400 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors active:bg-white/10">Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 relative z-10">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl mb-8 transition-all duration-500" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
          <span className="text-[56px]">{slides[currentSlide].icon}</span>
        </div>
        <h2 className="text-[26px] font-extrabold text-white text-center tracking-tight mb-3.5">{slides[currentSlide].title}</h2>
        <p className="text-[14.5px] font-medium text-slate-300 text-center leading-relaxed max-w-[320px]">{slides[currentSlide].description}</p>
      </div>
      <div className="px-6 pb-8 safe-bottom relative z-10">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div key={i} className={clsx("rounded-full transition-all duration-300", i === currentSlide ? "w-8 h-2.5 bg-amber-400 shadow-sm" : i < currentSlide ? "w-2.5 h-2.5 bg-amber-400/50" : "w-2.5 h-2.5 bg-white/20")} />
          ))}
        </div>
        <button onClick={nextSlide} className="w-full rounded-2xl py-4 text-[15px] font-black btn-pro-amber shadow-xl">
          {currentSlide < slides.length - 1 ? "Continue" : "Get Started"}
        </button>
      </div>
    </div>
  );
}

