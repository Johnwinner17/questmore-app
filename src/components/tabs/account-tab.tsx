"use client";

import { useState } from "react";
import clsx from "clsx";
import type { NavigateFunction, User } from "@/lib/types";

interface AccountTabProps {
  onNavigate: NavigateFunction;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: User | null;
  onOpenClientAuth?: () => void;
  onOpenProviderPortal?: () => void;
  onSignOut?: () => void;
}

export function AccountTab({
  onNavigate,
  darkMode,
  onToggleDarkMode,
  currentUser,
  onOpenClientAuth,
  onOpenProviderPortal,
  onSignOut,
}: AccountTabProps) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Edit profile state
  const [editPhone, setEditPhone] = useState(currentUser?.phone || "");
  const [editLocation, setEditLocation] = useState(currentUser?.location || "Abuja (FCT)");
  const [editAddress, setEditAddress] = useState(currentUser?.address || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          email: currentUser?.email,
          fullName: currentUser?.fullName,
          avatarUrl: currentUser?.avatarUrl,
          phone: editPhone,
          location: editLocation,
          address: editAddress,
        }),
      });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem("questmore_user", JSON.stringify(data.user));
        setProfileSuccess(true);
        setTimeout(() => {
          setProfileSuccess(false);
          setShowEditProfileModal(false);
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      setShowEditProfileModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const menuSections = [
    {
      title: "Services & Coverage",
      items: [
        { icon: "📸", iconBg: "bg-blue-50 text-blue-600", label: "Project Gallery", desc: "Before & after engineering works", action: () => onNavigate({ type: "gallery" }) },
        { icon: "📍", iconBg: "bg-emerald-50 text-emerald-600", label: "Service Areas", desc: "Cities & operational coverage in Nigeria", action: () => onNavigate({ type: "areas" }) },
        { icon: "❓", iconBg: "bg-amber-50 text-amber-600", label: "FAQ & Pricing Guide", desc: "Pricing, booking fees & warranties", action: () => onNavigate({ type: "faq" }) },
      ],
    },
    {
      title: "App & Device",
      items: [
        {
          icon: "📲",
          iconBg: "bg-amber-50 text-amber-700",
          label: "Install QuestMore App",
          desc: "Add to iPhone, iPad, Android or PC Home Screen for 1-tap launch",
          action: () => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-pwa-install"));
            }
          },
          highlight: true,
        },
      ],
    },
    {
      title: "Worker & Partner Network",
      items: [
        {
          icon: "👷",
          iconBg: "bg-indigo-50 text-indigo-600",
          label: "Service Provider Portal",
          desc: "For certified plumbers, electricians, engineers & artisans",
          action: () => onOpenProviderPortal && onOpenProviderPortal(),
          highlight: true,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "🌙", iconBg: "bg-slate-100 text-slate-700", label: "Dark Mode", desc: darkMode ? "Enabled" : "Disabled", action: onToggleDarkMode, toggle: true },
      ],
    },
    {
      title: "Legal & Policies",
      items: [
        { icon: "📜", iconBg: "bg-slate-100 text-slate-700", label: "Terms of Service", desc: "Client agreements, dispatch & payment terms", action: () => setShowTermsModal(true) },
        { icon: "🔒", iconBg: "bg-blue-50 text-blue-700", label: "Privacy Policy", desc: "Data protection & confidentiality standards", action: () => setShowPrivacyModal(true) },
        { icon: "🛡️", iconBg: "bg-amber-50 text-amber-700", label: "Quality Guarantee & Warranty", desc: "12-month workmanship and defect warranty", action: () => setShowGuaranteeModal(true) },
        { icon: "🏛️", iconBg: "bg-indigo-50 text-indigo-700", label: "About QuestMore Engineering", desc: "Engineering standards & corporate mission", action: () => setShowAboutModal(true) },
      ],
    },
    {
      title: "Support Desk",
      items: [
        { icon: "💬", iconBg: "bg-emerald-50 text-emerald-600", label: "WhatsApp Support Desk", desc: "Direct 24/7 client dispatch hotline", action: () => window.open("https://wa.me/2348156307091", "_blank") },
        { icon: "📞", iconBg: "bg-amber-50 text-amber-600", label: "Emergency Engineering Call", desc: "+234 815 630 7091", action: () => window.open("tel:+2348156307091", "_self") },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-surface-50 overflow-hidden">
      <div className="safe-top bg-surface-50" />

      {/* ─── FIXED HEADER (Never scrolls) ─── */}
      <header className="flex-shrink-0 bg-surface-50/95 backdrop-blur-md border-b border-slate-200/60 z-20">
        <div className="px-5 pt-4 pb-2.5">
          <h1 className="text-[22px] font-black tracking-tight text-slate-900 leading-none">Account & Settings</h1>
          <p className="text-[11.5px] font-medium text-slate-400 mt-1">Manage client profile, preferences & legal policies</p>
        </div>
      </header>

      {/* ─── SCROLLABLE BODY (Scrolls underneath fixed header) ─── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-44 space-y-5 pt-4">
        {/* Profile Card */}
        <div
          className="rounded-[28px] p-5 relative overflow-hidden shadow-xl text-white border border-slate-800"
          style={{ background: "linear-gradient(145deg, #07111F 0%, #0F1D30 60%, #0A1524 100%)" }}
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[26px] bg-white/10 border border-white/10 shadow-sm overflow-hidden shrink-0">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-black text-white tracking-tight truncate">
                  {currentUser?.fullName || "Client User"}
                </p>
                <span className="text-[9px] font-black bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-300 truncate mt-0.5">
                {currentUser?.email || "Google Verified"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {currentUser?.phone ? (
                  <span className="text-[11px] text-slate-300 font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md">
                    {currentUser.phone}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md">
                    + Add Phone
                  </span>
                )}
                {currentUser?.location && (
                  <span className="text-[11px] text-amber-300 font-bold bg-amber-400/15 px-2 py-0.5 rounded-md border border-amber-400/30">
                    📍 {currentUser.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              className="flex-1 rounded-2xl py-2.5 text-[12px] font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-sm"
            >
              ✏️ Edit Profile
            </button>
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="flex-1 rounded-2xl py-2.5 text-[12px] font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400 px-1">{section.title}</p>
            <div className="rounded-3xl pro-glass-card overflow-hidden divide-y divide-slate-100 border border-slate-200/80 shadow-xs">
              {section.items.map((item: any) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={clsx(
                    "flex w-full items-center gap-3.5 px-4.5 py-3.5 text-left transition-colors active:bg-slate-100",
                    item.highlight ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50/80"
                  )}
                >
                  <div className={clsx("flex h-9 w-9 items-center justify-center rounded-xl text-[18px] shrink-0", item.iconBg || "bg-slate-100")}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-[13.5px] font-extrabold", item.highlight ? "text-amber-950" : "text-slate-900")}>
                      {item.label}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  {"toggle" in item && item.toggle ? (
                    <div className={clsx("relative h-7 w-12 rounded-full transition-colors shrink-0", darkMode ? "bg-amber-500" : "bg-slate-200")}>
                      <div className={clsx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform", darkMode ? "translate-x-5" : "translate-x-0.5")} />
                    </div>
                  ) : (
                    <svg className="shrink-0 text-slate-400" width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App Info Footer with Corporate Registration */}
        <div className="pt-4 text-center pb-6 space-y-1.5">
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="h-10 w-auto bg-white p-1 rounded-xl border border-slate-200 shadow-2xs inline-flex items-center justify-center">
              <img
                src="/questmore_logo.jpg"
                alt="QuestMore Engineering Services Limited (RC: 6907014)"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[13.5px] font-black text-slate-900">QuestMore Engineering Services Ltd</span>
              <span className="text-[9.5px] font-mono font-extrabold bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                RC: 6907014
              </span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500">Licensed Engineering, Construction & Technical Services · Nigeria</p>
          <p className="text-[10px] font-bold text-slate-400">v3.0.0 Production Release</p>
        </div>
      </div>

      {/* ─── MODAL: EDIT PROFILE ─── */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  ✏️
                </div>
                <div>
                  <h3 className="text-[15px] font-black">Edit Client Profile</h3>
                  <p className="text-[11px] text-slate-400">Update phone number & location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 flex-1 overflow-y-auto">
              {profileSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] font-bold text-center">
                  ✓ Profile updated successfully!
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.fullName || "Client User"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[13px] text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ""}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[13px] text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. +234 815 630 7091"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Primary State / City</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500 bg-white"
                >
                  <option value="Abuja (FCT)">Abuja (FCT)</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Rivers (Port Harcourt)">Rivers (Port Harcourt)</option>
                  <option value="Oyo (Ibadan)">Oyo (Ibadan)</option>
                  <option value="Kano">Kano</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Delta">Delta</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Plot 14, 3rd Avenue, Gwarinpa"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full rounded-2xl py-3.5 text-[14px] font-black btn-pro-amber shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {savingProfile ? "Saving Profile..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: TERMS OF SERVICE ─── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px]">📜</span>
                <div>
                  <h3 className="text-[15px] font-black">Terms of Service</h3>
                  <p className="text-[11px] text-slate-400">QuestMore Engineering Corp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain text-[12.5px] text-slate-700 leading-relaxed">
              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">1. Certified Service Platform</h4>
                <p>QuestMore provides certified technical and engineering service dispatch across civil construction, electrical, solar, plumbing, and interior works in Nigeria.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">2. Fixed Booking & Dispatch Fee</h4>
                <p>A standard ₦5,000 booking fee is applied once per cart/request. For fixed-price services, this activates immediate dispatch. For negotiable services, this serves as an inquiry deposit; our admin team reviews your scope and quotes the project cost before provider assignment.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">3. QA Warranties & Inspection</h4>
                <p>All work executed through QuestMore is backed by our certified quality assurance warranty. Clients inspect the job and sign off upon satisfactory completion.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">4. Safety & Compliance</h4>
                <p>Our specialists operate in accordance with Nigerian civil engineering safety standards and building code compliance.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full rounded-2xl btn-pro-amber py-3 text-[13.5px] font-black"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRIVACY POLICY ─── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px]">🔒</span>
                <div>
                  <h3 className="text-[15px] font-black">Privacy Policy</h3>
                  <p className="text-[11px] text-slate-400">Data Protection Standards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain text-[12.5px] text-slate-700 leading-relaxed">
              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">1. Information We Collect</h4>
                <p>We collect verified Google account details (name, email, profile photo) and contact information (phone number, state, and site address) solely for service dispatch, job notifications, and invoice generation.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">2. Zero Password Storage</h4>
                <p>All authentication is processed using official Google OAuth 2.0 OpenID Connect. QuestMore never requests, stores, or sees your Google account password.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">3. Provider Information Sharing</h4>
                <p>Your address and phone number are only shared with the specific verified specialist assigned to your approved service request.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-full rounded-2xl btn-pro-amber py-3 text-[13.5px] font-black"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: QUALITY GUARANTEE ─── */}
      {showGuaranteeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px]">🛡️</span>
                <div>
                  <h3 className="text-[15px] font-black">Quality Guarantee & Warranty</h3>
                  <p className="text-[11px] text-slate-400">QuestMore 100% Quality Commitment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuaranteeModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain text-[12.5px] text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="font-extrabold text-amber-950 text-[13px]">Every job booked on QuestMore is protected by our Certified Workmanship Guarantee.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">1. Certified Specialists Only</h4>
                <p>Every technician and engineer is trade-tested, background-checked, and verified before being allowed onto the QuestMore network.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">2. 12-Month Quality Warranty</h4>
                <p>If any defect occurs in workmanship or installation within the warranty period, QuestMore re-deploys certified technicians to resolve it at zero extra charge.</p>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">3. Escrow Payment Protection</h4>
                <p>Funds are secured until the client inspects and digitally confirms complete job satisfaction on the QuestMore Activity Tracker.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowGuaranteeModal(false)}
                className="w-full rounded-2xl btn-pro-amber py-3 text-[13.5px] font-black"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ABOUT US ─── */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm">
                  Q
                </div>
                <div>
                  <h3 className="text-[15px] font-black">About QuestMore Engineering</h3>
                  <p className="text-[11px] text-slate-400">Nigeria's Certified Multi-Service Platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain text-[12.5px] text-slate-700 leading-relaxed">
              <p>QuestMore Engineering is a technology-enabled engineering and technical services platform founded to eliminate substandard workmanship, unreliable dispatch, and pricing opacity in the Nigerian construction and maintenance sector.</p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[18px] font-black text-slate-900">5,000+</p>
                  <p className="text-[11px] text-slate-500 font-medium">Completed Projects</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[18px] font-black text-amber-600">4.9 ★</p>
                  <p className="text-[11px] text-slate-500 font-medium">Client Rating</p>
                </div>
              </div>

              <div>
                <h4 className="text-[14px] font-black text-slate-950 mb-1">Corporate Headquarters</h4>
                <p>Abuja (FCT), Nigeria · Operations across Lagos, Port Harcourt, Ibadan, and nationwide.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-full rounded-2xl btn-pro-amber py-3 text-[13.5px] font-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SIGN OUT CONFIRMATION ─── */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up border border-slate-100 p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[28px] mx-auto mb-3">
              🚪
            </div>
            <h3 className="text-[17px] font-black text-slate-900">Sign Out of QuestMore?</h3>
            <p className="text-[12.5px] text-slate-500 font-medium mt-1.5 leading-relaxed">
              Are you sure you want to sign out? You can sign back in anytime with your Google account.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  if (onSignOut) onSignOut();
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
