"use client";

import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import type { ServiceRequest, User } from "@/lib/types";
import { JobProgressModal } from "@/components/jobs/job-progress-modal";

const categoryIcons: Record<string, string> = {
  building: "🏗️", zap: "⚡", droplets: "🔧", home: "🏠", wrench: "🛠️", "hard-hat": "👷",
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  request_submitted:   { label: "Submitted",           color: "text-slate-700",   bg: "bg-slate-100 border-slate-200",     dot: "bg-slate-400" },
  awaiting_admin_review: { label: "Pending Admin Review", color: "text-orange-800",  bg: "bg-orange-50 border-orange-200",   dot: "bg-orange-400 animate-pulse" },
  payment_verified:    { label: "Payment Verified",     color: "text-blue-800",    bg: "bg-blue-50 border-blue-200",        dot: "bg-blue-500" },
  awaiting_assignment: { label: "Awaiting Assignment",  color: "text-indigo-800",  bg: "bg-indigo-50 border-indigo-200",    dot: "bg-indigo-400 animate-pulse" },
  provider_assigned:   { label: "Provider Assigned",    color: "text-purple-800",  bg: "bg-purple-50 border-purple-200",    dot: "bg-purple-500" },
  provider_accepted:   { label: "Provider Accepted",    color: "text-sky-800",     bg: "bg-sky-50 border-sky-200",          dot: "bg-sky-500" },
  work_in_progress:    { label: "Work In Progress",     color: "text-amber-900",   bg: "bg-amber-50 border-amber-300",      dot: "bg-amber-500 animate-pulse" },
  work_completed:      { label: "Action Required",      color: "text-emerald-900", bg: "bg-emerald-100 border-emerald-400", dot: "bg-emerald-500 animate-pulse" },
  client_confirmation: { label: "Awaiting Confirmation",color: "text-emerald-800", bg: "bg-emerald-50 border-emerald-300", dot: "bg-emerald-400" },
  completed:           { label: "Completed",            color: "text-emerald-800", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500" },
  cancelled:           { label: "Cancelled",            color: "text-red-800",     bg: "bg-red-50 border-red-200",          dot: "bg-red-400" },
};

// 8-stage pipeline for progress dots
const STAGES = [
  { key: "request_submitted",    label: "Submitted" },
  { key: "awaiting_admin_review", label: "Review" },
  { key: "awaiting_assignment",  label: "Approval" },
  { key: "provider_assigned",    label: "Assigned" },
  { key: "provider_accepted",    label: "Accepted" },
  { key: "work_in_progress",     label: "In Progress" },
  { key: "work_completed",       label: "Done" },
  { key: "completed",            label: "Confirmed" },
];

const stageIndex = (statusKey: string) =>
  STAGES.findIndex(s => s.key === statusKey) ?? 0;

export function ActivityTab({ currentUser }: { currentUser?: User | null }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [activeJobModal, setActiveJobModal] = useState<ServiceRequest | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const emailParam = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : "";
      const res = await fetch(`/api/requests${emailParam}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleConfirmCompletion = async (requestId: number) => {
    try {
      const res = await fetch("/api/request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_completion", requestId }),
      });
      if (res.ok) {
        loadRequests();
        if (activeJobModal && activeJobModal.id === requestId) {
          setActiveJobModal(prev => prev ? { ...prev, jobStatus: "completed", status: "completed", clientConfirmed: true } : null);
        }
      }
    } catch (e) {}
  };

  const filteredRequests = requests.filter(r => {
    const isDone = r.jobStatus === "completed" || r.status === "completed" || r.status === "cancelled";
    if (filter === "all") return true;
    if (filter === "active") return !isDone;
    return isDone;
  });

  return (
    <div className="h-full flex flex-col bg-surface-50 overflow-hidden">
      <div className="safe-top bg-surface-50" />

      {/* ─── FIXED HEADER (Never scrolls) ─── */}
      <header className="flex-shrink-0 bg-surface-50/95 backdrop-blur-md border-b border-slate-200/60 z-20">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[21px] font-black tracking-tight text-slate-900 leading-none">My Activity</h1>
            <p className="text-[11px] font-medium text-slate-400 mt-1">Real-time request & job tracking</p>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Refresh
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-5 pb-3">
          {(["all", "active", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx(
                "rounded-xl px-4 py-1.5 text-[12px] font-extrabold transition-all duration-200 active:scale-[0.97]",
                filter === f
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200/70 hover:bg-slate-50"
              )}
            >
              {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
            </button>
          ))}
          {filteredRequests.length > 0 && (
            <span className="ml-auto self-center text-[11px] font-bold text-slate-400">
              {filteredRequests.length} {filteredRequests.length === 1 ? "job" : "jobs"}
            </span>
          )}
        </div>
      </header>

      {/* ─── SCROLLABLE BODY (Scrolls underneath fixed header) ─── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 pb-40 space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 p-4 shadow-xs">
                <div className="flex gap-3 mb-3">
                  <div className="h-11 w-11 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                  </div>
                  <div className="h-6 w-24 skeleton rounded-full" />
                </div>
                <div className="h-1.5 w-full skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const statusKey = req.jobStatus || req.status || "request_submitted";
              const status = statusConfig[statusKey] || statusConfig.request_submitted;
              const isWorkCompleted = req.jobStatus === "work_completed" && !req.clientConfirmed;
              const isAdminReview = statusKey === "awaiting_admin_review";
              const isNegotiableRequest = (() => {
                try {
                  const svcs = typeof req.selectedServices === "string" ? JSON.parse(req.selectedServices) : (req.selectedServices || []);
                  return Array.isArray(svcs) && svcs.some((s: any) => s.isNegotiable || !s.price);
                } catch { return false; }
              })();
              const currentStage = stageIndex(statusKey);
              const isDone = statusKey === "completed" || statusKey === "cancelled";

              return (
                <div key={req.id} className={clsx(
                  "rounded-2xl bg-white border shadow-xs overflow-hidden transition-all",
                  isWorkCompleted ? "border-emerald-300" : "border-slate-200/80"
                )}>
                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 text-[20px]">
                        {categoryIcons[req.categoryIcon || "building"] || "📋"}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10.5px] font-mono font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                                {req.requestCode || `QM-REQ-${req.id}`}
                              </span>
                            </div>
                            <p className="text-[13.5px] font-bold text-slate-900 mt-0.5 truncate">
                              {req.categoryName || "Engineering Request"}
                            </p>
                            <p className="text-[11.5px] text-slate-500 font-medium mt-0.5 line-clamp-1">{req.description}</p>
                          </div>

                          {/* Status badge */}
                          <span className={clsx(
                            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold",
                            status.bg, status.color
                          )}>
                            <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", status.dot)} />
                            {status.label}
                          </span>
                        </div>

                        {/* Amount + location row */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                          {req.location && (
                            <span className="flex items-center gap-1">
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#94A3B8" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="#94A3B8" strokeWidth="2"/></svg>
                              {req.location}
                            </span>
                          )}
                          <span className="font-bold text-slate-700">
                            ₦{(req.totalAmount || 5000).toLocaleString()} paid
                          </span>
                          {(() => {
                            try {
                              const photos = (req as any).milestonePhotos ? JSON.parse((req as any).milestonePhotos) : [];
                              if (Array.isArray(photos) && photos.length > 0) {
                                return (
                                  <span className="inline-flex items-center gap-1 font-extrabold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md text-[10px]">
                                    📸 {photos.length} site {photos.length === 1 ? "photo" : "photos"}
                                  </span>
                                );
                              }
                            } catch {}
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Progress pipeline bar */}
                    {!isDone && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-0">
                          {STAGES.slice(0, -1).map((stage, idx) => {
                            const filled = idx <= currentStage;
                            const isActive = idx === currentStage;
                            return (
                              <div key={stage.key} className="flex-1 flex flex-col items-center">
                                <div className={clsx(
                                  "h-1 w-full rounded-full transition-all duration-500",
                                  filled ? "bg-amber-400" : "bg-slate-200"
                                )} />
                                {isActive && (
                                  <span className="mt-1 text-[9px] font-bold text-amber-700 whitespace-nowrap">{stage.label}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Assigned provider badge */}
                    {req.providerName && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11.5px]">
                        <div className="flex items-center gap-1.5">
                          <span>👷</span>
                          <span className="font-bold text-slate-800">{req.providerName}</span>
                          {req.providerProfession && <span className="text-slate-400">· {req.providerProfession}</span>}
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">✓ Assigned</span>
                      </div>
                    )}

                    {/* Admin review banner for negotiable */}
                    {isAdminReview && isNegotiableRequest && (
                      <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-[11.5px] text-blue-900 font-medium">
                        🤝 <span className="font-bold">Negotiable request under review.</span> Admin will reply with the actual job cost. You'll be notified to pay the quoted amount before a provider is assigned.
                      </div>
                    )}

                    {/* Admin review banner (general) */}
                    {isAdminReview && !isNegotiableRequest && (
                      <div className="mt-3 rounded-xl bg-orange-50 border border-orange-200 p-2.5 text-[11.5px] text-orange-900 font-medium">
                        ⏳ <span className="font-bold">Pending admin review.</span> Your request and payment are being reviewed. Admin will approve and assign a specialist shortly.
                      </div>
                    )}
                  </div>

                  {/* Work completed confirmation banner */}
                  {isWorkCompleted && (
                    <div className="px-4 pb-3">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[12px] text-emerald-900 font-bold">
                          <span>🔔</span>
                          <span>Provider finished. Please confirm job completion.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveJobModal(req)}
                          className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl shadow-xs"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status note */}
                  {req.statusNote && !isWorkCompleted && !isAdminReview && (
                    <div className="px-4 pb-3">
                      <div className={clsx("rounded-xl p-2.5 border text-[11px] font-medium text-slate-600 leading-relaxed", status.bg)}>
                        {req.statusNote}
                      </div>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex border-t border-slate-100 bg-slate-50/60">
                    <button
                      type="button"
                      onClick={() => setActiveJobModal(req)}
                      className="flex-1 py-2.5 text-[11.5px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      View Progress
                    </button>
                    <div className="w-px bg-slate-200/60" />
                    {req.providerPhone ? (
                      <a
                        href={`https://wa.me/${req.providerPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 text-[11.5px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Contact
                      </a>
                    ) : (
                      <a
                        href="https://wa.me/2348156307091"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 text-[11.5px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Support
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-xs mb-5">
              <span className="text-[38px]">📋</span>
            </div>
            <h3 className="text-[17px] font-black text-slate-900">
              {filter === "all" ? "No activity yet" : `No ${filter} jobs`}
            </h3>
            <p className="mt-2 text-[12.5px] text-slate-500 font-medium max-w-[260px] leading-relaxed">
              {filter === "all"
                ? "Submit a service request and your real-time 8-stage progress tracker will appear here."
                : `You don't have any ${filter} jobs right now.`}
            </p>
          </div>
        )}
      </div>

      {/* Progress Modal */}
      {activeJobModal && (
        <JobProgressModal
          request={activeJobModal}
          onClose={() => setActiveJobModal(null)}
          onConfirmCompletion={handleConfirmCompletion}
        />
      )}
    </div>
  );
}
