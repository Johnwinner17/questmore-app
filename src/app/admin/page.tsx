"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
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

// Preset verified photos for instant engineering selection
const ENGINEERING_PHOTO_PRESETS = [
  { name: "Building & Construction", url: "https://images.pexels.com/photos/11321791/pexels-photo-11321791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "🏗️" },
  { name: "Solar Panel & Inverter", url: "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "☀️" },
  { name: "Electrical Wiring DB", url: "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "⚡" },
  { name: "PPR Plumbing Pipes", url: "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "🔧" },
  { name: "POP Ceiling & Lights", url: "https://images.pexels.com/photos/8961438/pexels-photo-8961438.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "✨" },
  { name: "Wall Screed & Paint", url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "🎨" },
  { name: "Stone-Coated Roof", url: "https://images.pexels.com/photos/5997994/pexels-photo-5997994.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "🏠" },
  { name: "Granite & Floor Tiling", url: "https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", icon: "🔲" },
];

const PRESET_FEATURE_TAGS = [
  "COREN-registered structural engineers",
  "Complete bill of quantities (BOQ)",
  "Stage-by-stage quality inspections",
  "Turnkey completion guarantee",
  "Tier-1 Mono PERC solar panels",
  "5-year manufacturer warranty",
  "100% pure copper cables",
  "Hydrostatic pressure leak testing",
  "Anti-fungal, washable premium paints",
  "Laser precision alignment",
  "Free initial site assessment",
];

async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`/api/admin${path}`, opts);
  return r.json();
}

function compressAndReadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const sidebarItems: { key: Section; label: string; icon: string; badgeKey?: keyof AdminStats }[] = [
  { key: "dashboard", label: "Overview & Metrics", icon: "📊" },
  { key: "services", label: "Services & Studio", icon: "🔧", badgeKey: "services" },
  { key: "banners", label: "Hero Sliding Banners", icon: "🖼️" },
  { key: "notifications", label: "Notification Center", icon: "📢" },
  { key: "job_requests", label: "Job Requests & Quotes", icon: "📋", badgeKey: "pendingRequests" },
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
  { key: "users", label: "All Users & Clients", icon: "👥" },
];

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | "all">("all");

  // Modals state
  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "service_studio" | "create_banner" | "edit_banner" | "create_notification" | "send_feedback" | "approve_review" | "assign" | "milestone_photo";
    item?: Record<string, any>;
  } | null>(null);

  // Form State for Service Studio
  const [serviceName, setServiceName] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState<number>(1);
  const [serviceSubcategoryId, setServiceSubcategoryId] = useState<number | null>(null);
  const [serviceShortDesc, setServiceShortDesc] = useState("");
  const [serviceFullDesc, setServiceFullDesc] = useState("");
  const [serviceImageUrl, setServiceImageUrl] = useState("");
  const [servicePricingType, setServicePricingType] = useState<"negotiable" | "fixed">("negotiable");
  const [servicePrice, setServicePrice] = useState<string>("");
  const [serviceFeatured, setServiceFeatured] = useState(false);
  const [serviceActive, setServiceActive] = useState(true);
  const [serviceFeaturesList, setServiceFeaturesList] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  const [serviceImageMode, setServiceImageMode] = useState<"upload" | "url" | "presets">("upload");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Generic and Banner form data
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [catOptions, setCatOptions] = useState<{ id: number; name: string; icon?: string }[]>([]);
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
    { key: "awaiting_assignment", label: "Approved for Assignment" },
    { key: "provider_assigned", label: "Specialist Assigned" },
    { key: "provider_accepted", label: "Schedule Accepted" },
    { key: "work_in_progress", label: "Work in Progress" },
    { key: "work_completed", label: "Work Completed" },
    { key: "completed", label: "Project Closed" },
  ];

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
    api("?table=categories").then((res) => Array.isArray(res) && setCatOptions(res));
    api("?table=subcategories").then((res) => Array.isArray(res) && setSubOptions(res));
    api("?table=verified_providers").then((res) => Array.isArray(res) && setVerifiedProviders(res));

    const statsInterval = setInterval(() => loadStats(), 30_000);
    return () => clearInterval(statsInterval);
  }, [loadStats]);

  useEffect(() => {
    if (section !== "dashboard") {
      loadData(section);
    }
  }, [section, loadData]);

  // ── Open Service Studio (Create or Edit) ──
  const openServiceStudio = (service?: Record<string, any>) => {
    if (service) {
      setServiceName(service.name || "");
      setServiceCategoryId(Number(service.categoryId) || 1);
      setServiceSubcategoryId(service.subcategoryId ? Number(service.subcategoryId) : null);
      setServiceShortDesc(service.shortDescription || "");
      setServiceFullDesc(service.fullDescription || "");
      setServiceImageUrl(service.imageUrl || "");
      setServicePricingType(service.price ? "fixed" : "negotiable");
      setServicePrice(service.price ? String(service.price) : "");
      setServiceFeatured(Boolean(service.featured));
      setServiceActive(service.active !== false);

      // Parse features
      let feats: string[] = [];
      if (service.features) {
        try {
          feats = typeof service.features === "string" ? JSON.parse(service.features) : service.features;
        } catch {
          feats = [];
        }
      }
      setServiceFeaturesList(Array.isArray(feats) ? feats : []);
      setModal({ mode: "service_studio", item: service });
    } else {
      // Create new default
      setServiceName("");
      setServiceCategoryId(1);
      setServiceSubcategoryId(null);
      setServiceShortDesc("");
      setServiceFullDesc("");
      setServiceImageUrl("");
      setServicePricingType("negotiable");
      setServicePrice("");
      setServiceFeatured(false);
      setServiceActive(true);
      setServiceFeaturesList([]);
      setModal({ mode: "service_studio" });
    }
  };

  // Handle Local File Upload from Gallery/Laptop
  const handleLocalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isBanner = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const dataUrl = await compressAndReadFile(file);
      if (isBanner) {
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      } else {
        setServiceImageUrl(dataUrl);
      }
      showToast("✓ Image loaded successfully from gallery!");
    } catch (err) {
      showToast("Could not process image file. Please try another.");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  // Add Feature bullet point tag
  const addFeatureTag = (tagText: string) => {
    const clean = tagText.trim();
    if (!clean) return;
    if (!serviceFeaturesList.includes(clean)) {
      setServiceFeaturesList((prev) => [...prev, clean]);
    }
    setNewFeatureInput("");
  };

  // Remove Feature bullet point tag
  const removeFeatureTag = (index: number) => {
    setServiceFeaturesList((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Service from Studio
  const handleSaveServiceStudio = async () => {
    if (!serviceName.trim()) {
      showToast("Service title/name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: serviceName.trim(),
        categoryId: Number(serviceCategoryId),
        subcategoryId: serviceSubcategoryId ? Number(serviceSubcategoryId) : null,
        shortDescription: serviceShortDesc.trim() || null,
        fullDescription: serviceFullDesc.trim() || null,
        imageUrl: serviceImageUrl.trim() || null,
        price: servicePricingType === "fixed" && servicePrice ? Number(servicePrice) : null,
        featured: serviceFeatured,
        active: serviceActive,
        features: serviceFeaturesList.length > 0 ? JSON.stringify(serviceFeaturesList) : null,
      };

      if (modal?.item?.id) {
        // Edit existing
        const res = await api("", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "services", id: modal.item.id, data: payload }),
        });
        if (res.error) showToast(`Error: ${res.error}`);
        else {
          showToast("✓ Service updated successfully!");
          setModal(null);
          loadData("services");
          loadStats();
        }
      } else {
        // Create new
        const res = await api("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "services", data: payload }),
        });
        if (res.error) showToast(`Error: ${res.error}`);
        else {
          showToast("✓ New service created & posted live!");
          setModal(null);
          loadData("services");
          loadStats();
        }
      }
    } catch (e: any) {
      showToast(`Action failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Toggle Active on Service
  const handleToggleServiceActive = async (service: Record<string, any>) => {
    const newStatus = service.active === false ? true : false;
    try {
      await api("", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "services", id: service.id, data: { active: newStatus } }),
      });
      setData((prev) => prev.map((s) => (s.id === service.id ? { ...s, active: newStatus } : s)));
      showToast(`Service "${service.name}" set to ${newStatus ? "ACTIVE" : "INACTIVE"}`);
    } catch (e) {
      showToast("Failed to toggle status");
    }
  };

  // 1-Click Duplicate Service
  const handleCloneService = (service: Record<string, any>) => {
    openServiceStudio({
      ...service,
      id: undefined,
      name: `${service.name} (Copy)`,
    });
    showToast("Cloned service into editor. Customize and click Save!");
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

  // Direct Client Feedback
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

  // Approve Job & Quote
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
        showToast("✓ Job approved and forwarded! Client notified.");
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

  // Assign Specialist
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

  // Provider Application Verification
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

  // Platform Booking Fee Save
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

  // Generic Save for other tables
  const handleGenericSave = async () => {
    setSaving(true);
    try {
      if (modal?.mode === "create" || modal?.mode === "create_banner" || modal?.mode === "create_notification") {
        const table = modal.mode === "create_banner" ? "banners" : modal.mode === "create_notification" ? "notifications" : section;
        const res = await api("", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, data: formData }),
        });
        if (res.error) showToast(`Error: ${res.error}`);
        else {
          showToast("✓ Created record successfully!");
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
        if (res.error) showToast(`Error: ${res.error}`);
        else {
          showToast("✓ Updated record successfully!");
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
    setFormData({ ...item, active: item.active !== false });
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

  // Filtered Services in Services Tab
  const filteredServices = data.filter((svc) => {
    const matchesSearch =
      !searchQuery ||
      svc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === "all" || Number(svc.categoryId) === Number(selectedCategoryFilter);
    return matchesSearch && matchesCategory;
  });

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
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {sidebarItems.map((item) => {
            const isActive = section === item.key;
            const badgeValue = item.badgeKey && stats ? stats[item.badgeKey] : null;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key);
                  setSidebarOpen(false);
                  setSearchQuery("");
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all text-left",
                  isActive
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[16px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {badgeValue !== null && badgeValue !== undefined && Number(badgeValue) > 0 && (
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-black",
                      isActive ? "bg-slate-950 text-white" : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                    )}
                  >
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile / Quick Stats */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 text-[12px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-medium">PostgreSQL Live</span>
          </div>
          <a
            href="/"
            target="_blank"
            className="text-amber-400 font-bold hover:underline text-[11.5px]"
          >
            Visit App ↗
          </a>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-2xl text-slate-700">☰</button>
            <h2 className="text-[17px] font-black text-slate-900 capitalize flex items-center gap-2">
              <span>{sidebarItems.find((s) => s.key === section)?.icon}</span>
              <span>{sidebarItems.find((s) => s.key === section)?.label}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {section === "services" && (
              <button
                onClick={() => openServiceStudio()}
                className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm flex items-center gap-1.5"
              >
                <span>+ Post New Service</span>
              </button>
            )}

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

            {/* Export CSV Button */}
            {["services", "users", "job_requests", "payments"].includes(section) && (
              <button
                onClick={() => exportToCSV(data, `questmore_${section}`)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 shadow-2xs"
                title="Export current table to CSV file"
              >
                📥 Export CSV
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

        {/* Dynamic Section Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* 1. OVERVIEW & METRICS */}
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

                <div
                  className="bg-white p-4.5 rounded-2xl border-2 border-amber-300 shadow-sm cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all"
                  onClick={() => setSection("services")}
                  title="Click to manage all services"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-amber-800">Services Listed</span>
                    <span className="text-xl">🔧</span>
                  </div>
                  <p className="text-[26px] font-black text-slate-900">{stats?.services ?? 0}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">Across {stats?.categories ?? 4} categories · Click to open Studio</p>
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

                <div
                  className="bg-white p-4.5 rounded-2xl border-2 border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                  onClick={() => setSection("users")}
                  title="Click to view all registered clients"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-amber-700">Registered Clients</span>
                    <span className="text-xl">👥</span>
                  </div>
                  <p className="text-[28px] font-black text-amber-700">{stats?.clients ?? 0}</p>
                  <p className="text-[11px] font-bold mt-1 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-500">{stats?.users ?? 0} total users · Click to view</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-[14px] font-black text-slate-900">Fast Operations Studio</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => openServiceStudio()}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group"
                  >
                    <span className="text-2xl block mb-1.5">⚡</span>
                    <p className="text-[13px] font-black text-slate-900 group-hover:text-amber-800">Post New Service</p>
                    <p className="text-[11px] text-slate-400">Upload phone/laptop photo & set price</p>
                  </button>
                  <button
                    onClick={() => setSection("banners")}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1.5">🖼️</span>
                    <p className="text-[13px] font-black text-slate-900">Hero Slide Banners</p>
                    <p className="text-[11px] text-slate-400">Customize sliding image carousel</p>
                  </button>
                  <button
                    onClick={() => setSection("job_requests")}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1.5">📋</span>
                    <p className="text-[13px] font-black text-slate-900">Job Requests</p>
                    <p className="text-[11px] text-slate-400">Approve quotes & assign specialists</p>
                  </button>
                  <button
                    onClick={() => setSection("notifications")}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1.5">📢</span>
                    <p className="text-[13px] font-black text-slate-900">Post Notification</p>
                    <p className="text-[11px] text-slate-400">Broadcast alerts to client apps</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. ADVANCED SERVICES & PRICING STUDIO */}
          {section === "services" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Engineering Services & Pricing Studio</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Create, edit, toggle pricing type, and upload custom images from your phone or laptop</p>
                </div>
                <button
                  onClick={() => openServiceStudio()}
                  className="btn-pro-amber px-4 py-2.5 rounded-xl text-[13px] font-black shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>+ Post New Service</span>
                </button>
              </div>

              {/* Filters & Category Chips */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[11.5px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
                  <button
                    onClick={() => setSelectedCategoryFilter("all")}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all",
                      selectedCategoryFilter === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    All Categories ({data.length})
                  </button>
                  {catOptions.map((c) => {
                    const count = data.filter((s) => Number(s.categoryId) === c.id).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategoryFilter(c.id)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all flex items-center gap-1.5",
                          selectedCategoryFilter === c.id
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        <span>{c.icon === "zap" ? "⚡" : c.icon === "droplets" ? "🔧" : c.icon === "home" ? "🏠" : "🏗️"}</span>
                        <span>{c.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search input */}
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services by title or scope..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-[13px] bg-slate-50/50 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Services */}
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading services...</div>
              ) : filteredServices.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <span className="text-4xl">🔧</span>
                  <p className="text-[14px] font-bold">No services matching this filter</p>
                  <button onClick={() => openServiceStudio()} className="btn-pro-amber px-4 py-2 rounded-xl text-[12px] font-black">
                    + Post First Service
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                        <th className="px-4 py-3">Service Name & Image</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Pricing Model</th>
                        <th className="px-4 py-3">Badges</th>
                        <th className="px-4 py-3">Visibility</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredServices.map((svc) => {
                        const cat = catOptions.find((c) => c.id === Number(svc.categoryId));
                        const isNegotiable = !svc.price;

                        return (
                          <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-3 max-w-[280px]">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-2xs relative">
                                {svc.imageUrl ? (
                                  <img src={svc.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-lg">🔧</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-[13px] truncate">{svc.name}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-1">{svc.shortDescription || "No description"}</p>
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">
                              {cat?.name || "General"}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              {isNegotiable ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  💬 Negotiable / Quote
                                </span>
                              ) : (
                                <span className="text-[13px] font-black text-slate-950 font-mono">
                                  ₦{Number(svc.price).toLocaleString()}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              {svc.featured ? (
                                <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                                  ★ FEATURED
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">Standard</span>
                              )}
                            </td>

                            {/* 1-Click Quick Toggle Visibility */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleServiceActive(svc)}
                                className={clsx(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer",
                                  svc.active !== false
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                )}
                                title="Click to toggle visibility on customer app"
                              >
                                <span className={clsx("h-2 w-2 rounded-full", svc.active !== false ? "bg-emerald-500" : "bg-slate-400")} />
                                <span>{svc.active !== false ? "Live (Visible)" : "Hidden (Draft)"}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleCloneService(svc)}
                                className="px-2.5 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 text-[11.5px] font-bold"
                                title="Duplicate this service"
                              >
                                📋 Clone
                              </button>
                              <button
                                type="button"
                                onClick={() => openServiceStudio(svc)}
                                className="px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 text-[11.5px] font-black border border-blue-200"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete("services", svc.id)}
                                className="px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11.5px] font-bold"
                              >
                                Delete
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

          {/* 3. HERO SLIDING BANNERS */}
          {section === "banners" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Hero Sliding Images & Promos</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Add, reorder, and edit carousel banners with phone/laptop image upload</p>
                </div>
                <button onClick={openCreateBanner} className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm">
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

          {/* 4. JOB REQUESTS & QUOTATIONS */}
          {section === "job_requests" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-black text-slate-900">Job Requests & Direct Feedback</h3>
                  <p className="text-[11.5px] text-slate-500 font-medium">Review customer booking requests, quote negotiable scopes, assign specialists, and send direct feedback</p>
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
                              <span
                                className={clsx(
                                  "px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border",
                                  isUnderReview
                                    ? "bg-amber-50 border-amber-300 text-amber-800 animate-pulse"
                                    : isApprovedReady
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                                    : isAssigned
                                    ? "bg-purple-50 border-purple-300 text-purple-800"
                                    : req.jobStatus === "completed"
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                    : "bg-slate-100 border-slate-200 text-slate-700"
                                )}
                              >
                                {(req.jobStatus || req.status || "submitted").replace(/_/g, " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                              <button
                                onClick={() => {
                                  setFeedbackTitleInput(`Update on Request ${req.requestCode || ""}`);
                                  setFeedbackMessageInput(req.statusNote || "");
                                  setModal({ mode: "send_feedback", item: req });
                                }}
                                className="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[11.5px] font-bold border border-emerald-200"
                              >
                                💬 Feedback
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
                                  ⚡ Review & Quote
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
                                  className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-[11.5px] font-black inline-block border border-emerald-300"
                                >
                                  WhatsApp
                                </a>
                              )}

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

          {/* 5. NOTIFICATION CENTER */}
          {section === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900">Broadcast Notification Center</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Send instant updates and announcements to all client notification inboxes</p>
                </div>
                <button onClick={openCreateNotification} className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm">
                  📢 Post Notification
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading notifications...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-4xl">📢</span>
                  <p className="mt-2 text-[14px] font-bold">No active notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.map((n) => (
                    <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wider">
                            {n.type || "ANNOUNCEMENT"}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-[14px]">{n.title}</h4>
                        </div>
                        <p className="text-[12.5px] text-slate-600">{n.message}</p>
                      </div>
                      <button onClick={() => handleDelete("notifications", n.id)} className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. USERS & CLIENTS */}
          {section === "users" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-[16px] font-black text-slate-900">Registered Users & Clients ({data.length})</h3>
                  <p className="text-[11.5px] text-slate-500">Permanently saved Google accounts, contact phone numbers, and profile locations</p>
                </div>
                <button
                  onClick={() => exportToCSV(data, "questmore_registered_users")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-[12px] font-bold hover:bg-slate-50"
                >
                  📥 Export CSV
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading users...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                        <th className="px-4 py-3">User / Profile</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Phone / WhatsApp</th>
                        <th className="px-4 py-3">Primary Location</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : "👤"}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{u.fullName || "QuestMore User"}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx(
                              "px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase",
                              u.role === "admin" ? "bg-red-100 text-red-800" :
                              u.role === "provider" ? "bg-purple-100 text-purple-800" :
                              "bg-blue-100 text-blue-800"
                            )}>
                              {u.role || "client"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {u.phone || <span className="text-slate-400 italic">Not set</span>}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {u.location || "Abuja (FCT)"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                            {u.phone && (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-black border border-emerald-200 inline-block"
                              >
                                WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete("users", u.id)}
                              className="px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 text-[11px] font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 7. ALL OTHER SECTIONS (Categories, Subcategories, Reviews, FAQs, Areas, Settings) */}
          {!["dashboard", "services", "banners", "job_requests", "notifications", "users"].includes(section) && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[16px] font-black text-slate-900 capitalize">{section.replace(/_/g, " ")}</h3>
                {section === "settings" && (
                  <button onClick={handleSaveBookingFee} disabled={saving} className="btn-pro-amber px-4 py-2 rounded-xl text-[12.5px] font-black shadow-sm">
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                )}
              </div>

              {section === "settings" ? (
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">
                      Platform Booking Fee (in NGN)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500">₦</span>
                      <input
                        type="number"
                        value={bookingFeeInput}
                        onChange={(e) => setBookingFeeInput(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-[14px] outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">This amount is charged to unlock specialist dispatch on all client bookings.</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-slate-400">Loading {section}...</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No records found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                        {Object.keys(data[0] || {}).slice(0, 5).map((k) => (
                          <th key={k} className="px-4 py-3">{k.replace(/([A-Z])/g, " $1")}</th>
                        ))}
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/70">
                          {Object.keys(data[0] || {}).slice(0, 5).map((k) => (
                            <td key={k} className="px-4 py-3 max-w-[200px] truncate">
                              {String(row[k] ?? "—")}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDelete(section, Number(row.id))}
                              className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-lg font-bold"
                            >
                              Delete
                            </button>
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL: ADVANCED SERVICE POSTING & EDITING STUDIO ─── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modal?.mode === "service_studio" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-200">
            {/* Studio Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                  🔧
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-white">
                    {modal.item ? "Edit Engineering Service" : "Post New Engineering Service"}
                  </h3>
                  <p className="text-[11.5px] text-amber-400 font-bold">Interactive Creator Studio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Studio Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">
              {/* 1. Category Selection (Clickable Badges) */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-800 mb-2">
                  Select Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {catOptions.map((c) => {
                    const isSelected = serviceCategoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setServiceCategoryId(c.id);
                          setServiceSubcategoryId(null);
                        }}
                        className={clsx(
                          "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer",
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/40 text-slate-950 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <span className="text-xl mb-1">{c.icon === "zap" ? "⚡" : c.icon === "droplets" ? "🔧" : c.icon === "home" ? "🏠" : "🏗️"}</span>
                        <span className="text-[12.5px] font-black">{c.name}</span>
                        {isSelected && <span className="text-[10px] font-bold text-amber-700 mt-1">✓ Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Service Title */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-800 mb-1">
                  Service Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. 10kVA Commercial Solar Inverter & Battery Setup"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] font-bold text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              {/* 3. Image Selection: Local Phone/Laptop Upload, URL or Presets */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-extrabold text-slate-800">
                    Service Photography / Image *
                  </label>
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setServiceImageMode("upload")}
                      className={clsx(
                        "px-2.5 py-1 rounded-md transition-all",
                        serviceImageMode === "upload" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      📱 Phone/Laptop File
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceImageMode("presets")}
                      className={clsx(
                        "px-2.5 py-1 rounded-md transition-all",
                        serviceImageMode === "presets" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      ⭐ Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceImageMode("url")}
                      className={clsx(
                        "px-2.5 py-1 rounded-md transition-all",
                        serviceImageMode === "url" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      🔗 Paste Link
                    </button>
                  </div>
                </div>

                {/* Mode A: Local File Upload */}
                {serviceImageMode === "upload" && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleLocalImageSelect(e, false)}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-4 text-center bg-white cursor-pointer transition-all hover:bg-amber-50/30"
                    >
                      <span className="text-3xl block mb-1">📷</span>
                      <p className="text-[13px] font-black text-slate-900">
                        {imageUploading ? "Processing Image..." : "Tap to Pick Image from Phone Gallery or Laptop"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Supports any format (JPG, PNG, WebP, HEIC, GIF). Auto-optimized.</p>
                    </div>
                  </div>
                )}

                {/* Mode B: Presets */}
                {serviceImageMode === "presets" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ENGINEERING_PHOTO_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setServiceImageUrl(p.url)}
                        className={clsx(
                          "rounded-xl overflow-hidden border p-1 text-left bg-white transition-all",
                          serviceImageUrl === p.url ? "border-amber-500 ring-2 ring-amber-400" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="aspect-[1.5/1] rounded-lg overflow-hidden bg-slate-900 mb-1">
                          <img src={p.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-[10.5px] font-bold text-slate-800 truncate">{p.icon} {p.name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mode C: Web URL */}
                {serviceImageMode === "url" && (
                  <input
                    type="url"
                    value={serviceImageUrl}
                    onChange={(e) => setServiceImageUrl(e.target.value)}
                    placeholder="https://images.pexels.com/photos/..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] bg-white outline-none focus:border-amber-500"
                  />
                )}

                {/* Live Image Preview */}
                {serviceImageUrl && (
                  <div className="relative aspect-[2.2/1] rounded-2xl overflow-hidden bg-slate-900 border border-slate-300">
                    <img src={serviceImageUrl} alt="preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                      <p className="text-white text-[12px] font-black">✓ Live Image Attached</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setServiceImageUrl("")}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Clickable Pricing Model (Segmented Control) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="block text-[12px] font-extrabold text-slate-800">
                  Pricing Model *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setServicePricingType("negotiable");
                      setServicePrice("");
                    }}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      servicePricingType === "negotiable"
                        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/40 text-slate-950"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span className="text-lg block mb-1">💬</span>
                    <p className="text-[13px] font-black">Negotiable / Quote</p>
                    <p className="text-[10.5px] text-slate-500">Custom BOQ & inspection scope</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServicePricingType("fixed")}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      servicePricingType === "fixed"
                        ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/40 text-slate-950"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span className="text-lg block mb-1">💰</span>
                    <p className="text-[13px] font-black">Fixed Price (₦)</p>
                    <p className="text-[10.5px] text-slate-500">Fixed rate standard service</p>
                  </button>
                </div>

                {servicePricingType === "fixed" && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <label className="block text-[11.5px] font-bold text-slate-700">
                      Enter Fixed Price in NGN (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-600">₦</span>
                      <input
                        type="number"
                        required
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] font-black text-slate-900 bg-white outline-none focus:border-amber-500"
                      />
                    </div>
                    {/* Quick Price Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["15000", "25000", "50000", "100000", "250000", "500000"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setServicePrice(p)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-amber-50"
                        >
                          ₦{Number(p).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Short & Full Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 mb-1">
                    Short Summary (1-2 sentences for card listings)
                  </label>
                  <input
                    type="text"
                    value={serviceShortDesc}
                    onChange={(e) => setServiceShortDesc(e.target.value)}
                    placeholder="e.g. Complete solar system design, panel mounting, and inverter setup."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-extrabold text-slate-800 mb-1">
                    Full Scope Description
                  </label>
                  <textarea
                    rows={3}
                    value={serviceFullDesc}
                    onChange={(e) => setServiceFullDesc(e.target.value)}
                    placeholder="Detailed explanation of what the engineer will execute on site..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[12.5px] text-slate-900 outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* 6. Feature Bullet Points Builder (No Raw JSON typing) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <label className="block text-[12px] font-extrabold text-slate-800">
                  Feature Highlights & Guarantee Bullet Points
                </label>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeatureTag(newFeatureInput);
                      }
                    }}
                    placeholder="Type feature (e.g. 5-year replacement warranty) & tap Add..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => addFeatureTag(newFeatureInput)}
                    className="btn-pro-amber px-4 py-2 rounded-xl text-[12px] font-black"
                  >
                    + Add
                  </button>
                </div>

                {/* Active Tags */}
                {serviceFeaturesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {serviceFeaturesList.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-bold bg-amber-100 text-slate-900 border border-amber-300 shadow-2xs"
                      >
                        <span>✓ {tag}</span>
                        <button
                          type="button"
                          onClick={() => removeFeatureTag(i)}
                          className="text-slate-500 hover:text-red-700 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Presets */}
                <div className="pt-2">
                  <p className="text-[10.5px] font-bold text-slate-400 mb-1.5">Quick Presets (Tap to include):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FEATURE_TAGS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => addFeatureTag(p)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10.5px] font-bold text-slate-600 hover:border-amber-400 hover:text-slate-900"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7. Clickable Toggles: Featured & Active (iOS Style Switches) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setServiceFeatured(!serviceFeatured)}
                  className={clsx(
                    "p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                    serviceFeatured ? "bg-amber-50 border-amber-400" : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div>
                    <p className="text-[13px] font-black text-slate-900">Featured Service Badge</p>
                    <p className="text-[11px] text-slate-500">Show ★ VERIFIED star banner on card</p>
                  </div>
                  <div className={clsx("w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5", serviceFeatured ? "bg-amber-500" : "bg-slate-300")}>
                    <div className={clsx("h-5 w-5 rounded-full bg-white shadow-xs transition-transform", serviceFeatured ? "translate-x-5" : "translate-x-0")} />
                  </div>
                </div>

                <div
                  onClick={() => setServiceActive(!serviceActive)}
                  className={clsx(
                    "p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                    serviceActive ? "bg-emerald-50 border-emerald-400" : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div>
                    <p className="text-[13px] font-black text-slate-900">Active Visibility</p>
                    <p className="text-[11px] text-slate-500">Visible on homepage & catalogue</p>
                  </div>
                  <div className={clsx("w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5", serviceActive ? "bg-emerald-500" : "bg-slate-300")}>
                    <div className={clsx("h-5 w-5 rounded-full bg-white shadow-xs transition-transform", serviceActive ? "translate-x-5" : "translate-x-0")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServiceStudio}
                disabled={saving || !serviceName.trim()}
                className="btn-pro-amber px-6 py-2.5 rounded-xl text-[13.5px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Saving Service..." : modal?.item ? "✓ Save Changes" : "🚀 Post Service Live"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT HERO SLIDING BANNER (With Phone/Laptop Upload) ─── */}
      {(modal?.mode === "create_banner" || modal?.mode === "edit_banner") && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">{modal.mode === "create_banner" ? "Add Hero Sliding Banner" : "Edit Sliding Banner"}</h3>
                <p className="text-[11.5px] text-slate-500">Pick image from device gallery or paste URL</p>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Banner Image *</label>
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleLocalImageSelect(e, true)}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="/hero_engineering.jpg or paste URL"
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11.5px] font-bold border border-slate-200"
                  >
                    📱 Gallery
                  </button>
                </div>

                {formData.imageUrl && (
                  <div className="mt-2 aspect-[2.2/1] rounded-xl overflow-hidden bg-slate-900 relative border border-slate-200">
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. 10kVA Solar Power Systems"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Subtitle / Caption</label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Clean, reliable energy solutions with 5-year warranty"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder || 1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Active Status</label>
                  <select
                    value={formData.active !== false ? "true" : "false"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))}
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
                onClick={handleGenericSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl btn-pro-amber text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Banner Slide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: POST NOTIFICATION ─── */}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Write clear message content for clients..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Category / Type</label>
                  <select
                    value={formData.type || "announcement"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="client@gmail.com"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">Cancel</button>
              <button
                onClick={handleGenericSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl btn-pro-amber text-[13px] font-black shadow-md disabled:opacity-50"
              >
                {saving ? "Posting..." : "🚀 Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DIRECT CLIENT FEEDBACK ─── */}
      {modal?.mode === "send_feedback" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Send Direct Feedback to Client</h3>
                <p className="text-[11.5px] text-slate-500">Delivered directly to {modal.item.fullName}&apos;s notification center</p>
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

      {/* ─── MODAL: APPROVE & QUOTE ─── */}
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
                  placeholder="e.g. 35000"
                  value={quotedCostInput}
                  onChange={(e) => setQuotedCostInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Entering this quote will automatically notify the client on their Activity tab.</p>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Admin Note to Client (Visible on Activity Tab)
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

      {/* ─── MODAL: MILESTONE PHOTO ─── */}
      {modal?.mode === "milestone_photo" && modal.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-amber-400 font-extrabold">{modal.item.requestCode || `QM-REQ-${modal.item.id}`}</p>
                <h3 className="text-[16px] font-black text-white">📸 Upload Milestone Photo</h3>
              </div>
              <button onClick={() => setModal(null)} className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-[12.5px]">
                <div className="font-extrabold text-slate-900">{modal.item.fullName}</div>
                <div className="text-slate-500">{modal.item.description?.slice(0, 80)}...</div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Job Stage</label>
                <select
                  value={milestoneStage}
                  onChange={(e) => setMilestoneStage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] bg-white outline-none focus:border-violet-500"
                >
                  {MILESTONE_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.pexels.com/..."
                  value={milestoneUrl}
                  onChange={(e) => setMilestoneUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Caption (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Foundation concrete pour completed"
                  value={milestoneCaption}
                  onChange={(e) => setMilestoneCaption(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button
                onClick={async () => {
                  if (!milestoneUrl.trim() || !modal?.item) return;
                  setMilestoneUploading(true);
                  try {
                    const stageLabel = MILESTONE_STAGES.find((s) => s.key === milestoneStage)?.label || milestoneStage;
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
                    showToast(`📸 Photo uploaded for "${stageLabel}"!`);
                    setModal(null);
                    loadData("job_requests");
                  } catch (e) {
                    showToast("Failed to upload photo.");
                  } finally {
                    setMilestoneUploading(false);
                  }
                }}
                disabled={!milestoneUrl.trim() || milestoneUploading}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-extrabold shadow-sm disabled:opacity-40"
              >
                {milestoneUploading ? "Uploading..." : "📸 Upload Photo"}
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
    </div>
  );
}
