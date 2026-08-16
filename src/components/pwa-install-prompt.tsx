"use client";

import { useEffect, useState, useCallback } from "react";

type Platform = "ios" | "android" | "desktop" | "unknown";
type Phase = "idle" | "banner" | "ios-guide" | "installing" | "success";

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
    return hours < 48;
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const dismiss = useCallback((remember = true) => {
    setPhase("idle");
    if (remember) {
      try { localStorage.setItem("qm_pwa_dismissed", String(Date.now())); } catch {}
    }
  }, []);

  useEffect(() => {
    const plt = detectPlatform();
    setPlatform(plt);

    // If already launched as a standalone PWA on Home Screen, do nothing
    if (isInStandaloneMode() || isDismissedRecently()) return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // On iOS Safari, show prompt after 4 seconds
    if (plt === "ios") {
      const timer = setTimeout(() => setPhase("banner"), 4000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const timer = setTimeout(() => setPhase("banner"), 3500);
      return () => clearTimeout(timer);
    };

    const installedHandler = () => {
      setPhase("success");
      setTimeout(() => setPhase("idle"), 3500);
    };

    const manualOpenHandler = () => {
      const currentPlt = detectPlatform();
      setPlatform(currentPlt);
      if (currentPlt === "ios") {
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
    if (platform === "ios") {
      setPhase("ios-guide");
      return;
    }

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
        dismiss(false);
      }
    } catch {
      setPhase("idle");
    }
  };

  if (phase === "idle") return null;

  // ── Success Toast (Android / Chrome native install only) ───────────────────
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
      </div>
    );
  }

  // ── iOS Full Visual Guide (Crystal Clear for Apple Safari) ─────────────────
  if (phase === "ios-guide") {
    return (
      <>
        <div className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-md" onClick={() => dismiss()} />
        <div
          className="fixed bottom-0 left-0 right-0 z-[151] p-4 sm:p-6"
          style={{ animation: "slideUpFade 0.35s ease-out both" }}
        >
          <div
            className="max-w-sm mx-auto rounded-[28px] overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, #0E1F36 0%, #07111F 100%)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {/* Top gradient bar */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #F59E0B 0%, #F97316 50%, #8B5CF6 100%)" }} />

            <div className="p-5 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-[22px] font-black text-slate-950 shadow-md"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}
                  >
                    Q
                  </div>
                  <div>
                    <span className="text-[9.5px] font-black text-amber-400 uppercase tracking-widest">
                      iPhone / iPad Setup
                    </span>
                    <h3 className="text-[16.5px] font-black text-white leading-tight">
                      Add to Your iPhone
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => dismiss()}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Instructions Box */}
              <div className="rounded-2xl p-4 mb-4 space-y-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[12px] mt-0.5">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      Tap the <strong className="text-amber-400">Share</strong> icon (⬆️)
                    </p>
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      Look at the bottom toolbar of Safari on your phone.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[12px] mt-0.5">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      Tap <strong className="text-amber-400">&apos;Add to Home Screen&apos;</strong>
                    </p>
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      Scroll down in the menu list to find the ➕ plus icon.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[12px] mt-0.5">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      Tap <strong className="text-amber-400">&apos;Add&apos;</strong> at top right
                    </p>
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      QuestMore icon will appear directly on your Home Screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom pointer cue */}
              <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-3 mb-4 text-center animate-pulse">
                <p className="text-[12px] font-black text-amber-300 flex items-center justify-center gap-1.5">
                  <span>⬇️</span> Tap the Share button at bottom of screen <span>⬇️</span>
                </p>
              </div>

              <button
                onClick={() => dismiss()}
                className="w-full py-3 rounded-2xl text-[13.5px] font-black text-slate-950 shadow-lg transition-all active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
              >
                Got It — I&apos;ll Tap Share Now
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Initial Install Banner ────────────────────────────────────────────────
  const isInstalling = phase === "installing";

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/25 backdrop-blur-[2px]" onClick={() => dismiss()} />

      <div
        className="fixed bottom-0 left-0 right-0 z-[151] p-4 sm:p-6"
        style={{ animation: "slideUpFade 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div
          className="max-w-sm mx-auto rounded-[28px] overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg, #0E1F36 0%, #07111F 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #F59E0B 0%, #F97316 33%, #EF4444 66%, #8B5CF6 100%)" }} />

          <div className="p-5 pb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl blur-lg opacity-40"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)" }}
                />
                <div
                  className="relative flex h-[56px] w-[56px] items-center justify-center rounded-2xl text-[28px] font-black text-slate-950 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
                >
                  Q
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[9.5px] font-black text-amber-400 uppercase tracking-[0.15em] mb-0.5">
                  Free App · No Store Needed
                </div>
                <h3 className="text-[17.5px] font-black text-white leading-tight tracking-tight">
                  Install QuestMore App
                </h3>
                <p className="text-[11.5px] text-slate-400 font-medium mt-0.5">
                  Add to your phone Home Screen
                </p>
              </div>

              <button
                onClick={() => dismiss()}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-[18px] shrink-0"
              >
                ✕
              </button>
            </div>

            <div
              className="rounded-2xl p-3.5 mb-4 space-y-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: "⚡", label: "Instant 1-tap launch from Home Screen" },
                { icon: "🔔", label: "Real-time job status notifications" },
                { icon: "📶", label: "Works offline when network is low" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2.5 text-[12.5px] text-slate-200 font-medium">
                  <span className="text-[16px] shrink-0">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => dismiss()}
                className="flex-1 py-3 rounded-2xl text-[12.5px] font-bold text-slate-400 transition-all hover:text-slate-300"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-[2.2] py-3 rounded-2xl text-[13.5px] font-black text-slate-950 shadow-xl transition-all active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: isInstalling ? "#94A3B8" : "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
              >
                {platform === "ios" ? "📲 Add to Home Screen" : isInstalling ? "Installing…" : "📲 Install App"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
