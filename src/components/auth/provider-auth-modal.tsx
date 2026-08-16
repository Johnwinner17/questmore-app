"use client";

import { useState, useEffect } from "react";
import type { User, ProviderProfession } from "@/lib/types";
import { mockProfessions } from "@/lib/mock-data";

interface ProviderAuthModalProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export function ProviderAuthModal({ onSuccess, onCancel }: ProviderAuthModalProps) {
  const [tab, setTab] = useState<"register" | "login">("register");
  const [professions, setProfessions] = useState<ProviderProfession[]>(mockProfessions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Registration form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    location: "Abuja (FCT)",
    address: "",
    avatarUrl: "",
    professionId: "1",
    professionName: "Plumber",
    experienceYears: "5",
    qualifications: "",
    idDocumentUrl: "",
    bio: "",
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    fetch("/api/professions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProfessions(data);
          setFormData(prev => ({
            ...prev,
            professionId: String(data[0].id),
            professionName: data[0].name,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleProfessionChange = (profId: string) => {
    const selected = professions.find(p => String(p.id) === profId);
    setFormData(prev => ({
      ...prev,
      professionId: profId,
      professionName: selected ? selected.name : "Engineering Service",
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register application");

      setSuccessMessage(data.message || "Application submitted successfully!");
      setTimeout(() => {
        onSuccess(data.user);
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg h-[92dvh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white text-[22px] shadow-md shadow-blue-600/30">
              👷
            </div>
            <div>
              <h2 className="text-[16px] font-extrabold tracking-tight text-white">Service Provider Portal</h2>
              <p className="text-[11px] text-slate-400">QuestMore Engineering Partner Network</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-2.5 text-[13px] font-extrabold rounded-2xl transition-all ${
              tab === "register"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            📝 Register / Apply
          </button>
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2.5 text-[13px] font-extrabold rounded-2xl transition-all ${
              tab === "login"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🔑 Provider Sign In
          </button>
        </div>

        {/* Form Body with Smooth Scrolling & Bottom Margin */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar pb-16 sm:pb-8 overscroll-contain">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-[12.5px] font-bold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-3xl bg-amber-50 border border-amber-300 p-5 text-center">
              <span className="text-[32px]">⏳</span>
              <h4 className="mt-1 text-[16px] font-black text-amber-950">Application Received</h4>
              <p className="mt-1.5 text-[12.5px] font-medium text-amber-900 leading-relaxed max-w-sm mx-auto">
                Your application has been received and forwarded for administrator review. Loading your dashboard...
              </p>
            </div>
          )}

          {tab === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4 pb-8">
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3">
                <span className="text-[20px]">ℹ️</span>
                <p className="text-[12px] text-blue-950 font-medium leading-relaxed">
                  Join our certified specialist network. All applications are reviewed and verified by QuestMore administrators before job assignments begin.
                </p>
              </div>

              {/* 1. Personal Details */}
              <div className="space-y-3 pt-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  1. Personal & Contact Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. John Obi"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +234 802 123 4567"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.obi@gmail.com"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Create Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Trade & Experience */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  2. Profession & Trade Specialty
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Profession *</label>
                    <select
                      value={formData.professionId}
                      onChange={(e) => handleProfessionChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white font-medium"
                    >
                      {professions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon || "🔧"} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Experience *</label>
                    <select
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="1">1 - 2 Years</option>
                      <option value="3">3 - 5 Years</option>
                      <option value="6">6 - 9 Years</option>
                      <option value="10">10+ Years (Senior Expert)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Location & Base */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  3. Operational Location
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">City / State *</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="Abuja (FCT)">Abuja (FCT)</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Rivers (Port Harcourt)">Rivers (Port Harcourt)</option>
                      <option value="Oyo (Ibadan)">Oyo (Ibadan)</option>
                      <option value="Kano">Kano</option>
                      <option value="Enugu">Enugu</option>
                      <option value="Delta">Delta</option>
                      <option value="Kaduna">Kaduna</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">Workshop Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Plot 12, Gwarinpa"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Credentials & Bio */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    Trade Test / Certifications (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="e.g. Trade Test 1, COREN Reg, Solar Certified"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    Short Bio & Specialties
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Specialist in commercial piping, pump installation, fault troubleshooting..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] text-slate-900 outline-none focus:border-blue-500 resize-none bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-[14px] font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <span>Submit Provider Application</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Sign In Tab (Clean without hardcoded demo credentials) */
            <form onSubmit={handleLogin} className="space-y-4 py-3 pb-8">
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 mb-1">Provider Email *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-[14px] font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Provider Dashboard</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
