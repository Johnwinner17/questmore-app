"use client";

import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { HomeTab } from "@/components/tabs/home-tab";
import { ExploreTab } from "@/components/tabs/explore-tab";
import { ActivityTab } from "@/components/tabs/activity-tab";
import { AccountTab } from "@/components/tabs/account-tab";
import { CategoryPage } from "@/components/pages/category-page";
import { SubcategoryPage } from "@/components/pages/subcategory-page";
import { ServiceDetailPage } from "@/components/pages/service-detail-page";
import { RequestPage } from "@/components/pages/request-page";
import { GalleryPage } from "@/components/pages/gallery-page";
import { FAQPage } from "@/components/pages/faq-page";
import { NotificationsPage } from "@/components/pages/notifications-page";
import { AreasPage } from "@/components/pages/areas-page";
import { WelcomeScreen } from "@/components/welcome-screen";
import { ClientGoogleAuth } from "@/components/auth/client-google-auth";
import { ProviderAuthModal } from "@/components/auth/provider-auth-modal";
import { ProviderDashboard } from "@/components/provider/provider-dashboard";
import { WhatsAppButton } from "@/components/whatsapp-button";
import type { Category, Subcategory, Service, PageRoute, SelectedServiceItem, User } from "@/lib/types";

type Tab = "home" | "explore" | "activity" | "account";

/* ─── Premium Floating Tab Icons ─── */
function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const color = active ? "#F59E0B" : "#64748B";
  switch (tab) {
    case "home":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#F59E0B" : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/>
        </svg>
      );
    case "explore":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
        </svg>
      );
    case "activity":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21h16M7 21V4l11 4M12 5.8v15.2M18 8v6M18 14l-3-3"/>
        </svg>
      );
    case "account":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        </svg>
      );
  }
}

const tabLabels: Record<Tab, string> = { home: "Home", explore: "Services", activity: "Activities", account: "Account" };

