"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { User, ServiceRequest } from "@/lib/types";

interface ProviderDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchToClient: () => void;
}

type JobTab = "new" | "accepted" | "in_progress" | "completed" | "all";

interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

export function ProviderDashboard({ user, onSignOut, onSwitchToClient }: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState<JobTab>("new");
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isVerified = user.verificationStatus === "verified";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.id) params.set("providerId", String(user.id));
      if (user.email) params.set("email", user.email);
      const res = await fetch(`/api/provider/jobs?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        setJobs([]);
      }
    } catch (e) {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.email]);

  const loadNotifications = useCallback(async () => {
    if (!user.email && !user.id) return;
    setNotifLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.email) params.set("email", user.email);
      if (user.id) params.set("userId", String(user.id));
      params.set("role", "provider");
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (e) {}
    finally { setNotifLoading(false); }
  }, [user.email, user.id]);

  useEffect(() => {
    loadJobs();
    loadNotifications();
    // Poll every 30s for new assignments/notifications
    const interval = setInterval(() => {
      loadJobs();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadJobs, loadNotifications]);

  // Close notif panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, email: user.email }),
      });
    } catch (e) {}
  };

  const markOneRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (e) {}
  };

  const handleJobAction = async (
    jobId: number,
    action: "accept_job" | "start_work" | "mark_completed" | "decline_job"
  ) => {
    setActionLoading(jobId);
    try {
      const res = await fetch("/api/provider/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId: jobId,
          providerId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "accept_job") showToast("✓ Job accepted! Client and admin notified.");
        if (action === "start_work") showToast("⚡ Work started! Client notified.");
        if (action === "mark_completed") showToast("✅ Work marked complete. Client notified for sign-off.");
        if (action === "decline_job") showToast("Job declined. Admin will reassign.");
        loadJobs();
      } else {
        showToast(data.error || "⚠️ Error updating job status");
      }
    } catch (e) {
      showToast("⚠️ Error updating job status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!isVerified) return false;
    if (activeTab === "all") return true;
    if (activeTab === "new") return j.jobStatus === "provider_assigned";
    if (activeTab === "accepted") return j.jobStatus === "provider_accepted";
    if (activeTab === "in_progress") return j.jobStatus === "work_in_progress";
    if (activeTab === "completed")
      return j.jobStatus === "work_completed" || j.jobStatus === "completed";
    return true;
  });

  const jobStatusColor = (status?: string) => {
    if (status === "provider_assigned") return "bg-amber-500/20 border-amber-500/40 text-amber-400";
    if (status === "provider_accepted") return "bg-blue-500/20 border-blue-500/40 text-blue-400";
    if (status === "work_in_progress") return "bg-indigo-500/20 border-indigo-500/40 text-indigo-400";
    if (status === "work_completed" || status === "completed")
      return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
    return "bg-slate-500/20 border-slate-500/40 text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ─── Top Navbar ─── */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-auto bg-white p-1 rounded-xl border border-white/20 shadow-md flex items-center justify-center shrink-0">
            <img
              src="/questmore_logo.jpg"
              alt="QuestMore Engineering Services Limited (RC: 6907014)"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[15px] font-black text-white leading-none">QuestMore Provider</h1>
              <span className="text-[8.5px] font-mono font-black text-amber-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                RC: 6907014
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9.5px] font-black text-emerald-400">
                  <span>✓</span> VERIFIED PRO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[9.5px] font-black text-amber-400 animate-pulse">
                  <span>⏳</span> AWAITING VERIFICATION
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {user.fullName} • {user.professionName || "Engineering Specialist"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ── Notification Bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifPanel(!showNotifPanel);
                if (!showNotifPanel) loadNotifications();
              }}
              className="relative h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition-all"
              title="Notifications"
            >
              <span className="text-[16px]">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none border-2 border-slate-950 px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-[340px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-black text-white">Notifications</p>
                    <p className="text-[11px] text-slate-400">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-80 divide-y divide-slate-800/50">
                  {notifLoading ? (
                    <div className="p-6 text-center text-slate-400 text-[12px]">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-2xl">🔔</p>
                      <p className="text-[13px] font-bold text-slate-400 mt-2">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className={`px-4 py-3.5 cursor-pointer hover:bg-slate-800/50 transition-all ${
                          !n.read ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="shrink-0 mt-0.5 text-[15px]">
                            {n.type === "verification" ? "✅" :
                             n.type === "alert" ? "⚠️" :
                             n.type === "admin_message" ? "💬" :
                             n.type === "request_update" ? "🔧" : "🔔"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-extrabold text-white line-clamp-1">{n.title}</p>
                            <p className="text-[11.5px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {new Date(n.createdAt).toLocaleString("en-NG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSwitchToClient}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-[12px] font-bold text-slate-300 hover:text-white transition-colors"
          >
            Client Mode
          </button>
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[12px] font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-6">
        {/* ─── AWAITING VERIFICATION BANNER ─── */}
        {!isVerified && (
          <div className="rounded-3xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-[30px] text-amber-400">
                ⏳
              </div>
              <div className="flex-1">
                <h3 className="text-[17px] font-black text-amber-300">
                  Your Provider Account is in Review
                </h3>
                <p className="mt-2 text-[13px] text-slate-300 leading-relaxed font-medium">
                  QuestMore verification desk is reviewing your professional qualifications. Once verified, job assignments will appear here automatically. Check your notifications bell for updates from admin.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1">🔒 Job Intake: Locked</span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1">📄 Credentials: Under Review</span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1">📞 Response: Within 24 Hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Stats & Summary ─── */}
        {isVerified && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: "New Assigned", value: jobs.filter((j) => j.jobStatus === "provider_assigned").length, color: "text-amber-400" },
              { label: "In Progress", value: jobs.filter((j) => j.jobStatus === "work_in_progress" || j.jobStatus === "provider_accepted").length, color: "text-blue-400" },
              { label: "Completed", value: jobs.filter((j) => j.jobStatus === "work_completed" || j.jobStatus === "completed").length, color: "text-emerald-400" },
              { label: "Total Jobs", value: jobs.length, color: "text-white" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <p className={`text-[26px] font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Assigned Jobs ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[19px] font-black text-white tracking-tight">Assigned Jobs</h2>
              <p className="text-[12px] text-slate-400 font-medium">Manage dispatch requests and site tasks</p>
            </div>
            {isVerified && (
              <button
                type="button"
                onClick={loadJobs}
                className="text-[11.5px] font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
              >
                🔄 Refresh
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          {isVerified && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
              {[
                { key: "new", label: `New (${jobs.filter((j) => j.jobStatus === "provider_assigned").length})` },
                { key: "accepted", label: "Accepted" },
                { key: "in_progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
                { key: "all", label: `All (${jobs.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as JobTab)}
                  className={`px-4 py-2 rounded-2xl text-[12px] font-extrabold whitespace-nowrap transition-all ${
                    activeTab === t.key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Job List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : !isVerified ? (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center">
              <span className="text-[36px]">🛡️</span>
              <h4 className="mt-3 text-[16px] font-black text-white">Job Queue Locked</h4>
              <p className="mt-1.5 text-[12.5px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                As soon as an administrator verifies your application, jobs matched to your specialty (
                {user.professionName || "Specialist"}) will appear here in real-time.
              </p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const isNew = job.jobStatus === "provider_assigned";
                const isAccepted = job.jobStatus === "provider_accepted";
                const isInProgress = job.jobStatus === "work_in_progress";
                const isWorkDone = job.jobStatus === "work_completed" || job.jobStatus === "completed";

                return (
                  <div
                    key={job.id}
                    className={`rounded-3xl bg-slate-900 border p-5 transition-all shadow-md ${
                      isNew
                        ? "border-amber-500/40 shadow-amber-500/5"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Job Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-black text-blue-400 font-mono">
                            {(job as any).requestCode || `QM-REQ-${job.id}`}
                          </span>
                          {isNew && (
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md animate-pulse">
                              NEW JOB
                            </span>
                          )}
                          {(job as any).urgency === "urgent" && (
                            <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-md animate-pulse">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] font-extrabold text-slate-200 mt-1.5 leading-snug">
                          {job.description
                            ? job.description.slice(0, 120) + (job.description.length > 120 ? "..." : "")
                            : "Service request"}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10.5px] font-black border ${jobStatusColor(job.jobStatus)}`}>
                        {job.jobStatus?.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[12px]">
                      <div>
                        <span className="text-slate-500 font-bold">Client:</span>{" "}
                        <span className="text-slate-200 font-extrabold">{job.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Phone:</span>{" "}
                        <span className="text-slate-200 font-medium">{job.phone || "On File"}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 font-bold">Site:</span>{" "}
                        <span className="text-slate-200 font-medium">
                          {(job as any).address ? `${(job as any).address}, ` : ""}
                          {job.location || "Abuja, Nigeria"}
                        </span>
                      </div>
                      {(job as any).preferredDate && (
                        <div>
                          <span className="text-slate-500 font-bold">Schedule:</span>{" "}
                          <span className="text-amber-400 font-bold">
                            {(job as any).preferredDate} — {(job as any).preferredTime || "Daytime"}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 font-bold">Payment:</span>{" "}
                        <span
                          className={
                            (job as any).paymentStatus === "successful"
                              ? "text-emerald-400 font-bold"
                              : "text-amber-400 font-bold"
                          }
                        >
                          {(job as any).paymentStatus === "successful"
                            ? `✓ ₦${((job as any).bookingFee || 5000).toLocaleString()} Confirmed`
                            : "Pending"}
                        </span>
                      </div>
                      {(job as any).assignedAt && (
                        <div>
                          <span className="text-slate-500 font-bold">Assigned:</span>{" "}
                          <span className="text-slate-300">
                            {new Date((job as any).assignedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Note */}
                    {(job as any).statusNote && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11.5px] text-slate-400 flex gap-2">
                        <span>💬</span>
                        <span>{(job as any).statusNote}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                      <div>
                        {job.phone && (
                          <a
                            href={`https://wa.me/${job.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            💬 WhatsApp Client
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isNew && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === job.id}
                              onClick={() => handleJobAction(job.id, "decline_job")}
                              className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-[11.5px] font-bold hover:bg-red-500/10 transition-all disabled:opacity-50"
                            >
                              {actionLoading === job.id ? "..." : "✕ Decline"}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === job.id}
                              onClick={() => handleJobAction(job.id, "accept_job")}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {actionLoading === job.id ? "Accepting..." : "✓ Accept Job"}
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoading === job.id}
                            onClick={() => handleJobAction(job.id, "start_work")}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[12.5px] font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading === job.id ? "Starting..." : "⚡ Start Work On-Site"}
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            type="button"
                            disabled={actionLoading === job.id}
                            onClick={() => handleJobAction(job.id, "mark_completed")}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading === job.id ? "Updating..." : "✅ Mark as Completed"}
                          </button>
                        )}

                        {isWorkDone && (
                          <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                            {(job as any).clientConfirmed
                              ? "✓ Completed & Client Signed Off"
                              : "⏳ Awaiting Client Sign-off"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center">
              <span className="text-[32px]">📋</span>
              <h4 className="mt-2 text-[15px] font-black text-white">
                No {activeTab === "new" ? "new assignments" : `${activeTab} jobs`}
              </h4>
              <p className="mt-1 text-[12px] text-slate-400">
                {activeTab === "new"
                  ? "Assigned jobs will appear here automatically once admin dispatches them to you."
                  : `You do not have any ${activeTab} tasks in this category.`}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[13px] font-black shadow-2xl border border-slate-700 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Sign Out Confirm Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[28px] w-full max-w-sm shadow-2xl border border-slate-800 p-6 text-center text-white">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[28px] mx-auto mb-3">
              🚪
            </div>
            <h3 className="text-[17px] font-black text-white">Sign Out of Provider Portal?</h3>
            <p className="text-[12.5px] text-slate-400 font-medium mt-1.5 leading-relaxed">
              Are you sure? You can sign back in with your provider email and password.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onSignOut();
                }}
                className="flex-1 py-3 rounded-2xl text-[13px] font-black text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
