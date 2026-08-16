"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { FAQ } from "@/lib/types";

export function FAQPage({ onBack }: { onBack: () => void }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/faqs")
      .then(res => res.json())
      .then(data => { setFaqs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

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
            <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900">Frequently Asked Questions</h1>
            <p className="text-[11.5px] font-medium text-slate-400">Everything you need to know about QuestMore</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 pb-24">
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-3xl bg-white p-4.5 shadow-sm">
                <div className="h-4 w-3/4 skeleton rounded mb-2" />
                <div className="h-3 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          <div className="space-y-3.5">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-3xl pro-glass-card pro-card-hover overflow-hidden"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-start gap-3.5 p-4.5 text-left"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-slate-900 mt-0.5 border border-amber-200/60 shadow-2xs">
                    <span className="text-[12px]">❓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-extrabold text-slate-900 pr-4 leading-snug">
                      {faq.question}
                    </p>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    className={clsx(
                      "shrink-0 text-slate-400 transition-transform duration-300",
                      expanded === faq.id && "rotate-180 text-amber-500"
                    )}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div
                  className={clsx(
                    "overflow-hidden transition-all duration-300 ease-out",
                    expanded === faq.id ? "max-h-96" : "max-h-0"
                  )}
                >
                  <div className="px-4.5 pb-4.5 pt-0">
                    <div className="pl-9 border-l-2 border-amber-400 ml-3">
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-[40px]">📚</span>
            <h3 className="mt-4 text-[16px] font-extrabold text-slate-900">No FAQs found</h3>
            <p className="mt-1 text-[12px] font-medium text-slate-400">Check back soon</p>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-8 rounded-3xl p-6 text-center relative overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}>
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl mb-4 bg-gradient-to-b from-amber-400 to-amber-500 shadow-md text-[24px]">💬</div>
          <h3 className="text-[18px] font-extrabold text-white tracking-tight">Still have questions?</h3>
          <p className="mt-1.5 text-[12.5px] text-slate-300 font-medium max-w-[260px] mx-auto leading-relaxed">Chat directly with our support team on WhatsApp</p>
          <a
            href="https://wa.me/2348156307091"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl btn-pro-amber px-6 py-3.5 text-[13.5px] font-extrabold shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

