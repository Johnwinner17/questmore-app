"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, ServiceRequest } from "@/lib/types";
import { mockRequests } from "@/lib/mock-data";

interface ProviderDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchToClient: () => void;
}

type JobTab = "new" | "accepted" | "in_progress" | "completed" | "all";

export function ProviderDashboard({ user, onSignOut, onSwitchToClient }: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState<JobTab>("new");
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const isVerified = user.verificationStatus === "verified";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/jobs?providerId=${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        setJobs(mockRequests);
      }
    } catch (e) {
      setJobs(mockRequests);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleJobAction = async (jobId: number, action: "accept_job" | "start_work" | "mark_completed") => {
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
        if (action === "accept_job") showToast("✓ Job accepted! Client notified.");
        if (action === "start_work") showToast("⚡ Work marked as in progress!");
        if (action === "mark_completed") showToast("✅ Work marked as completed. Awaiting client sign-off.");
        loadJobs();
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
    if (activeTab === "completed") return j.jobStatus === "work_completed" || j.jobStatus === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ─── Top Navbar ─── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-[20px] shadow-md shadow-blue-500/20">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-black text-white">QuestMore Provider</h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                  <span>✓</span> VERIFIED PRO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-400 animate-pulse">
                  <span>⏳</span> AWAITING VERIFICATION
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-400 font-medium">
              {user.fullName} • {user.professionName || "Engineering Specialist"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToClient}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-[12px] font-bold text-slate-300 hover:text-white transition-colors"
          >
            Client Mode
          </button>
          <button
            type="button"
            onClick={onSignOut}
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
                  QuestMore verification desk is reviewing your professional qualifications and contact details. Once verified, job assignments will appear automatically here.
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
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">New Assigned</span>
              <p className="text-[26px] font-black text-amber-400 mt-1">
                {jobs.filter(j => j.jobStatus === "provider_assigned").length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">In Progress</span>
              <p className="text-[26px] font-black text-blue-400 mt-1">
                {jobs.filter(j => j.jobStatus === "work_in_progress" || j.jobStatus === "provider_accepted").length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Completed</span>
              <p className="text-[26px] font-black text-emerald-400 mt-1">
                {jobs.filter(j => j.jobStatus === "work_completed" || j.jobStatus === "completed").length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pro Rating</span>
              <p className="text-[26px] font-black text-yellow-400 mt-1">5.0 ★</p>
            </div>
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
                { key: "new", label: "New Jobs" },
                { key: "accepted", label: "Accepted" },
                { key: "in_progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
                { key: "all", label: "All Tasks" },
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
                <div key={i} className="h-36 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : !isVerified ? (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center">
              <span className="text-[36px]">🛡️</span>
              <h4 className="mt-3 text-[16px] font-black text-white">Job Queue Locked</h4>
              <p className="mt-1.5 text-[12.5px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                As soon as an administrator verifies your application, jobs matched to your specialty ({user.professionName || "Specialist"}) will appear here in real-time.
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
                    className="rounded-3xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-blue-400 font-mono">
                            {job.requestCode || `QM-REQ-${job.id}`}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[13px] font-extrabold text-white">
                            {job.categoryName || "Engineering Task"}
                          </span>
                        </div>
                        <p className="text-[14px] font-extrabold text-slate-200 mt-1">
                          {job.description}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10.5px] font-black border ${
                          isNew
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse"
                            : isAccepted
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                            : isInProgress
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        }`}
                      >
                        {job.jobStatus?.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    {/* Client & Location details */}
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
                        <span className="text-slate-500 font-bold">Site Location:</span>{" "}
                        <span className="text-slate-200 font-medium">
                          {job.address ? `${job.address}, ` : ""}{job.location || "Abuja"}
                        </span>
                      </div>
                      {job.preferredDate && (
                        <div>
                          <span className="text-slate-500 font-bold">Preferred Schedule:</span>{" "}
                          <span className="text-amber-400 font-medium">{job.preferredDate} ({job.preferredTime || "Daytime"})</span>
                        </div>
                      )}
                    </div>

                    {/* Provider Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div>
                        {job.phone && (
                          <a
                            href={`https://wa.me/${job.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <span>💬 Contact Client</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isNew && (
                          <button
                            type="button"
                            disabled={actionLoading === job.id}
                            onClick={() => handleJobAction(job.id, "accept_job")}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading === job.id ? "Accepting..." : "✓ Accept Job"}
                          </button>
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
                          <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            {job.clientConfirmed ? "✓ Completed & Confirmed by Client" : "Awaiting Client Sign-off"}
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
              <h4 className="mt-2 text-[15px] font-black text-white">No {activeTab} jobs</h4>
              <p className="mt-1 text-[12px] text-slate-400">
                You do not have any {activeTab} tasks in this category.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[13px] font-black shadow-2xl border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
}
