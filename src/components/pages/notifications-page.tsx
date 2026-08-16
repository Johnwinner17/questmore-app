"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { Notification } from "@/lib/types";

const typeIcons: Record<string, string> = {
  request_update: "📋",
  promotion: "🎉",
  system: "🔔",
};

const typeColors: Record<string, string> = {
  request_update: "bg-blue-50 border-blue-100",
  promotion: "bg-amber-50 border-amber-100",
  system: "bg-surface-50 border-surface-100",
};

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then(res => res.json())
      .then(data => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-[11.5px] font-bold text-amber-600">{unreadCount} unread updates</p>
            )}
          </div>
          {notifications.length > 0 && (
            <button className="text-[12px] font-extrabold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 transition-all active:scale-95">
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="px-5 py-5 pb-24">
        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl bg-white p-4.5 shadow-sm">
                <div className="h-4 w-3/4 skeleton rounded mb-2" />
                <div className="h-3 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={clsx(
                  "rounded-3xl pro-glass-card pro-card-hover p-4.5 transition-all",
                  !notif.read ? "border-amber-400/60 shadow-md" : "opacity-80"
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-slate-900 border border-amber-200/60 shadow-2xs">
                    <span className="text-[20px]">{typeIcons[notif.type || "system"]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-extrabold text-slate-900">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-200 mt-1" />
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] font-medium text-slate-500 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="mt-2 text-[10.5px] font-bold text-slate-400">
                      Just now
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl pro-glass-card shadow-sm">
              <span className="text-[36px]">🔔</span>
            </div>
            <h3 className="mt-4 text-[16px] font-extrabold text-slate-900">No notifications yet</h3>
            <p className="mt-1.5 text-[12px] font-medium text-slate-400 max-w-[240px] leading-relaxed">
              When you have updates on your engineering service requests, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

