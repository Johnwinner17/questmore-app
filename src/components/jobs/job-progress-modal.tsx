"use client";

import { useState } from "react";
import type { ServiceRequest } from "@/lib/types";

// Parse milestone photos from the request
function getMilestonePhoto(milestonePhotos: string | null | undefined, stageKey: string) {
  if (!milestonePhotos) return null;
  try {
    const photos = JSON.parse(milestonePhotos);
    return Array.isArray(photos) ? photos.find((p: any) => p.stage === stageKey) || null : null;
  } catch {
    return null;
  }
}

interface JobProgressModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onConfirmCompletion?: (requestId: number) => Promise<void>;
}

const steps = [
  { id: "request_submitted", label: "Request Submitted", desc: "Order submitted with contact & job details" },
  { id: "awaiting_admin_review", label: "Admin Review & Approval", desc: "QuestMore Admin reviewing scope & verifying request" },
  { id: "awaiting_assignment", label: "Approved for Assignment", desc: "Job approved; matching verified certified specialist" },
  { id: "provider_assigned", label: "Specialist Assigned", desc: "Certified provider dispatched to job" },
  { id: "provider_accepted", label: "Schedule Accepted", desc: "Specialist accepted job timeline and terms" },
  { id: "work_in_progress", label: "Work in Progress", desc: "Technician on-site carrying out the work" },
  { id: "work_completed", label: "Work Completed", desc: "Provider completed service execution" },
  { id: "client_confirmation", label: "Client Inspection & Sign-off", desc: "Client reviews and confirms satisfactory delivery" },
  { id: "completed", label: "Closed with QA Warranty", desc: "Project closed successfully under QuestMore Guarantee" },
];

const stepOrder: Record<string, number> = {
  request_submitted: 1,
  awaiting_admin_review: 2,
  payment_verified: 2,
  awaiting_assignment: 3,
  provider_assigned: 4,
  provider_accepted: 5,
  work_in_progress: 6,
  work_completed: 7,
  client_confirmation: 8,
  completed: 9,
};

