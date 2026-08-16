"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onSelectRole: (role: "client" | "provider") => void;
}

export function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  const [hoveredRole, setHoveredRole] = useState<"client" | "provider" | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto no-scrollbar"
      style={{
        background: "linear-gradient(170deg, #07111F 0%, #0D1929 45%, #0A1420 100%)",
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[380px] w-[380px] rounded-full bg-amber-500/8 blur-[80px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-700/8 blur-[70px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-600/6 blur-[70px]" />
      </div>

      {/* ── Brand Header ── */}
      <div className="relative z-10 flex flex-col items-center pt-12 sm:pt-16 px-6 pb-4">
        {/* Logo mark */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[20px] mb-4 shadow-2xl"
          style={{
            background: "linear-gradient(160deg, #FBBF24 0%, #F59E0B 100%)",
            boxShadow: "0 8px 32px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <span className="text-[28px] font-black text-slate-950 tracking-tighter">Q</span>
        </div>

        <h1 className="text-[30px] font-black text-white tracking-tight leading-none">
          QuestMore
        </h1>
        <p className="mt-2 text-[13px] font-medium text-slate-400 text-center max-w-[280px] leading-relaxed">
          Nigeria&apos;s trusted platform for verified engineering & professional services
        </p>

        {/* Trust badge row */}
        <div className="mt-5 flex items-center gap-3 flex-wrap justify-center">
          {["✓ Verified Experts", "⚡ Fast Response", "🛡️ Secure Payments"].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-slate-300"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Role Selection ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-4 max-w-[440px] w-full mx-auto">
        <p className="text-center text-[11.5px] font-bold text-slate-500 uppercase tracking-[0.16em] mb-5">
          How would you like to continue?
        </p>

        {/* Client Card */}
        <motion.button
          type="button"
          onClick={() => onSelectRole("client")}
          onHoverStart={() => setHoveredRole("client")}
          onHoverEnd={() => setHoveredRole(null)}
          whileTap={{ scale: 0.97 }}
          className="group relative w-full mb-4 overflow-hidden rounded-[28px] p-[1.5px] transition-all duration-300"
          style={{
            background: hoveredRole === "client"
              ? "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, rgba(255,255,255,0.1) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          }}
        >
          <div
            className="relative flex items-center gap-4 rounded-[26px] p-5 text-left w-full"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Icon */}
            <div
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl text-[30px] shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(145deg, #FBBF24 0%, #F59E0B 100%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
            >
              🏠
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-[18px] font-extrabold text-white tracking-tight">I&apos;m a Client</h3>
                <span
                  className="shrink-0 text-[10.5px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.25)" }}
                >
                  Request Service
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-slate-400 leading-snug">
                For property owners & businesses looking to hire certified professionals.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-amber-400">
                <span>Sign in with Google</span>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 px-2 my-1 mb-4">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Provider Card */}
        <motion.button
          type="button"
          onClick={() => onSelectRole("provider")}
          onHoverStart={() => setHoveredRole("provider")}
          onHoverEnd={() => setHoveredRole(null)}
          whileTap={{ scale: 0.97 }}
          className="group relative w-full overflow-hidden rounded-[28px] p-[1.5px] transition-all duration-300"
          style={{
            background: hoveredRole === "provider"
              ? "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, rgba(255,255,255,0.1) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
          }}
        >
          <div
            className="relative flex items-center gap-4 rounded-[26px] p-5 text-left w-full"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Icon */}
            <div
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl text-[30px] shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(145deg, #3B82F6 0%, #6366F1 100%)",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
              }}
            >
              👷
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-[18px] font-extrabold text-white tracking-tight">I&apos;m a Provider</h3>
                <span
                  className="shrink-0 text-[10.5px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#93C5FD", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  Join & Earn
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-slate-400 leading-snug">
                For plumbers, electricians, engineers & artisans ready for verified jobs.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-blue-400">
                <span>Register or Sign In</span>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 flex flex-col items-center pb-8 pt-2 px-6">
        <p className="text-[11px] font-medium text-slate-500 text-center">
          QuestMore Engineering Services © 2026 · Abuja, Nigeria
        </p>
      </div>
    </div>
  );
}
