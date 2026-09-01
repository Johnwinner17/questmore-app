"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import type { Category, Service, SelectedServiceItem } from "@/lib/types";
import { PaymentModal } from "@/components/payment/payment-modal";

interface AllServiceItem {
  id: number;
  name: string;
  shortDescription: string | null;
  imageUrl: string | null;
  price?: number | null;
  categoryId: number;
  categoryName: string | null;
  categoryIcon: string | null;
}

export function RequestPage({
  service,
  category,
  categories,
  preselectedServices = [],
  onBack,
  onNavigateToActivity,
}: {
  service?: Service;
  category?: Category;
  categories: Category[];
  preselectedServices?: SelectedServiceItem[];
  onBack: () => void;
  onNavigateToActivity?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequestCode, setSubmittedRequestCode] = useState("");
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Manage multiple selected services list with pricing info
  const [selectedList, setSelectedList] = useState<SelectedServiceItem[]>(() => {
    if (preselectedServices && preselectedServices.length > 0) {
      return preselectedServices;
    }
    if (service) {
      return [{
        id: service.id,
        name: service.name,
        categoryId: category?.id,
        categoryName: category?.name,
        imageUrl: service.imageUrl,
        price: service.price ?? null,
        isNegotiable: !service.price,
      }];
    }
    return [];
  });

  // Service picker modal
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [allServices, setAllServices] = useState<AllServiceItem[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);

  const BOOKING_FEE = 5000; // Fixed booking fee strictly once per cart/request

  useEffect(() => {
    setLoadingServices(true);
    fetch("/api/services/all")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllServices(data);
        setLoadingServices(false);
      })
      .catch(() => setLoadingServices(false));
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    categoryId: category ? String(category.id) : (selectedList[0]?.categoryId ? String(selectedList[0].categoryId) : ""),
    description: "",
    location: "Abuja (FCT)",
    address: "",
    preferredDate: "",
    preferredTime: "morning",
    urgency: "standard",
  });

  // Auto-fill from logged-in user in localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("questmore_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.fullName) setForm(prev => ({ ...prev, fullName: u.fullName }));
        if (u.email) setForm(prev => ({ ...prev, email: u.email }));
        if (u.phone) setForm(prev => ({ ...prev, phone: u.phone }));
        if (u.location) setForm(prev => ({ ...prev, location: u.location }));
        if (u.address) setForm(prev => ({ ...prev, address: u.address }));
      }
    } catch (e) {}
  }, []);

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError("");
  };

  const removeService = (serviceId: number) => {
    setSelectedList(prev => prev.filter(s => s.id !== serviceId));
  };

  const togglePickerService = (item: AllServiceItem) => {
    if (selectedList.some(s => s.id === item.id)) {
      setSelectedList(prev => prev.filter(s => s.id !== item.id));
    } else {
      setSelectedList(prev => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          categoryName: item.categoryName || undefined,
          imageUrl: item.imageUrl,
          price: item.price ?? null,
          isNegotiable: !item.price,
        },
      ]);
    }
  };

  // Financial calculations
  let servicesTotal = 0;
  let hasNegotiableServices = false;

  selectedList.forEach(s => {
    if (s.price && typeof s.price === "number" && !s.isNegotiable) {
      servicesTotal += s.price;
    } else {
      hasNegotiableServices = true;
    }
  });

  const totalPaymentDue = servicesTotal + BOOKING_FEE;

  const canProceed = form.fullName && form.email && (form.description || selectedList.length > 0);

  const handleStartPayment = () => {
    if (!canProceed) {
      setError("Please ensure full name, email, and at least one service/description are provided.");
      return;
    }
    setError("");
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData: {
    reference: string;
    method: string;
    amount: number;
    bookingFee: number;
    servicesTotal: number;
  }) => {
    setShowPaymentModal(false);
    setIsSubmitting(true);
    setError("");

    const descriptionText = form.description || (
      selectedList.length > 0
        ? `Request for: ${selectedList.map(s => s.name).join(", ")}`
        : "General engineering & technical service request"
    );

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          serviceId: selectedList[0]?.id || null,
          categoryId: form.categoryId ? Number(form.categoryId) : (selectedList[0]?.categoryId || null),
          selectedServices: selectedList.map(s => ({
            id: s.id,
            name: s.name,
            categoryName: s.categoryName,
            price: s.price ?? null,
            isNegotiable: !s.price,
          })),
          description: descriptionText,
          location: form.location,
          address: form.address,
          preferredDate: form.preferredDate || null,
          preferredTime: form.preferredTime,
          urgency: form.urgency,
          paymentStatus: "successful", // Verified
          paymentRef: paymentData.reference,
          paymentMethod: paymentData.method,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setSubmittedRequestCode(data.requestCode || `QM-REQ-${data.requestId}`);
      setSubmittedTotal(paymentData.amount);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to finalize request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center bg-surface-50 relative overflow-hidden">
        <div className="absolute top-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="h-10 w-auto bg-white p-1 rounded-xl border border-slate-200 shadow-2xs mb-3 inline-flex items-center justify-center">
          <img
            src="/questmore_logo.jpg"
            alt="QuestMore Engineering Services Limited (RC: 6907014)"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 border-2 border-emerald-500 shadow-lg scale-in mb-3 text-[32px]">
          ✅
        </div>
        <span className="text-[12px] font-mono font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full mb-2 border border-amber-200">
          {submittedRequestCode}
        </span>
        <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Payment Verified & Received!</h2>
        <p className="mt-2 text-[13.5px] text-slate-600 font-medium leading-relaxed max-w-[340px]">
          ₦{submittedTotal.toLocaleString()} confirmed. Your request is now <strong>pending QuestMore Admin review and approval</strong>. You'll be notified once admin approves and assigns a certified provider.
        </p>

        {/* Admin approval info box */}
        <div className="mt-5 w-full max-w-xs rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 mb-2">What happens next?</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-[12px] text-amber-950">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900 mt-0.5">1</span>
              <span><strong>Admin reviews</strong> your job request and payment.</span>
            </div>
            {hasNegotiableServices && (
              <div className="flex items-start gap-2.5 text-[12px] text-amber-950">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900 mt-0.5">2</span>
                <span><strong>Admin quotes</strong> the actual job cost for your negotiable request. You'll receive a notification to pay the quoted amount.</span>
              </div>
            )}
            <div className="flex items-start gap-2.5 text-[12px] text-amber-950">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900 mt-0.5">{hasNegotiableServices ? "3" : "2"}</span>
              <span><strong>Admin assigns</strong> a verified specialist to carry out your job.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[12px] text-amber-950">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900 mt-0.5">{hasNegotiableServices ? "4" : "3"}</span>
              <span>Track all updates in real-time from your <strong>Activity tab</strong>.</span>
            </div>
          </div>
        </div>

        {selectedList.length > 0 && (
          <div className="mt-4 w-full max-w-xs rounded-3xl pro-glass-card p-4 text-left border border-slate-200">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Requested Services</p>
            <div className="space-y-1.5">
              {selectedList.map(s => (
                <div key={s.id} className="flex items-center justify-between text-[12.5px] font-bold text-slate-800">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 text-slate-500 font-normal">
                    {s.price ? `₦${s.price.toLocaleString()}` : "Negotiable"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => onNavigateToActivity ? onNavigateToActivity() : onBack()}
            className="w-full rounded-2xl btn-pro-amber py-3.5 text-[14px] font-black shadow-lg"
          >
            Track Job in Activity Tab →
          </button>
          <button
            onClick={onBack}
            className="w-full rounded-2xl bg-white border border-slate-200 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-surface-50 relative">
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
            <h1 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              {selectedList.length > 1 ? `Service Cart (${selectedList.length} Items)` : "Service Checkout & Booking"}
            </h1>
            <p className="text-[11.5px] font-medium text-slate-400">QuestMore Certified Engineering Services</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 pb-40 space-y-5">
        {/* ─── CART / SELECTED SERVICES SECTION ─── */}
        <div className="rounded-3xl pro-glass-card p-4.5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🛒</span>
              <h2 className="text-[14px] font-extrabold text-slate-900">
                Selected Services ({selectedList.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowServicePicker(true)}
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-amber-700 bg-amber-100/70 px-3 py-1 rounded-xl border border-amber-300 hover:bg-amber-200 transition-colors"
            >
              <span>+ Add Service</span>
            </button>
          </div>

          {selectedList.length > 0 ? (
            <div className="space-y-2.5">
              {selectedList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-amber-400 text-[12px] font-black">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {item.categoryName || "Engineering"} •{" "}
                        {item.price ? (
                          <span className="font-bold text-slate-800">₦{item.price.toLocaleString()}</span>
                        ) : (
                          <span className="font-extrabold text-amber-700">Price: Contact / Negotiable</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeService(item.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Remove service"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* ─── PRICE BREAKDOWN BOX ─── */}
              <div className="mt-4 pt-3.5 border-t border-slate-200/80 space-y-2 text-[12.5px]">
                <div className="flex justify-between text-slate-600">
                  <span>Services Subtotal:</span>
                  <span className="font-bold text-slate-900">
                    {servicesTotal > 0 ? `₦${servicesTotal.toLocaleString()}` : "₦0 (Negotiable)"}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-amber-50 border border-amber-200/80 p-2.5 rounded-2xl text-amber-950">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px]">🛡️</span>
                    <div>
                      <p className="font-extrabold text-[12px]">
                        {hasNegotiableServices ? "Inquiry / Request Fee" : "Fixed Booking Fee"}
                      </p>
                      <p className="text-[10px] text-amber-800 font-medium">
                        {hasNegotiableServices
                          ? "Secures your slot. Admin will quote the actual job cost after review."
                          : "Charged once per cart to confirm engineer dispatch."
                        }
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-[13.5px] text-amber-900">₦{BOOKING_FEE.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-300 text-[15px] font-extrabold text-slate-950">
                  <span>Total Due Now:</span>
                  <span className="text-emerald-700 font-black text-[17px]">
                    ₦{totalPaymentDue.toLocaleString()}
                  </span>
                </div>

                {hasNegotiableServices && (
                  <p className="text-[11px] font-medium text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    🤝 <span className="font-bold text-slate-800">Negotiable services included:</span> You pay only the ₦5,000 <strong>inquiry fee</strong> now to submit your request. QuestMore Admin will review and reply with the actual job cost. You will then pay the quoted amount before a provider is assigned to your job.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center">
              <p className="text-[13px] text-slate-800 font-bold">No services selected in cart</p>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">Please add at least one service to proceed.</p>
              <button
                type="button"
                onClick={() => setShowServicePicker(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white shadow-sm"
              >
                <span>+ Pick Services</span>
              </button>
            </div>
          )}
        </div>

        {/* ─── CONTACT & LOCATION FORM ─── */}
        <div className="rounded-3xl pro-glass-card p-5 space-y-4 shadow-sm border border-slate-200/80">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-b border-slate-200/60 pb-3">
            Contact & Job Location Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="e.g. Dr. Amina Yusuf"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+234 815 630 7091"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="amina.yusuf@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1">
                City / State
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Maitama, Abuja"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-700 mb-1">
                Street Address / Plot
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="e.g. No 7 Mississippi Street"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-1">
              Project Description / Specific Requirements
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe what work you need carried out, site condition, dimensions, or specific materials..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11.5px] font-bold text-slate-700 mb-1">Preferred Date</label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => update("preferredDate", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-700 mb-1">Preferred Time</label>
              <select
                value={form.preferredTime}
                onChange={(e) => update("preferredTime", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-amber-500"
              >
                <option value="morning">Morning (8am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 4pm)</option>
                <option value="evening">Evening (4pm - 7pm)</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-[12.5px] font-bold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* ─── PROCEED TO PAYMENT BUTTON ─── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartPayment}
            disabled={!canProceed || isSubmitting}
            className={clsx(
              "w-full rounded-2xl py-4 text-[15px] font-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2",
              canProceed
                ? "btn-pro-amber"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
          >
            <span>
              {hasNegotiableServices
                ? `Pay ₦${BOOKING_FEE.toLocaleString()} Inquiry Fee & Submit Request`
                : `Proceed to Payment (₦${totalPaymentDue.toLocaleString()})`
              }
            </span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
            {hasNegotiableServices
              ? "🤝 ₦5,000 inquiry fee holds your slot. Admin will review & quote the actual job cost."
              : "🛡️ Secure payment verified by QuestMore before specialist is assigned."
            }
          </p>
        </div>
      </div>

      {/* ─── PAYMENT CHECKOUT MODAL ─── */}
      {showPaymentModal && (
        <PaymentModal
          services={selectedList}
          bookingFee={BOOKING_FEE}
          clientName={form.fullName}
          clientEmail={form.email}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      {/* ─── MULTI-SERVICE PICKER MODAL ─── */}
      {showServicePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col slide-up overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">Add More Services</h3>
                <p className="text-[11px] text-slate-400">Select any engineering services to bundle in your cart</p>
              </div>
              <button
                type="button"
                onClick={() => setShowServicePicker(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-2.5 border-b border-slate-100">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search services catalogue..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-[13px] outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {loadingServices ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-14 rounded-xl skeleton" />
                  ))}
                </div>
              ) : (
                allServices
                  .filter(s =>
                    s.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                    (s.categoryName && s.categoryName.toLowerCase().includes(pickerSearch.toLowerCase()))
                  )
                  .map((item) => {
                    const isChecked = selectedList.some(s => s.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePickerService(item)}
                        className={clsx(
                          "w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all",
                          isChecked
                            ? "bg-amber-50 border-amber-400 ring-1 ring-amber-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.categoryName || "General"} •{" "}
                            {item.price ? `₦${item.price.toLocaleString()}` : "Price: Negotiable"}
                          </p>
                        </div>
                        <div
                          className={clsx(
                            "h-6 w-6 rounded-lg flex items-center justify-center border font-bold text-[12px]",
                            isChecked
                              ? "bg-amber-500 border-amber-500 text-slate-950 font-black"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isChecked && "✓"}
                        </div>
                      </button>
                    );
                  })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 safe-bottom bg-white">
              <button
                type="button"
                onClick={() => setShowServicePicker(false)}
                className="w-full rounded-2xl btn-pro-amber py-3 text-[14px] font-bold shadow-md"
              >
                Done ({selectedList.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
