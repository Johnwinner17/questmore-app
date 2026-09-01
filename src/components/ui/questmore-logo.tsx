"use client";

import clsx from "clsx";

interface LogoProps {
  variant?: "full" | "header" | "compact" | "badge" | "dark";
  className?: string;
  showRC?: boolean;
}

export function QuestMoreLogo({
  variant = "full",
  className,
  showRC = true,
}: LogoProps) {
  if (variant === "full") {
    return (
      <div className={clsx("inline-flex flex-col items-start", className)}>
        <img
          src="/questmore_logo.jpg"
          alt="QuestMore Engineering Services Limited - RC: 6907014"
          className="h-10 sm:h-12 w-auto object-contain rounded-lg shadow-2xs"
        />
        {showRC && (
          <span className="text-[9.5px] font-mono font-bold text-slate-500 tracking-wider mt-0.5 ml-1">
            RC: 6907014
          </span>
        )}
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className={clsx("flex items-center gap-2.5", className)}>
        <div className="h-10 w-auto bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
          <img
            src="/questmore_logo.jpg"
            alt="QuestMore Engineering"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-[16px] sm:text-[17px] font-black tracking-tight text-slate-900 leading-tight">
              QuestMore
            </h1>
            <span className="text-[9px] font-mono font-extrabold bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded-md">
              RC: 6907014
            </span>
          </div>
          <p className="text-[9.5px] font-extrabold text-amber-700 tracking-wider uppercase truncate">
            ENGINEERING SERVICES LIMITED
          </p>
        </div>
      </div>
    );
  }

  if (variant === "dark") {
    return (
      <div className={clsx("flex items-center gap-2.5", className)}>
        <div className="h-10 w-auto bg-white/95 p-1 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0">
          <img
            src="/questmore_logo.jpg"
            alt="QuestMore Engineering"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[16px] font-black text-white leading-tight">QuestMore</h1>
            <span className="text-[8.5px] font-mono font-black text-amber-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
              RC: 6907014
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase truncate">
            Engineering Services Limited
          </p>
        </div>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={clsx("inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs", className)}>
        <img
          src="/questmore_logo.jpg"
          alt="QuestMore"
          className="h-6 w-auto object-contain"
        />
        <div className="text-left">
          <p className="text-[11px] font-black text-slate-900 leading-none">QuestMore Engineering</p>
          <p className="text-[8px] font-mono text-slate-400">RC: 6907014</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/questmore_logo.jpg"
      alt="QuestMore Engineering Services Limited (RC: 6907014)"
      className={clsx("h-8 w-auto object-contain rounded-md", className)}
    />
  );
}
