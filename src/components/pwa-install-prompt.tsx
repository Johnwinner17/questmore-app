"use client";

import { useEffect, useState, useCallback } from "react";

type Platform = "ios" | "android" | "desktop" | "unknown";
type Phase = "idle" | "banner" | "ios-guide" | "installing" | "installed" | "success";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|macintosh|linux/.test(ua)) return "desktop";
  return "unknown";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem("qm_pwa_dismissed");
    if (!ts) return false;
    const hours = (Date.now() - Number(ts)) / 3_600_000;
    return hours < 72; // 3-day cool-down
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [iosStep, setIosStep] = useState(0);

  const dismiss = useCallback((remember = true) => {
    setPhase("idle");
    if (remember) {
      try { localStorage.setItem("qm_pwa_dismissed", String(Date.now())); } catch {}
    }
  }, []);

  useEffect(() => {
    const plt = detectPlatform();
    setPlatform(plt);

    // Already installed or dismissed — do nothing
    if (isInStandaloneMode() || isDismissedRecently()) return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("[QM PWA] SW registered:", reg.scope))
        .catch((err) => console.warn("[QM PWA] SW registration failed:", err));
    }

    // iOS: show manual guide after 5s
    if (plt === "ios") {
      // Only show on iOS Safari (not Chrome on iOS)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        const timer = setTimeout(() => setPhase("banner"), 5000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Android / Desktop: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 4s so user is settled
      const timer = setTimeout(() => setPhase("banner"), 4000);
      return () => clearTimeout(timer);
    };

    const installedHandler = () => {
      setPhase("success");
      setTimeout(() => setPhase("idle"), 3000);
    };

    const manualOpenHandler = () => {
      const currentPlt = detectPlatform();
      setPlatform(currentPlt);
      if (currentPlt === "ios") {
        setIosStep(0);
        setPhase("ios-guide");
      } else {
        setPhase("banner");
      }
    };

    window.addEventListener("open-pwa-install", manualOpenHandler);
    window.addEventListener("beforeinstallprompt", handler as any);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("open-pwa-install", manualOpenHandler);
      window.removeEventListener("beforeinstallprompt", handler as any);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setPhase("installing");

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        setPhase("success");
        setTimeout(() => setPhase("idle"), 3500);
      } else {
        dismiss(false); // Declined — don't record as dismissed
        setPhase("idle");
      }
    } catch {
      setPhase("idle");
    }
  };

  const startIosGuide = () => {
    setIosStep(0);
    setPhase("ios-guide");
  };

  if (phase === "idle") return null;

  // ── Success Toast ──────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border border-emerald-500/30"
        style={{ background: "linear-gradient(135deg, #064E3B, #065F46)", animation: "slideUpFade 0.4s ease-out both" }}
      >
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-[13.5px] font-black text-white">QuestMore Installed!</p>
          <p className="text-[11px] text-emerald-300 font-medium">Find it on your Home Screen</p>
        </div>
        <style>{successStyle}</style>
      </div>
    );
  }

  // ── iOS Step-by-Step Guide ────────────────────────────────────────────────
  if (phase === "ios-guide") {
    const iosSteps = [
      {
        icon: "⬆️",
        title: "Tap the Share button",
        desc: "Find the Share icon (box with arrow) in your Safari toolbar at the bottom of the screen.",
        hint: "It looks like a square with an upward arrow",
      },
      {
        icon: "📲",
        title: "Tap ‘Add to Home Screen’",
        desc: "Scroll down in the Share sheet and tap ‘Add to Home Screen’ from the list of options.",
        hint: "It has a plus icon and a home screen icon next to it",
      },
      {
        icon: "✅",
        title: "Tap ‘Add’ to confirm",
        desc: "The app name will appear as ‘QuestMore’. Tap Add in the top-right corner to confirm.",
        hint: "QuestMore will appear on your Home Screen instantly",
      },
    ];

    const step = iosSteps[iosStep];
    const isLast = iosStep === iosSteps.length - 1;

    return (
      <>
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={() => dismiss()} />
        <div
          className="fixed bottom-0 left-0 right-0 z-[151] p-4 sm:p-6"
          style={{ animation: "slideUpFade 0.35s ease-out both" }}
        >
          <div className="max-w-sm mx-auto rounded-[28px] overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, #0E1F36 0%, #07111F 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B 0%, #F97316 50%, #8B5CF6 100%)" }} />

            <div className="p-5">
              {/* Step counter */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {iosSteps.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === iosStep ? "24px" : "8px",
                        background: i <= iosStep ? "#F59E0B" : "rgba(255,255,255,0.15)"
                      }}
                    />
                  ))}
                </div>
                <button onClick={() => dismiss()} className="text-slate-500 hover:text-slate-300 text-[13px] font-bold transition-colors">
                  Skip
                </button>
              </div>

              {/* Step icon */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[28px]"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  {step.icon}
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">
                    Step {iosStep + 1} of {iosSteps.length}
                  </div>
                  <h3 className="text-[16px] font-black text-white leading-tight">{step.title}</h3>
                </div>
              </div>

              <p className="text-[13px] text-slate-300 font-medium leading-relaxed mb-2">{step.desc}</p>
              <p className="text-[11px] text-slate-500 font-medium mb-5 flex items-center gap-1.5">
                <span className="text-amber-500">💡</span> {step.hint}
              </p>

              {/* Safari bottom bar illustration */}
              {iosStep === 0 && (
                <div className="mb-5 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono truncate flex-1">questmore.app</span>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-[10px] text-slate-600">◀</span>
                      <span className="text-[10px] text-slate-600">▶</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg animate-pulse"
                        style={{ background: "rgba(245,158,11,0.25)", border: "1.5px solid #F59E0B" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2v14M5 9l7-7 7 7" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 21h16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-600">⊟</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                {iosStep > 0 && (
                  <button
                    onClick={() => setIosStep(s => s - 1)}
                    className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-slate-400 transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isLast) { dismiss(); setPhase("success"); }
                    else setIosStep(s => s + 1);
                  }}
                  className="flex-[2] py-3 rounded-2xl text-[13.5px] font-black text-slate-950 transition-all active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}
                >
                  {isLast ? "🏠 Done!" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <style>{slideStyle}</style>
      </>
    );
  }

  // ── Main Install Banner (Android / Desktop Chrome) ────────────────────────
  const isInstalling = phase === "installing";

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/25 backdrop-blur-[3px]" onClick={() => dismiss()} />

      <div
        className="fixed bottom-0 left-0 right-0 z-[151] p-4 sm:p-6"
        style={{ animation: "slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div
          className="max-w-sm mx-auto rounded-[28px] overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg, #0E1F36 0%, #07111F 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Rainbow bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B 0%, #F97316 33%, #EF4444 66%, #8B5CF6 100%)" }} />

          <div className="p-5 pb-6">
            {/* Header row */}
            <div className="flex items-center gap-4 mb-5">
              {/* Icon with glow ring */}
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl blur-lg opacity-40"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}
                />
                <div
                  className="relative flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-[30px] font-black text-slate-950 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
                >
                  Q
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[9.5px] font-black text-amber-400 uppercase tracking-[0.15em] mb-0.5">
                  Free App · No App Store Required
                </div>
                <h3 className="text-[18px] font-black text-white leading-tight tracking-tight">
                  Install QuestMore
                </h3>
                <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                  Get the full app experience
                </p>
              </div>

              <button
                onClick={() => dismiss()}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-[18px] shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Benefits list */}
            <div
              className="rounded-2xl p-3.5 mb-5 space-y-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: "⚡", label: "Instant access", sub: "No browser address bar, full screen" },
                { icon: "🔔", label: "Job alerts", sub: "Get notified when status changes" },
                { icon: "📶", label: "Offline ready", sub: "Browse even with poor network" },
                { icon: "🏠", label: "Home screen shortcut", sub: "Open like a native app" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[18px] w-7 text-center flex-shrink-0">{b.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[12.5px] font-bold text-white">{b.label}</span>
                    <span className="text-[11px] text-slate-500 font-medium"> — {b.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex gap-2.5">
              <button
                onClick={() => dismiss()}
                className="flex-1 py-3 rounded-2xl text-[12.5px] font-bold text-slate-400 transition-all hover:text-slate-300"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                Not now
              </button>
              <button
                onClick={platform === "ios" ? startIosGuide : handleInstall}
                disabled={isInstalling}
                className="flex-[2.5] py-3 rounded-2xl text-[14px] font-black text-slate-950 shadow-xl transition-all active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: isInstalling ? "#94A3B8" : "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
              >
                {isInstalling ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 20"/>
                    </svg>
                    Installing…
                  </>
                ) : (
                  <>📲 Install Free App</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{slideStyle}</style>
    </>
  );
}

const slideStyle = `
  @keyframes slideUpFade {
    from { transform: translateY(110%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
`;

const successStyle = `
  @keyframes slideUpFade {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
  }
`;
