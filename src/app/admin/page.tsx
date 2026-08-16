"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

// ─── Types ───
type Section =
  | "dashboard"
  | "banners"
  | "notifications"
  | "services"
  | "gallery"
  | "categories"
  | "subcategories"
  | "job_requests"
  | "provider_applications"
  | "professions"
  | "payments"
  | "settings"
  | "reviews"
  | "faqs"
  | "areas"
  | "users";

interface AdminStats {
  categories: number;
  services: number;
  requests: number;
  users: number;
  clients: number;
  providers: number;
  pendingApplications: number;
  verifiedProviders: number;
  pendingRequests: number;
  activeJobs: number;
  completedJobs: number;
  bookingFeesTotal: number;
  totalRevenue: number;
  pendingPayments: number;
  bookingFeeConfig: number;
}

async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`/api/admin${path}`, opts);
  return r.json();
}

const sidebarItems: { key: Section; label: string; icon: string; badgeKey?: keyof AdminStats }[] = [
  { key: "dashboard", label: "Overview & Metrics", icon: "📊" },
  { key: "banners", label: "Hero Sliding Banners", icon: "🖼️" },
  { key: "notifications", label: "Notification Center", icon: "📢" },
  { key: "job_requests", label: "Job Requests & Quotes", icon: "📋", badgeKey: "pendingRequests" },
  { key: "services", label: "Services & Pricing", icon: "🔧", badgeKey: "services" },
  { key: "gallery", label: "Photo Gallery Manager", icon: "📸" },
  { key: "categories", label: "Categories", icon: "📁" },
  { key: "subcategories", label: "Subcategories", icon: "📂" },
  { key: "provider_applications", label: "Provider Applications", icon: "👷", badgeKey: "pendingApplications" },
  { key: "professions", label: "Professions & Trades", icon: "🪚" },
  { key: "payments", label: "Payment Records", icon: "💳" },
  { key: "settings", label: "Platform Settings", icon: "⚙️" },
  { key: "reviews", label: "Client Reviews", icon: "⭐" },
  { key: "faqs", label: "FAQs & Guides", icon: "❓" },
  { key: "areas", label: "Service Areas", icon: "📍" },
  { key: "users", label: "All Users", icon: "👥" },
];

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "assign" | "view_provider" | "approve_review" | "bulk_gallery" | "send_feedback" | "create_banner" | "edit_banner" | "create_notification" | "milestone_photo";
    item?: Record<string, any>;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [bulkPhotosInput, setBulkPhotosInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [catOptions, setCatOptions] = useState<{ id: number; name: string }[]>([]);
  const [subOptions, setSubOptions] = useState<{ id: number; name: string; categoryId: number }[]>([]);
  const [verifiedProviders, setVerifiedProviders] = useState<{ id: number; fullName: string; professionName: string; phone: string }[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [quotedCostInput, setQuotedCostInput] = useState("");
  const [statusNoteInput, setStatusNoteInput] = useState("");
  const [feedbackMessageInput, setFeedbackMessageInput] = useState("");
  const [feedbackTitleInput, setFeedbackTitleInput] = useState("");
  const [bookingFeeInput, setBookingFeeInput] = useState("5000");

  // Milestone Photo state
  const [milestoneStage, setMilestoneStage] = useState("work_in_progress");
  const [milestoneUrl, setMilestoneUrl] = useState("");
  const [milestoneCaption, setMilestoneCaption] = useState("");
  const [milestoneUploading, setMilestoneUploading] = useState(false);

  const MILESTONE_STAGES = [
    { key: "awaiting_assignment",  label: "Approved for Assignment" },
    { key: "provider_assigned",    label: "Specialist Assigned" },
    { key: "provider_accepted",    label: "Schedule Accepted" },
    { key: "work_in_progress",     label: "Work in Progress" },
    { key: "work_completed",       label: "Work Completed" },
    { key: "completed",            label: "Project Closed" },
  ];

  const handleMilestonePhotoSave = async () => {
    if (!milestoneUrl.trim() || !modal?.item) return;
    setMilestoneUploading(true);
    try {
      const stageLabel = MILESTONE_STAGES.find(s => s.key === milestoneStage)?.label || milestoneStage;
      await api(``, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "requests",
          id: modal.item.id,
          data: {
            action: "add_milestone_photo",
            stage: milestoneStage,
            stageLabel,
            url: milestoneUrl.trim(),
            caption: milestoneCaption.trim(),
          },
        }),
      });
      showToast(`📸 Photo uploaded for "${stageLabel}" — client notified via WhatsApp!`);
      setModal(null);
      setMilestoneUrl("");
      setMilestoneCaption("");
      loadData("job_requests");
    } catch (e) {
      showToast("Failed to upload photo. Please try again.");
    } finally {
      setMilestoneUploading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadStats = useCallback(async () => {
    const s = await api("?table=stats");
    setStats(s);
    if (s?.bookingFeeConfig) {
      setBookingFeeInput(String(s.bookingFeeConfig));
    }
  }, []);

  const loadData = useCallback(async (sec: Section) => {
    setLoading(true);
    try {
      const res = await api(`?table=${sec}`);
      if (Array.isArray(res)) {
        setData(res);
      } else {
        setData([]);
      }
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    api("?table=categories").then(res => Array.isArray(res) && setCatOptions(res));
    api("?table=subcategories").then(res => Array.isArray(res) && setSubOptions(res));
    api("?table=verified_providers").then(res => Array.isArray(res) && setVerifiedProviders(res));
  }, [loadStats]);

  useEffect(() => {
    if (section !== "dashboard") {
      loadData(section);
    }
  }, [section, loadData]);

  // Handle Create / Edit saving
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal?.mode === "create" || modal?.mode === "create_banner" || modal?.mode === "create_notification") {
        const table = modal.mode === "create_banner" ? "banners" : modal.mode === "create_notification" ? "notifications" : section;
        const res = await api("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, data: formData }),
        });
        if (res.error) {
          showToast(`Error: ${res.error}`);
        } else {
          showToast(`Created record successfully!`);
          setModal(null);
          loadData(section);
          loadStats();
        }
      } else if (modal?.mode === "edit" || modal?.mode === "edit_banner") {
        const table = modal.mode === "edit_banner" ? "banners" : section;
        const res = await api("", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, id: modal.item?.id, data: formData }),
        });
        if (res.error) {
          showToast(`Error: ${res.error}`);
        } else {
          showToast(`Updated record successfully!`);
          setModal(null);
          loadData(section);
          loadStats();
        }
      }
    } catch (e: any) {
      showToast(`Action failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (table: string, id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await api(`?table=${table}&id=${id}`, { method: "DELETE" });
      if (res.success) {
        showToast("Record deleted successfully");
        loadData(section);
        loadStats();
      }
    } catch (e) {
      showToast("Failed to delete record");
    }
  };

  // Handle Direct Client Feedback Dispatch
  const handleSendFeedback = async () => {
    if (!feedbackMessageInput.trim()) {
      showToast("Please enter feedback message");
      return;
    }
    setSaving(true);
    try {
      const res = await api("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_feedback",
          data: {
            requestId: modal?.item?.id,
            userEmail: modal?.item?.email,
            clientName: modal?.item?.fullName,
            title: feedbackTitleInput || `Update on Request ${modal?.item?.requestCode || ""}`,
            message: feedbackMessageInput,
            type: "admin_feedback",
          },
        }),
      });
      if (res.success) {
        showToast("✓ Feedback sent directly to client notification center!");
        setModal(null);
        setFeedbackMessageInput("");
        setFeedbackTitleInput("");
        loadData(section);
      }
    } catch (e: any) {
      showToast(`Failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Job Approval & Quoted cost forward
  const handleApproveJob = async (requestId: number, quotedPrice?: number, note?: string) => {
    setSaving(true);
    try {
      const res = await api("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "requests",
          id: requestId,
          data: {
            jobStatus: "awaiting_assignment",
            status: "confirmed",
            quotedPrice: quotedPrice || undefined,
            servicesTotal: quotedPrice || undefined,
            totalAmount: quotedPrice ? quotedPrice + Number(bookingFeeInput) : undefined,
            statusNote: note || "Scope approved by engineering admin. Queued for specialist assignment.",
          },
        }),
      });
      if (res.success) {
        showToast("✓ Job approved and forwarded! Notification sent to client.");
        setModal(null);
        loadData("job_requests");
        loadStats();
      }
    } catch (e) {
      showToast("Failed to approve job");
    } finally {
      setSaving(false);
    }
  };

  // Handle Assign Provider
  const handleAssignJob = async (requestId: number) => {
    if (!selectedProviderId) return;
    setSaving(true);
    try {
      const res = await api("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "requests",
          id: requestId,
          data: {
            assignedProviderId: selectedProviderId,
          },
        }),
      });
      if (res.success) {
        showToast("✓ Specialist assigned! Client notified in real-time.");
        setModal(null);
        loadData("job_requests");
        loadStats();
      }
    } catch (e) {
      showToast("Failed to assign specialist");
    } finally {
      setSaving(false);
    }
  };

  // Handle Provider Verification
  const handleUpdateProviderStatus = async (userId: number, verificationStatus: "verified" | "rejected" | "suspended") => {
    setSaving(true);
    try {
      const res = await api("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "provider_applications",
          id: userId,
          data: { verificationStatus },
        }),
      });
      if (res.success) {
        showToast(`Provider status updated to ${verificationStatus}`);
        setModal(null);
        loadData("provider_applications");
        loadStats();
      }
    } catch (e) {
      showToast("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // Handle Platform Booking Fee Save
  const handleSaveBookingFee = async () => {
    setSaving(true);
    try {
      const res = await api("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "settings",
          data: { bookingFee: Number(bookingFeeInput) },
        }),
      });
      if (res.success) {
        showToast("✓ Booking fee configuration updated!");
        loadStats();
      }
    } catch (e) {
      showToast("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setFormData({});
    setModal({ mode: "create" });
  };

  const openEdit = (item: Record<string, any>) => {
    setFormData({ ...item });
    setModal({ mode: "edit", item });
  };

  const openCreateBanner = () => {
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "/hero_engineering.jpg",
      link: "/explore",
      sortOrder: (data.length || 0) + 1,
      active: true,
    });
    setModal({ mode: "create_banner" });
  };

  const openEditBanner = (item: Record<string, any>) => {
    setFormData({ ...item });
    setModal({ mode: "edit_banner", item });
  };

  const openCreateNotification = () => {
    setFormData({
      title: "",
      message: "",
      type: "announcement",
      target: "all",
      userEmail: "",
    });
    setModal({ mode: "create_notification" });
  };

  const canCreate = ["services", "gallery", "categories", "subcategories", "banners", "reviews", "faqs", "areas", "professions", "notifications"].includes(section);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* ─── SIDEBAR ─── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 font-black text-slate-950 text-lg shadow-md">
              Q
            </div>
            <div>
              <h1 className="text-[16px] font-black tracking-tight text-white leading-none">QuestMore Admin</h1>
              <p className="text-[11px] text-amber-400 font-bold mt-1">Management Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1 no-scrollbar">
          {sidebarItems.map((item) => {
            const active = section === item.key;
            const badgeVal = item.badgeKey && stats ? stats[item.badgeKey] : null;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key);
                  setSidebarOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-extrabold transition-all",
                  active
                    ? "bg-amber-400 text-slate-950 shadow-md font-black"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[16px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {badgeVal !== null && badgeVal > 0 && (
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-black",
                    active ? "bg-slate-950 text-amber-400" : "bg-amber-400/20 text-amber-300"
                  )}>
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11.5px] text-slate-400 flex items-center justify-between">
          <span>v2.5.0 Production</span>
          <a href="/" target="_blank" className="text-amber-400 font-bold hover:underline">View Live App ↗</a>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-2xl text-slate-700">☰</button>
            <h2 className="text-[17px] font-black text-slate-900 capitalize flex items-center gap-2">
              <span>{sidebarItems.find(s => s.key === section)?.icon}</span>
              <span>{sidebarItems.find(s => s.key === section)?.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {section === "banners" && (
              <button
                onClick={openCreateBanner}
                className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm flex items-center gap-1.5"
              >
                <span>+ Add Sliding Banner</span>
              </button>
            )}

            {section === "notifications" && (
              <button
                onClick={openCreateNotification}
                className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm flex items-center gap-1.5"
              >
                <span>📢 Post Notification</span>
              </button>
            )}

            {canCreate && section !== "banners" && section !== "notifications" && (
              <button
                onClick={openCreate}
                className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm flex items-center gap-1.5"
              >
                <span>+ Add {section === "gallery" ? "Photo" : section === "job_requests" ? "Request" : "Record"}</span>
              </button>
            )}

            <button
              onClick={() => {
                loadStats();
                if (section !== "dashboard") loadData(section);
                showToast("Refreshed data!");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* 1. OVERVIEW & REAL METRICS */}
          {section === "dashboard" && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Platform Operational Overview</h3>
                <p className="text-[13px] text-slate-500 font-medium">Real-time statistics across active clients, service bookings, and verified specialists</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Total Requests</span>
                    <span className="text-xl">📋</span>
                  </div>
                  <p className="text-[24px] font-black text-slate-950">{stats?.requests ?? 0}</p>
                  <p className="text-[11px] text-amber-700 font-bold mt-1">{stats?.pendingRequests ?? 0} pending review</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Active Jobs</span>
                    <span className="text-xl">⚡</span>
                  </div>
                  <p className="text-[24px] font-black text-blue-900">{stats?.activeJobs ?? 0}</p>
                  <p className="text-[11px] text-blue-600 font-bold mt-1">In progress & assigned</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Completed Jobs</span>
                    <span className="text-xl">✓</span>
                  </div>
                  <p className="text-[24px] font-black text-emerald-700">{stats?.completedJobs ?? 0}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Quality confirmed</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Verified Providers</span>
                    <span className="text-xl">👷</span>
                  </div>
                  <p className="text-[24px] font-black text-indigo-900">{stats?.verifiedProviders ?? 0}</p>
                  <p className="text-[11px] text-indigo-600 font-bold mt-1">{stats?.pendingApplications ?? 0} applications pending</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Services Listed</span>
                    <span className="text-xl">🔧</span>
                  </div>
                  <p className="text-[24px] font-black text-slate-900">{stats?.services ?? 0}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">Across {stats?.categories ?? 6} categories</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Total Revenue</span>
                    <span className="text-xl">💰</span>
                  </div>
                  <p className="text-[24px] font-black text-emerald-700">₦{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">From verified bookings</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Booking Fees</span>
                    <span className="text-xl">💳</span>
                  </div>
                  <p className="text-[24px] font-black text-slate-900">₦{(stats?.bookingFeesTotal ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-amber-700 font-bold mt-1">₦{stats?.bookingFeeConfig ?? 5000} per request</p>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider">Registered Clients</span>
                    <span className="text-xl">👥</span>
                  </div>
                  <p className="text-[24px] font-black text-slate-900">{stats?.clients ?? 0}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">Google authenticated</p>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-[14px] font-black text-slate-900">Quick Operations</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button onClick={() => setSection("banners")} className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all">
                    <span className="text-xl block mb-1">🖼️</span>
                    <p className="text-[13px] font-black text-slate-900">Edit Hero Slides</p>
                    <p className="text-[11px] text-slate-400">Change promotional sliding images</p>
                  </button>
                  <button onClick={() => setSection("notifications")} className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all">
                    <span className="text-xl block mb-1">📢</span>
                    <p className="text-[13px] font-black text-slate-900">Post Notification</p>
                    <p className="text-[11px] text-slate-400">Broadcast updates & notices</p>
                  </button>
                  <button onClick={() => setSection("job_requests")} className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all">
                    <span className="text-xl block mb-1">📋</span>
                    <p className="text-[13px] font-black text-slate-900">Review Job Requests</p>
                    <p className="text-[11px] text-slate-400">Approve quotes & assign engineers</p>
                  </button>
                  <button onClick={() => setSection("services")} className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all">
                    <span className="text-xl block mb-1">🔧</span>
                    <p className="text-[13px] font-black text-slate-900">Manage Services</p>
                    <p className="text-[11px] text-slate-400">Update pricing & descriptions</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. HERO SLIDING BANNERS MANAGER */}
          {section === "banners" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Hero Sliding Images & Promos</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Add, reorder, and edit the carousel banners displayed directly under the hero section</p>
                </div>
                <button
                  onClick={openCreateBanner}
                  className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm"
                >
                  + Add New Slide
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading sliding banners...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-4xl">🖼️</span>
                  <p className="mt-2 text-[14px] font-bold">No sliding banners yet</p>
                  <p className="text-[11.5px] text-slate-400">Click &quot;+ Add New Slide&quot; above to create your first promo slide.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.map((banner) => (
                    <div key={banner.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="relative aspect-[2/1] bg-slate-900 overflow-hidden">
                          <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-white">
                            <span className="text-[9.5px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                              SLIDE #{banner.sortOrder || 1}
                            </span>
                            <h4 className="text-[15px] font-black mt-1 leading-tight">{banner.title}</h4>
                            {banner.subtitle && <p className="text-[11px] text-slate-300 line-clamp-1">{banner.subtitle}</p>}
                          </div>
                          <span className={clsx(
                            "absolute top-2 right-2 text-[9.5px] font-black px-2 py-0.5 rounded-full",
                            banner.active !== false ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                          )}>
                            {banner.active !== false ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1 text-[12px]">
                          <p><strong className="text-slate-700">Target Link:</strong> <span className="font-mono text-slate-500">{banner.link || "Explore catalogue"}</span></p>
                          <p><strong className="text-slate-700">Sort Order:</strong> <span className="text-slate-500">{banner.sortOrder || 1}</span></p>
                        </div>
                      </div>

                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditBanner(banner)}
                          className="flex-1 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11.5px] font-black"
                        >
                          ✏️ Edit Banner Slide
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("banners", banner.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11.5px] font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. NOTIFICATION CENTER & BROADCAST MANAGER */}
          {section === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Notification Center & Broadcasts</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Broadcast announcements, promotions, or direct feedback into clients&apos; notification centers</p>
                </div>
                <button
                  onClick={openCreateNotification}
                  className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm"
                >
                  📢 Post Notification
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading notifications...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-4xl">📢</span>
                  <p className="mt-2 text-[14px] font-bold">No notifications sent yet</p>
                  <p className="text-[11.5px] text-slate-400">Click &quot;📢 Post Notification&quot; to send an announcement to all clients.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.map((notif) => (
                    <div key={notif.id} className="py-3.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg shrink-0">
                          {notif.type === "admin_feedback" ? "💬" : notif.type === "promo" ? "🎉" : notif.type === "alert" ? "⚠️" : "📢"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-[13.5px]">{notif.title}</h4>
                            <span className="text-[9.5px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                              {notif.type || "announcement"}
                            </span>
                            {notif.userEmail && (
                              <span className="text-[9.5px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                To: {notif.userEmail}
                              </span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-slate-600 mt-1 font-medium leading-relaxed">{notif.message}</p>
                          <p className="text-[10.5px] text-slate-400 font-bold mt-1">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : "Just now"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete("notifications", notif.id)}
                        className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-lg text-[11px] font-bold shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. JOB REQUESTS & CLIENT FEEDBACK DISPATCH */}
          {section === "job_requests" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-black text-slate-900">Job Requests, Quotations & Direct Feedback</h3>
                  <p className="text-[11.5px] text-slate-500 font-medium">Review customer booking requests, quote negotiable projects, assign specialists, and send direct feedback</p>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading requests...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-4xl">📋</span>
                  <p className="mt-2 text-[14px] font-bold">No job requests yet</p>
                  <p className="text-[11.5px] text-slate-400">When clients submit bookings or quote requests, they will appear here in real-time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                        <th className="px-4 py-3">Ref & Client</th>
                        <th className="px-4 py-3">Services / Scope</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Assigned Specialist</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((req) => {
                        const isUnderReview = req.jobStatus === "awaiting_admin_review" || req.status === "pending";
                        const isApprovedReady = req.jobStatus === "awaiting_assignment";
                        const isAssigned = req.jobStatus === "provider_assigned" || req.jobStatus === "provider_accepted";

                        return (
                          <tr key={req.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-slate-900 font-mono text-[12px]">{req.requestCode || `QM-REQ-${req.id}`}</div>
                              <div className="font-bold text-slate-800 text-[13px]">{req.fullName}</div>
                              <div className="text-[11px] text-slate-400">{req.phone || req.email}</div>
                              <div className="text-[11px] text-slate-500">📍 {req.location || "Abuja"}</div>
                            </td>
                            <td className="px-4 py-3 max-w-[220px]">
                              <p className="font-bold text-slate-900 line-clamp-2">{req.description || "Service request"}</p>
                              {req.preferredDate && (
                                <p className="text-[10.5px] text-slate-500 mt-1">🗓️ {req.preferredDate} ({req.preferredTime || "Standard"})</p>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-black text-slate-900">₦{(req.totalAmount || 5000).toLocaleString()}</div>
                              <div className="text-[10px] text-emerald-700 font-extrabold">Fee: ₦{(req.bookingFee || 5000).toLocaleString()} (Paid)</div>
                            </td>
                            <td className="px-4 py-3">
                              {req.providerName ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                    👷 {req.providerName}
                                  </span>
                                  {req.providerPhone && <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">{req.providerPhone}</p>}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={clsx(
                                "px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border",
                                isUnderReview ? "bg-amber-50 border-amber-300 text-amber-800 animate-pulse" :
                                isApprovedReady ? "bg-indigo-50 border-indigo-300 text-indigo-800" :
                                isAssigned ? "bg-purple-50 border-purple-300 text-purple-800" :
                                req.jobStatus === "completed" ? "bg-emerald-50 border-emerald-300 text-emerald-800" :
                                "bg-slate-100 border-slate-200 text-slate-700"
                              )}>
                                {(req.jobStatus || req.status || "submitted").replace(/_/g, " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                              {/* Direct Feedback Button */}
                              <button
                                onClick={() => {
                                  setFeedbackTitleInput(`Update on Request ${req.requestCode || ""}`);
                                  setFeedbackMessageInput(req.statusNote || "");
                                  setModal({ mode: "send_feedback", item: req });
                                }}
                                className="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[11.5px] font-bold border border-emerald-200"
                              >
                                💬 Send Feedback
                              </button>

                              {isUnderReview && (
                                <button
                                  onClick={() => {
                                    setQuotedCostInput(req.servicesTotal ? String(req.servicesTotal) : "");
                                    setStatusNoteInput(req.statusNote || "");
                                    setModal({ mode: "approve_review", item: req });
                                  }}
                                  className="px-3 py-1 rounded-lg text-slate-950 bg-amber-400 hover:bg-amber-500 text-[11.5px] font-black shadow-xs"
                                >
                                  ⚡ Review & Approve
                                </button>
                              )}

                              {(!isUnderReview || isApprovedReady || isAssigned) && (
                                <button
                                  onClick={() => {
                                    setSelectedProviderId(req.assignedProviderId ? String(req.assignedProviderId) : "");
                                    setModal({ mode: "assign", item: req });
                                  }}
                                  className="px-3 py-1 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-[11.5px] font-extrabold shadow-xs"
                                >
                                  {req.assignedProviderId ? "Reassign" : "Assign Specialist"}
                                </button>
                              )}

                              {req.phone && (
                                <a
                                  href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 text-[11.5px] font-bold inline-block border border-slate-200"
                                >
                                  WhatsApp
                                </a>
                              )}

                              {/* Upload Milestone Photo */}
                              <button
                                onClick={() => {
                                  setMilestoneStage("work_in_progress");
                                  setMilestoneUrl("");
                                  setMilestoneCaption("");
                                  setModal({ mode: "milestone_photo", item: req });
                                }}
                                className="px-2.5 py-1 rounded-lg text-violet-700 bg-violet-50 hover:bg-violet-100 text-[11.5px] font-bold border border-violet-200"
                              >
                                📸 Photos
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. SERVICES, GALLERY, CATEGORIES, SUBCATEGORIES, PROVIDER APPS, SETTINGS, ETC. */}
          {section === "services" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-black text-slate-900">Engineering Services & Pricing Master</h3>
                <button onClick={openCreate} className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm">+ Add Service</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                      <th className="px-4 py-3">Service Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Pricing Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {svc.imageUrl ? <img src={svc.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">🔧</div>}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{svc.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{svc.shortDescription}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{svc.categoryName || "Engineering"}</td>
                        <td className="px-4 py-3">
                          {svc.price ? (
                            <span className="font-black text-slate-900">₦{Number(svc.price).toLocaleString()}</span>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">Negotiable / Quote</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx("px-2 py-0.5 rounded-full text-[10.5px] font-bold", svc.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                            {svc.active !== false ? "✓ Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <button onClick={() => openEdit(svc)} className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-bold">✏️ Edit</button>
                          <button onClick={() => handleDelete("services", svc.id)} className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-lg font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fallback for other standard tables */}
          {!["dashboard", "banners", "notifications", "job_requests", "services"].includes(section) && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-[16px] font-black text-slate-900 capitalize">{section.replace(/_/g, " ")}</h3>
                {canCreate && (
                  <button onClick={openCreate} className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm">+ Add Record</button>
                )}
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading {section}...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-[14px] font-bold">No records found in {section}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                        {Object.keys(data[0] || {}).slice(0, 6).map((k) => (
                          <th key={k} className="px-4 py-3">{k.replace(/([A-Z])/g, " $1")}</th>
                        ))}
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/70">
                          {Object.keys(data[0] || {}).slice(0, 6).map((k) => (
                            <td key={k} className="px-4 py-3 max-w-[200px] truncate">
                              {String(row[k] ?? "—")}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                            <button onClick={() => openEdit(row)} className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-md font-bold">✏️ Edit</button>
                            <button onClick={() => handleDelete(section, Number(row.id))} className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-md font-bold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: ADD / EDIT HERO SLIDING BANNER ─── */}
      {(modal?.mode === "create_banner" || modal?.mode === "edit_banner") && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">{modal.mode === "create_banner" ? "Add Hero Sliding Banner" : "Edit Sliding Banner"}</h3>
                <p className="text-[11.5px] text-slate-500">Add or customize sliding banner cards under the homepage hero</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Banner Image URL *</label>
                <input
                  type="text"
                  required
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="/hero_engineering.jpg or https://..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] outline-none focus:border-amber-500"
                />
                {formData.imageUrl && (
                  <div className="mt-2 aspect-[2.5/1] rounded-xl overflow-hidden bg-slate-900 relative">
                    <img src={formData.imageUrl} alt="preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Slide Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 10kVA Solar Inverter Installation Promo"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Subtitle / Caption</label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Complete hybrid solar setup with 5-year warranty across Nigeria"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Active Slide</label>
                  <select
                    value={formData.active !== false ? "true" : "false"}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === "true" }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] bg-white outline-none"
                  >
                    <option value="true">✓ Active (Shown in slider)</option>
                    <option value="false">✕ Inactive (Hidden)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl btn-pro-amber text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Banner Slide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: POST NOTIFICATION (Broadcast or Targeted) ─── */}
      {modal?.mode === "create_notification" && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Post Notification</h3>
                <p className="text-[11.5px] text-slate-500">Send an announcement or alert directly to client notification center</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Urgent Update: New Certified Solar Specialists in Abuja"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.message || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write clear message content for clients..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Category / Type</label>
                  <select
                    value={formData.type || "announcement"}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] bg-white outline-none"
                  >
                    <option value="announcement">📢 Announcement</option>
                    <option value="promo">🎉 Promotion</option>
                    <option value="alert">⚠️ System Alert</option>
                    <option value="request_update">📋 Request Update</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Recipient</label>
                  <select
                    value={formData.target || "all"}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] bg-white outline-none"
                  >
                    <option value="all">👥 All Clients (Broadcast)</option>
                    <option value="specific">👤 Specific Client Email</option>
                  </select>
                </div>
              </div>

              {formData.target === "specific" && (
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Target Client Email</label>
                  <input
                    type="email"
                    value={formData.userEmail || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="client@gmail.com"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl btn-pro-amber text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Posting..." : "🚀 Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DIRECT CLIENT FEEDBACK MODAL ─── */}
      {modal?.mode === "send_feedback" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Send Direct Feedback to Client</h3>
                <p className="text-[11.5px] text-slate-500">Delivered directly to {modal.item.fullName}&apos;s in-app notification center</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[12px] space-y-1">
              <p><strong className="text-slate-700">Client:</strong> <span className="font-bold text-slate-900">{modal.item.fullName}</span> ({modal.item.email || modal.item.phone})</p>
              <p><strong className="text-slate-700">Request:</strong> <span className="font-mono text-slate-800">{modal.item.requestCode || `QM-REQ-${modal.item.id}`}</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Feedback Title</label>
                <input
                  type="text"
                  value={feedbackTitleInput}
                  onChange={(e) => setFeedbackTitleInput(e.target.value)}
                  placeholder="e.g. Update on your plumbing quote request"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Feedback Message *</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackMessageInput}
                  onChange={(e) => setFeedbackMessageInput(e.target.value)}
                  placeholder="Write message to client (e.g. Our engineering supervisor has reviewed your site scope. We will dispatch a specialist tomorrow at 10 AM...)"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleSendFeedback}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Sending..." : "✓ Send Direct to Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE & REVIEW REQUEST (With Negotiable Quote Reply) ─── */}
      {modal?.mode === "approve_review" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Admin Review & Job Approval</h3>
                <p className="text-[11.5px] text-slate-500 font-mono">Ref: {modal.item.requestCode || `QM-REQ-${modal.item.id}`}</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[12.5px] space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Client:</span>
                <span className="font-extrabold text-slate-900">{modal.item.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Phone / WhatsApp:</span>
                <span className="font-mono font-bold text-slate-800">{modal.item.phone || "On File"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Site Location:</span>
                <span className="font-medium text-slate-800">{modal.item.address ? `${modal.item.address}, ` : ""}{modal.item.location || "Abuja"}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold block mb-0.5">Project Scope:</span>
                <p className="text-slate-800 font-medium">{modal.item.description}</p>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Quoted Service Cost in NGN (For Negotiable Requests)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500">₦</span>
                <input
                  type="number"
                  placeholder="e.g. 35000 (Optional for fixed jobs)"
                  value={quotedCostInput}
                  onChange={(e) => setQuotedCostInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Entering this quote will automatically notify the client on their Activity tab.</p>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Admin Note to Client (Visible on Activity Tab & Notifications)
              </label>
              <textarea
                rows={2}
                value={statusNoteInput}
                onChange={(e) => setStatusNoteInput(e.target.value)}
                placeholder="e.g. Request approved. Specialist will arrive tomorrow between 10am-12pm."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[12.5px] text-slate-900 outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleApproveJob(modal.item!.id, Number(quotedCostInput), statusNoteInput)}
                className="flex-1 py-2.5 rounded-xl btn-pro-amber text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Approving..." : "✓ Approve Job & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ASSIGN SPECIALIST ─── */}
      {modal?.mode === "assign" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[16px] font-black text-slate-900">Assign Verified Specialist</h3>
                <p className="text-[11px] text-slate-500 font-mono">Job Ref: {modal.item.requestCode || `QM-REQ-${modal.item.id}`}</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[12px] space-y-1">
              <p className="font-extrabold text-slate-900">{modal.item.fullName} ({modal.item.location || "Abuja"})</p>
              <p className="text-slate-600 line-clamp-2">{modal.item.description}</p>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1.5">
                Select Verified Service Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white outline-none focus:border-blue-500 font-medium"
              >
                <option value="">-- Choose Verified Specialist --</option>
                {verifiedProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    ✓ {p.fullName} — {p.professionName || "Specialist"} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">Cancel</button>
              <button
                onClick={() => handleAssignJob(modal.item!.id)}
                disabled={saving || !selectedProviderId}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold shadow-md disabled:opacity-50"
              >
                {saving ? "Assigning..." : "Confirm & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: STANDARD CREATE / EDIT ─── */}
      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[16px] font-black text-slate-900">
                {modal.mode === "create" ? `Add New ${section}` : `Edit ${section}`}
              </h3>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 no-scrollbar">
              {Object.keys(formData).map((key) => {
                if (key === "id" || key === "createdAt" || key === "updatedAt") return null;
                return (
                  <div key={key}>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type="text"
                      value={formData[key] || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] outline-none focus:border-amber-500"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-pro-amber px-5 py-2 rounded-xl text-[12.5px] font-extrabold shadow-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[13px] font-black shadow-2xl border border-slate-700 animate-fade-in">
          {toast}
        </div>
      )}

      {/* ── Milestone Photo Upload Modal ──────────────────── */}
      {modal?.mode === "milestone_photo" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-amber-400 font-extrabold">{modal.item.requestCode || `QM-REQ-${modal.item.id}`}</p>
                <h3 className="text-[16px] font-black text-white">📸 Upload Milestone Photo</h3>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Client info */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-[12.5px]">
                <div className="font-extrabold text-slate-900">{modal.item.fullName}</div>
                <div className="text-slate-500">{modal.item.description?.slice(0, 80)}...</div>
              </div>

              {/* Stage selector */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Job Stage</label>
                <select
                  value={milestoneStage}
                  onChange={e => setMilestoneStage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  {MILESTONE_STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Photo URL</label>
                <input
                  type="url"
                  placeholder="https://i.imgur.com/your-photo.jpg"
                  value={milestoneUrl}
                  onChange={e => setMilestoneUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">Use Imgur, Cloudinary, or any direct image link. PNG/JPG supported.</p>
              </div>

              {/* Preview */}
              {milestoneUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={milestoneUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Caption (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Foundation concrete pour completed"
                  value={milestoneCaption}
                  onChange={e => setMilestoneCaption(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-[11px] text-violet-900 font-medium">
                📱 <strong>Auto-alert:</strong> The client will receive a WhatsApp notification when you upload this photo.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button
                onClick={handleMilestonePhotoSave}
                disabled={!milestoneUrl.trim() || milestoneUploading}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-extrabold shadow-sm disabled:opacity-40 transition-all"
              >
                {milestoneUploading ? "Uploading..." : "📸 Upload & Notify Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
