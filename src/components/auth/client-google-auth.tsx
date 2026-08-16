"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "@/lib/types";
import { setAuthTokens } from "@/lib/api-client";

interface ClientGoogleAuthProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function ClientGoogleAuth({ onSuccess, onCancel }: ClientGoogleAuthProps) {
  const [step, setStep] = useState<"google_auth" | "extra_details">("google_auth");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Abuja (FCT)");
  const [address, setAddress] = useState("");

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Load official Google Identity Services (GIS) library
  useEffect(() => {
    const scriptId = "google-gis-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSignIn();
      document.body.appendChild(script);
    } else if (window.google) {
      initGoogleSignIn();
    }
  }, []);

  const initGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "108157598645-7a6rocupa3ak1hqu34dqlf7b1v5iihu6.apps.googleusercontent.com";

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnContainerRef.current) {
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
          logo_alignment: "left",
        });
      }
    }
  };

  // Process response from Google ID token credential
  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setErrorMsg("");

    try {
      // Decode JWT payload for client fallback details
      let decodedPayload: any = {};
      if (response.credential) {
        try {
          const base64Url = response.credential.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          decodedPayload = JSON.parse(window.atob(base64));
        } catch (e) {}
      }

      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          email: decodedPayload.email,
          fullName: decodedPayload.name,
          avatarUrl: decodedPayload.picture,
          googleId: decodedPayload.sub,
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        if (data.tokens?.access) {
          setAuthTokens(data.tokens.access, data.tokens.refresh);
        }
        setAuthenticatedUser(data.user);

        // If phone number is not yet provided, prompt for phone to complete dispatch setup
        if (!data.user.phone) {
          setStep("extra_details");
        } else {
          onSuccess(data.user);
        }
      } else {
        setErrorMsg(data.error || "Google authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      setErrorMsg("Network error connecting to authentication server. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Launch Google OAuth 2.0 Account Chooser Popup
  const handleLaunchGoogleOAuth = () => {
    setLoading(true);
    setErrorMsg("");

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.oauth2 && clientId) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        prompt: "select_account",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setLoading(false);
            setErrorMsg("Google sign in was cancelled or encountered an error.");
            return;
          }

          try {
            // Fetch Google User Profile
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoRes.json();

            // Authenticate with backend
            const res = await fetch("/api/auth/client", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: tokenResponse.access_token,
                email: userInfo.email,
                fullName: userInfo.name,
                avatarUrl: userInfo.picture,
                googleId: userInfo.sub,
              }),
            });

            const data = await res.json();
            if (data.success && data.user) {
              if (data.tokens?.access) {
                setAuthTokens(data.tokens.access, data.tokens.refresh);
              }
              setAuthenticatedUser(data.user);
              if (!data.user.phone) {
                setStep("extra_details");
              } else {
                onSuccess(data.user);
              }
            }
          } catch (e) {
            setErrorMsg("Failed to verify Google profile with server.");
          } finally {
            setLoading(false);
          }
        },
      });
      client.requestAccessToken();
    } else {
      // Direct standard Google Sign-In prompt
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Rendered button fallback
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    }
  };

  // Step 2: Save phone & address
  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg("WhatsApp phone number is required for dispatch & job updates.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authenticatedUser?.email,
          fullName: authenticatedUser?.fullName,
          avatarUrl: authenticatedUser?.avatarUrl,
          phone,
          location,
          address,
        }),
      });

      const data = await res.json();
      if (data.user) {
        onSuccess(data.user);
      } else {
        onSuccess({
          ...authenticatedUser!,
          phone,
          location,
          address,
        });
      }
    } catch (e) {
      onSuccess({
        ...authenticatedUser!,
        phone,
        location,
        address,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base shadow-sm">
              Q
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-white">Client Authentication</h2>
              <p className="text-[11px] text-slate-400">QuestMore Engineering</p>
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

        {step === "google_auth" ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h3 className="text-[19px] font-black text-slate-900 tracking-tight">
                Continue with Google
              </h3>
              <p className="text-[12.5px] font-medium text-slate-500 mt-1 max-w-[290px] mx-auto leading-relaxed">
                Sign in with your verified Google account to request engineering services and track active projects.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[12px] font-bold text-red-700 text-center">
                {errorMsg}
              </div>
            )}

            {/* Official Google Identity Button & Trigger */}
            <div className="space-y-3 flex flex-col items-center">
              <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[44px]" />

              <button
                type="button"
                disabled={loading}
                onClick={handleLaunchGoogleOAuth}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 p-3.5 text-[14px] font-black text-slate-800 transition-all shadow-xs active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[11px] font-medium text-slate-400">
                🔒 Secure OpenID Connect. We never store or access your password.
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Contact Information */
          <form onSubmit={handleSaveContactDetails} className="p-6 space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200">
              <img
                src={authenticatedUser?.avatarUrl || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"}
                alt=""
                className="h-11 w-11 rounded-full object-cover border border-amber-300"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold text-slate-900 truncate">{authenticatedUser?.fullName}</p>
                <p className="text-[11.5px] font-medium text-slate-600 truncate">{authenticatedUser?.email}</p>
              </div>
              <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">✓ Verified</span>
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                WhatsApp Phone Number (for updates & dispatch) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 815 630 7091"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Primary State / City
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
              <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Street Address / Landmark (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 14, 3rd Avenue, Gwarinpa"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full rounded-2xl py-3.5 text-[14px] font-black btn-pro-amber shadow-lg active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? "Completing Profile..." : "Complete Setup & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