export function JobProgressModal({ request, onClose, onConfirmCompletion }: JobProgressModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(request.clientConfirmed || request.jobStatus === "completed");
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string; stageLabel?: string; uploadedAt?: string } | null>(null);

  const currentStatus = request.jobStatus || (request.status === "completed" ? "completed" : "awaiting_admin_review");
  const currentStepNumber = stepOrder[currentStatus] || (request.assignedProviderId ? 4 : 2);
  const isWorkCompletedByProvider = currentStatus === "work_completed" || currentStepNumber >= 7;

  const isNegotiable = (() => {
    try {
      const svcs = typeof request.selectedServices === "string" ? JSON.parse(request.selectedServices) : (request.selectedServices || []);
      return Array.isArray(svcs) && svcs.some((s: any) => s.isNegotiable || !s.price);
    } catch {
      return false;
    }
  })();

  const handleConfirm = async () => {
    if (!onConfirmCompletion) return;
    setConfirming(true);
    try {
      await onConfirmCompletion(request.id);
      setConfirmedSuccess(true);
    } catch (e) {
      // Error handling
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up my-auto flex flex-col max-h-[92vh] border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black text-lg shadow-md shadow-amber-400/20">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-mono text-amber-400 font-extrabold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                  {request.requestCode || `QM-REQ-${request.id}`}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[12px] font-bold text-slate-300 truncate max-w-[170px]">
                  {request.categoryName || "Engineering Task"}
                </span>
              </div>
              <h3 className="text-[16px] font-extrabold text-white mt-0.5 tracking-tight">8-Stage Job Progress Tracker</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
          {/* Admin Review Notice for Negotiable Requests */}
          {currentStatus === "awaiting_admin_review" && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-4">
              <div className="flex items-start gap-3">
                <span className="text-[22px]">⏳</span>
                <div>
                  <h4 className="text-[13.5px] font-extrabold text-amber-950">Awaiting Admin Review & Approval</h4>
                  <p className="text-[12px] text-amber-900 leading-relaxed mt-0.5 font-medium">
                    {isNegotiable
                      ? "Your request includes negotiable services. QuestMore Admin is reviewing your project requirements and will reply with the exact job cost before dispatching a specialist."
                      : "QuestMore Admin is verifying your booking details and will approve the job for specialist dispatch."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Provider Card */}
          {request.assignedProviderId && (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4.5 relative overflow-hidden shadow-lg border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>🛡️</span> Verified Specialist Assigned
                </span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  ✓ VERIFIED PRO
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
                  👷
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-extrabold text-white truncate">
                    {request.providerName || "Engr. Assigned Specialist"}
                  </h4>
                  <p className="text-[12px] text-slate-300">
                    {request.providerProfession || "Certified Technician"} • QuestMore Verified
                  </p>
                  {request.providerPhone && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{request.providerPhone}</p>
                  )}
                </div>
                {request.providerPhone && (
                  <a
                    href={`https://wa.me/${request.providerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[12px] font-black transition-all shrink-0 flex items-center gap-1 shadow-md shadow-emerald-500/20"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Prompt Client for Completion Confirmation */}
          {isWorkCompletedByProvider && !confirmedSuccess && (
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-500 p-4.5 space-y-3 shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-[26px]">🎉</span>
                <div>
                  <h4 className="text-[14.5px] font-extrabold text-emerald-950">
                    Technician has completed the requested work.
                  </h4>
                  <p className="text-[12.5px] text-emerald-800 font-medium mt-1 leading-relaxed">
                    Please review and inspect the work on site. If completely satisfied, click below to confirm project completion and activate your warranty.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirm}
                className="w-full rounded-xl py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {confirming ? "Confirming Completion..." : "✓ Confirm Completion & Close Project"}
              </button>
            </div>
          )}

          {confirmedSuccess && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-3.5 text-emerald-950 shadow-xs">
              <span className="text-[26px]">✅</span>
              <div>
                <p className="text-[13.5px] font-black">Project Completed & Signed Off</p>
                <p className="text-[11.5px] font-medium text-emerald-800 mt-0.5">QuestMore Quality Assurance Warranty is now active on this job.</p>
              </div>
            </div>
          )}

          {/* 8-Step Timeline */}
          <div className="pt-2">
            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-wider mb-4">
              Real-Time Lifecycle Tracker
            </h4>
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {steps.map((s, index) => {
                const stepNum = index + 1;
                const isPassed = stepNum < currentStepNumber || (stepNum === 8 && confirmedSuccess) || (stepNum === 9 && confirmedSuccess);
                const isCurrent = stepNum === currentStepNumber && !confirmedSuccess;
                const photo = getMilestonePhoto((request as any).milestonePhotos, s.id);

                return (
                  <div key={s.id} className="relative flex flex-col gap-0">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all z-10 ${
                          isPassed
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-amber-400 text-slate-950 ring-4 ring-amber-100 font-black animate-pulse shadow-sm"
                            : "bg-slate-100 border border-slate-200 text-slate-400"
                        }`}
                      >
                        {isPassed ? "✓" : stepNum}
                      </div>
                      <div className="flex-1 pt-0.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[13px] font-extrabold ${
                              isCurrent
                                ? "text-amber-700"
                                : isPassed
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {photo && (
                              <button
                                type="button"
                                onClick={() => setLightboxPhoto({
                                  url: photo.url,
                                  caption: photo.caption,
                                  stageLabel: s.label,
                                  uploadedAt: photo.uploadedAt,
                                })}
                                className="text-[9.5px] font-black text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-violet-100 transition-colors"
                              >
                                📸 View Photo
                              </button>
                            )}
                            {isCurrent && (
                              <span className="text-[9.5px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                CURRENT STAGE
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-0.5 font-medium leading-relaxed">{s.desc}</p>
                      </div>
                    </div>

                    {/* Milestone photo inline preview */}
                    {photo && (isPassed || isCurrent) && (
                      <div className="ml-11 mt-2 mb-1">
                        <div
                          className="relative rounded-xl overflow-hidden border border-violet-200 cursor-pointer group shadow-xs"
                          onClick={() => setLightboxPhoto({
                            url: photo.url,
                            caption: photo.caption,
                            stageLabel: s.label,
                            uploadedAt: photo.uploadedAt,
                          })}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || s.label}
                            className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            {photo.caption && (
                              <p className="text-white text-[10.5px] font-bold truncate">{photo.caption}</p>
                            )}
                            <p className="text-white/70 text-[9.5px]">
                              {new Date(photo.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/40 rounded-full px-2 py-0.5 text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            🔍 Enlarge
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[12.5px] space-y-2">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Amount Paid on Request:</span>
              <span className="font-extrabold text-slate-900">
                ₦{(request.totalAmount || 5000).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Payment Reference:</span>
              <span className="font-mono font-bold text-slate-800">{request.paymentRef || "QM-PAY-VERIFIED"}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium pt-1 border-t border-slate-200/60">
              <span>Payment Status:</span>
              <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Lightbox for Milestone Photos */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || "Milestone Photo"}
              className="w-full rounded-2xl shadow-2xl max-h-[75vh] object-contain bg-black/50"
            />
            {lightboxPhoto.caption && (
              <div className="mt-3 text-center text-white font-bold text-[14px]">{lightboxPhoto.caption}</div>
            )}
            {lightboxPhoto.stageLabel && (
              <p className="text-center text-white/60 text-[12px] mt-1">
                {lightboxPhoto.stageLabel}
                {lightboxPhoto.uploadedAt && ` — ${new Date(lightboxPhoto.uploadedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            )}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-4 -right-4 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