export function AppShell({ initialData }: {
  initialData: {
    categories: Category[];
    banners: { id: number; title: string; subtitle: string | null; imageUrl: string | null }[];
    featured: Service[];
    reviews: { id: number; clientName: string; rating: number; comment: string | null; location: string | null }[];
  };
}) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pageStack, setPageStack] = useState<PageRoute[]>([{ type: "tab" }]);
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showClientAuth, setShowClientAuth] = useState(false);
  const [showProviderAuth, setShowProviderAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"client" | "provider">("client");
  const [darkMode, setDarkMode] = useState(false);
  const [basket, setBasket] = useState<SelectedServiceItem[]>([]);

  const toggleBasket = useCallback((item: SelectedServiceItem) => {
    setBasket((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      return exists ? prev.filter((b) => b.id !== item.id) : [...prev, item];
    });
  }, []);
  const clearBasket = useCallback(() => setBasket([]), []);

  const [dynamicCategories, setDynamicCategories] = useState<Category[]>(initialData.categories);

  const reloadCategories = useCallback(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setDynamicCategories(d);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedUserStr = localStorage.getItem("questmore_user");
      if (savedUserStr) {
        const u: User = JSON.parse(savedUserStr);
        if (u && u.email) {
          setCurrentUser(u);
          if (u.role === "provider") {
            setUserRole("provider");
          } else {
            setUserRole("client");
          }
          setShowWelcome(false);
        } else {
          setShowWelcome(true);
        }
      } else {
        setShowWelcome(true);
      }
    } catch (e) {
      setShowWelcome(true);
    } finally {
      reloadCategories();
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [reloadCategories]);

  // Periodic category sync (every 30s)
  useEffect(() => {
    const interval = setInterval(reloadCategories, 30_000);
    return () => clearInterval(interval);
  }, [reloadCategories]);

  const handleRoleSelection = (role: "client" | "provider") => {
    if (role === "client") {
      setShowClientAuth(true);
    } else if (role === "provider") {
      setShowProviderAuth(true);
    }
  };

  const handleClientAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setUserRole("client");
    setShowClientAuth(false);
    setShowWelcome(false);
    localStorage.setItem("questmore_user", JSON.stringify(user));
  };

  const handleProviderAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setUserRole("provider");
    setShowProviderAuth(false);
    setShowWelcome(false);
    localStorage.setItem("questmore_user", JSON.stringify(user));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("questmore_user");
    localStorage.removeItem("questmore_role_chosen");
    setUserRole("client");
    setShowWelcome(true);
    setActiveTab("home");
    setPageStack([{ type: "tab" }]);
  };

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
  const navigate = useCallback((route: PageRoute) => setPageStack(prev => [...prev, route]), []);
  const goBack = useCallback(() => setPageStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev)), []);

  const currentPage = pageStack[pageStack.length - 1];
  const isOnTab = currentPage.type === "tab";
  const switchTab = useCallback((tab: Tab) => { setActiveTab(tab); setPageStack([{ type: "tab" }]); }, []);
  const switchToExplore = useCallback(() => switchTab("explore"), [switchTab]);
  const switchToActivity = useCallback(() => switchTab("activity"), [switchTab]);

  // Mandatory Authentication Gate: User MUST be logged in
  const isUserAuthenticated = Boolean(currentUser && currentUser.email);

  return (
    <>
      {/* ─── SPLASH SCREEN ─── */}
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(160deg, #0F2040 0%, #111827 50%, #0A1628 100%)",
          transition: "opacity 0.4s ease, visibility 0.4s ease",
          opacity: showSplash ? 1 : 0,
          visibility: showSplash ? "visible" : "hidden",
          pointerEvents: showSplash ? "auto" : "none",
        }}
      >
        <div className="splash-logo flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border border-white/10" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))" }} />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl" style={{ background: "linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
              <span className="text-2xl font-black text-surface-900 tracking-tight">Q</span>
            </div>
          </div>
          <h1 className="mt-6 text-[22px] font-black text-white tracking-[-0.02em]">QuestMore</h1>
          <p className="mt-1.5 text-[12px] font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(136,147,167,0.7)" }}>Certified Engineering Services</p>
        </div>
        <div className="absolute bottom-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
        </div>
      </div>

      {/* ─── MANDATORY WELCOME / AUTH GATE ─── */}
      {(!isUserAuthenticated || showWelcome) && (
        <WelcomeScreen
          onSelectRole={handleRoleSelection}
        />
      )}

      {/* ─── CLIENT GOOGLE AUTH MODAL ─── */}
      {showClientAuth && (
        <ClientGoogleAuth
          onSuccess={handleClientAuthSuccess}
          onCancel={() => setShowClientAuth(false)}
        />
      )}

      {/* ─── SERVICE PROVIDER REGISTRATION & LOGIN MODAL ─── */}
      {showProviderAuth && (
        <ProviderAuthModal
          onSuccess={handleProviderAuthSuccess}
          onCancel={() => setShowProviderAuth(false)}
        />
      )}

      {/* ─── SERVICE PROVIDER DASHBOARD VIEW ─── */}
      {isUserAuthenticated && userRole === "provider" ? (
        <ProviderDashboard
          user={currentUser!}
          onSignOut={handleSignOut}
          onSwitchToClient={() => setUserRole("client")}
        />
      ) : isUserAuthenticated ? (
        /* ─── AUTHENTICATED CLIENT APP WORKSPACE ─── */
        <div
          className={clsx("h-[100dvh] w-full relative overflow-hidden", darkMode ? "dark bg-surface-900" : "bg-surface-50")}
          style={{
            visibility: showSplash ? "hidden" : "visible",
          }}
        >
          {/* ─── FULL-BLEED CONTENT (Extends 100% to screen edges) ─── */}
          <div className="h-full w-full overflow-hidden relative">
            <div className={clsx("absolute inset-0 transition-transform duration-300", isOnTab ? "translate-x-0" : "-translate-x-full")} style={{ willChange: "transform" }}>
              <div className={clsx("h-full", activeTab !== "home" && "hidden")}>
                <HomeTab data={{ ...initialData, categories: dynamicCategories }} onNavigate={navigate} onSwitchToExplore={switchToExplore} />
              </div>
              <div className={clsx("h-full", activeTab !== "explore" && "hidden")}>
                <ExploreTab categories={dynamicCategories} onNavigate={navigate} basket={basket} onToggleBasket={toggleBasket} onClearBasket={clearBasket} />
              </div>
              <div className={clsx("h-full", activeTab !== "activity" && "hidden")}>
                <ActivityTab currentUser={currentUser} />
              </div>
              <div className={clsx("h-full", activeTab !== "account" && "hidden")}>
                <AccountTab
                  onNavigate={navigate}
                  darkMode={darkMode}
                  onToggleDarkMode={toggleDarkMode}
                  currentUser={currentUser}
                  onOpenClientAuth={() => setShowClientAuth(true)}
                  onOpenProviderPortal={() => setShowProviderAuth(true)}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>

            {!isOnTab && (
              <div className="absolute inset-0 bg-surface-50 z-10 fade-in">
                {currentPage.type === "category" && <CategoryPage category={currentPage.category} onBack={goBack} onNavigate={navigate} />}
                {currentPage.type === "subcategory" && <SubcategoryPage subcategory={currentPage.subcategory} category={currentPage.category} onBack={goBack} onNavigate={navigate} />}
                {currentPage.type === "service" && <ServiceDetailPage service={currentPage.service} category={currentPage.category} onBack={goBack} onNavigate={navigate} basket={basket} onToggleBasket={toggleBasket} />}
                {currentPage.type === "request" && (
                  <RequestPage
                    service={currentPage.service}
                    category={currentPage.category}
                    categories={dynamicCategories}
                    preselectedServices={currentPage.preselectedServices || (basket.length > 0 ? basket : undefined)}
                    onBack={goBack}
                    onNavigateToActivity={switchToActivity}
                  />
                )}
                {currentPage.type === "gallery" && <GalleryPage onBack={goBack} />}
                {currentPage.type === "faq" && <FAQPage onBack={goBack} />}
                {currentPage.type === "notifications" && <NotificationsPage onBack={goBack} />}
                {currentPage.type === "areas" && <AreasPage onBack={goBack} />}
              </div>
            )}
          </div>

          {isOnTab && <WhatsAppButton />}

          {/* ─── DOCKED PREMIUM NAVIGATION BAR (Extends 100% to screen bottom edge with zero gap) ─── */}
          {isOnTab && (
            <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
              <div className="max-w-md mx-auto px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] flex items-center justify-around">
                {(["home", "explore", "activity", "account"] as Tab[]).map((tab) => {
                  const isActive = activeTab === tab && isOnTab;
                  return (
                    <button
                      key={tab}
                      onClick={() => switchTab(tab)}
                      className={clsx(
                        "flex flex-col items-center justify-center transition-all duration-200 relative py-1.5 px-4 rounded-2xl",
                        isActive
                          ? "bg-[#0B132B] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 active:scale-95"
                      )}
                    >
                      <TabIcon tab={tab} active={isActive} />
                      <span className={clsx(
                        "text-[10.5px] tracking-tight mt-0.5 transition-colors",
                        isActive ? "font-bold text-white" : "font-medium text-slate-500"
                      )}>
                        {tabLabels[tab]}
                      </span>
                      {isActive && (
                        <div className="w-3.5 h-[2px] bg-amber-400 rounded-full mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      ) : null}
    </>
  );
}
