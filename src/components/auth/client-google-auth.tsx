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

type AuthMode = "login" | "signup_prompt" | "signup_profile" | "forgot_password" | "forgot_new_password";

export function ClientGoogleAuth({ onSuccess, onCancel }: ClientGoogleAuthProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign-up / Profile completion state
  const [googleProfile, setGoogleProfile] = useState<{
    email: string;
    fullName: string;
    avatarUrl: string;
    googleId: string;
  } | null>(null);

  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupLocation, setSignupLocation] = useState("Abuja (FCT)");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot password state
  const [forgotGoogleProfile, setForgotGoogleProfile] = useState<{
    email: string;
    googleId: string;
  } | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const forgotGoogleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services
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
  }, [mode]);

  const initGoogleSignIn = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "108157598645-7a6rocupa3ak1hqu34dqlf7b1v5iihu6.apps.googleusercontent.com";

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (mode === "signup_prompt" && googleBtnContainerRef.current) {
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
          logo_alignment: "left",
        });
      }

      if (mode === "forgot_password" && forgotGoogleBtnRef.current) {
        window.google.accounts.id.renderButton(forgotGoogleBtnRef.current, {
          theme: "outline",
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
    setSuccessMsg("");

    try {
      let decodedPayload: any = {};
      if (response.credential) {
        try {
          const base64Url = response.credential.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          decodedPayload = JSON.parse(window.atob(base64));
        } catch (e) {}
      }

      // If in Forgot Password mode:
      if (mode === "forgot_password") {
        setForgotGoogleProfile({
          email: decodedPayload.email,
          googleId: decodedPayload.sub,
        });
        setMode("forgot_new_password");
        setSuccessMsg(`Google identity verified for ${decodedPayload.email}. Please set your new password.`);
        setLoading(false);
        return;
      }

      // Sign-up or verify
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "google_verify",
          credential: response.credential,
          email: decodedPayload.email,
          fullName: decodedPayload.name,
          avatarUrl: decodedPayload.picture,
          googleId: decodedPayload.sub,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (!data.isNew && data.user) {
          // Existing registered user with password -> log in directly!
          if (data.tokens?.access) {
            setAuthTokens(data.tokens.access, data.tokens.refresh);
          }
          onSuccess(data.user);
        } else {
          // Brand new user -> show mandatory profile completion & password creation
          const profile = data.googleProfile || {
            email: decodedPayload.email,
            fullName: decodedPayload.name,
            avatarUrl: decodedPayload.picture,
            googleId: decodedPayload.sub,
          };
          setGoogleProfile(profile);
          setSignupName(profile.fullName || "");
          setMode("signup_profile");
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

  // Launch Google OAuth Popup
  const handleLaunchGooglePopup = () => {
    setLoading(true);
    setErrorMsg("");
    setErrorMsg("");

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "108157598645-7a6rocupa3ak1hqu34dqlf7b1v5iihu6.apps.googleusercontent.com";

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
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoRes.json();

            if (mode === "forgot_password") {
              setForgotGoogleProfile({
                email: userInfo.email,
                googleId: userInfo.sub,
              });
              setMode("forgot_new_password");
              setSuccessMsg(`Google identity verified for ${userInfo.email}. Set your new password.`);
              setLoading(false);
              return;
            }

            const res = await fetch("/api/auth/client", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "google_verify",
                accessToken: tokenResponse.access_token,
                email: userInfo.email,
                fullName: userInfo.name,
                avatarUrl: userInfo.picture,
                googleId: userInfo.sub,
              }),
            });

            const data = await res.json();
            if (data.success) {
              if (!data.isNew && data.user) {
                if (data.tokens?.access) {
                  setAuthTokens(data.tokens.access, data.tokens.refresh);
                }
                onSuccess(data.user);
              } else {
                const profile = data.googleProfile || {
                  email: userInfo.email,
                  fullName: userInfo.name,
                  avatarUrl: userInfo.picture,
                  googleId: userInfo.sub,
                };
                setGoogleProfile(profile);
                setSignupName(profile.fullName || "");
                setMode("signup_profile");
              }
            } else {
              setErrorMsg(data.error || "Google verification failed.");
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
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    }
  };

  // 1. Normal Email + Password Login
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password_login",
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        if (data.tokens?.access) {
          setAuthTokens(data.tokens.access, data.tokens.refresh);
        }
        onSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Login failed. Please check your credentials.");
      }
    } catch (e) {
      setErrorMsg("Network error connecting to login server.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Complete Sign-Up Profile Form
  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!signupPhone.trim()) {
      setErrorMsg("WhatsApp phone number is required for dispatch & job updates.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "google_signup",
          googleEmail: googleProfile?.email,
          googleId: googleProfile?.googleId,
          fullName: signupName.trim(),
          phone: signupPhone.trim(),
          location: signupLocation.trim(),
          address: signupAddress.trim(),
          password: signupPassword,
          avatarUrl: googleProfile?.avatarUrl,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        if (data.tokens?.access) {
          setAuthTokens(data.tokens.access, data.tokens.refresh);
        }
        onSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Failed to create account. Please try again.");
      }
    } catch (e) {
      setErrorMsg("Network error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password after Google verification
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgot_password_google",
          googleEmail: forgotGoogleProfile?.email,
          googleId: forgotGoogleProfile?.googleId,
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Password successfully updated! You can now log in.");
        setLoginEmail(forgotGoogleProfile?.email || "");
        setLoginPassword("");
        setMode("login");
      } else {
        setErrorMsg(data.error || "Failed to reset password.");
      }
    } catch (e) {
      setErrorMsg("Network error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-scale-up border border-slate-100 max-h-[92dvh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-950 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-400 font-black text-slate-950 flex items-center justify-center text-lg shadow-md">
              Q
            </div>
            <div>
              <h3 className="text-[17px] font-black tracking-tight leading-none text-white">QuestMore</h3>
              <p className="text-[11px] text-amber-400 font-bold mt-1">Client Portal Access</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Global Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[12.5px] font-bold flex items-start gap-2">
              <span className="text-[15px] shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] font-bold flex items-start gap-2">
              <span className="text-[15px] shrink-0">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VIEW 1: LOGIN (EMAIL + PASSWORD)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <div className="space-y-4">
              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-[12.5px] font-extrabold">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-white text-slate-950 shadow-xs transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setErrorMsg(""); setSuccessMsg(""); setMode("signup_prompt"); }}
                  className="flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
                >
                  New Sign Up
                </button>
              </div>

              <div className="text-center">
                <h4 className="text-[19px] font-black text-slate-900 tracking-tight">Welcome Back</h4>
                <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                  Enter your email and password to access your bookings
                </p>
              </div>

              <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your-google-email@gmail.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[13.5px] font-medium text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-extrabold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setErrorMsg(""); setSuccessMsg(""); setMode("forgot_password"); }}
                      className="text-[11.5px] font-bold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[13.5px] font-medium text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      {showLoginPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[14px] shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Signing In..." : "Sign In with Password"}
                </button>
              </form>

              {/* Or Google fallback for existing accounts */}
              <div className="pt-2">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold uppercase tracking-wider">or sign in with</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchGooglePopup}
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-extrabold text-[13px] flex items-center justify-center gap-2.5 shadow-2xs active:scale-[0.98] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VIEW 2: SIGN UP PROMPT (CONTINUE WITH GOOGLE)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === "signup_prompt" && (
            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-2xl text-[12.5px] font-extrabold">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(""); setSuccessMsg(""); setMode("login"); }}
                  className="flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-white text-slate-950 shadow-xs transition-all"
                >
                  New Sign Up
                </button>
              </div>

              <div className="text-center py-2">
                <div className="h-14 w-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl mx-auto mb-3">
                  🔐
                </div>
                <h4 className="text-[19px] font-black text-slate-900 tracking-tight">Create QuestMore Account</h4>
                <p className="text-[12.5px] text-slate-500 font-medium mt-1 leading-relaxed">
                  Google OAuth is used for verified initial registration. You can then log in with your email and password anytime.
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center gap-3">
                {/* GIS Rendered Button */}
                <div ref={googleBtnContainerRef} className="w-full flex justify-center" />

                {/* Custom Button Fallback */}
                <button
                  type="button"
                  onClick={handleLaunchGooglePopup}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] flex items-center justify-center gap-3 shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center font-medium mt-1">
                  1-Click verified identity • No email verification codes needed
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VIEW 3: PROFILE COMPLETION (FIRST-TIME GOOGLE SIGN UP)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === "signup_profile" && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Step 2 of 2: Profile Setup
                </span>
                <h4 className="text-[18px] font-black text-slate-900 tracking-tight mt-1.5">
                  Complete Your Account
                </h4>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Set your phone and create a password for direct login.
                </p>
              </div>

              {/* Verified Google Email Pill (Read-Only) */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Verified Google Account</p>
                    <p className="text-[13px] font-black text-emerald-950 font-mono">{googleProfile?.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  Locked
                </span>
              </div>

              <form onSubmit={handleCompleteSignUp} className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Winner"
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+234 812 345 6789"
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium"
                  />
                  <span className="text-[10.5px] text-slate-400 font-medium mt-0.5 block">
                    Used by assigned engineers for site inspection dispatches.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                      City / State
                    </label>
                    <input
                      type="text"
                      value={signupLocation}
                      onChange={(e) => setSignupLocation(e.target.value)}
                      placeholder="Abuja (FCT)"
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                      Default Site Area
                    </label>
                    <input
                      type="text"
                      value={signupAddress}
                      onChange={(e) => setSignupAddress(e.target.value)}
                      placeholder="e.g. Maitama, Wuse"
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    Create Account Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      {showSignupPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode("signup_prompt")}
                    className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[13px]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[13.5px] shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? "Creating Account..." : "Create Account & Sign In"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VIEW 4: FORGOT PASSWORD (IDENTITY VERIFICATION WITH GOOGLE)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === "forgot_password" && (
            <div className="space-y-4 text-center">
              <div className="h-14 w-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl mx-auto">
                🛡️
              </div>
              <div>
                <h4 className="text-[19px] font-black text-slate-900 tracking-tight">
                  Verify with Google
                </h4>
                <p className="text-[12.5px] text-slate-500 font-medium mt-1 leading-relaxed">
                  To protect your account, Google OAuth is used as the identity verification method. No SMS or email codes needed.
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center gap-3">
                <div ref={forgotGoogleBtnRef} className="w-full flex justify-center" />

                <button
                  type="button"
                  onClick={handleLaunchGooglePopup}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2.5 shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Verify Identity via Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setErrorMsg(""); setSuccessMsg(""); setMode("login"); }}
                  className="text-[12.5px] font-bold text-slate-500 hover:text-slate-800"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VIEW 5: SET NEW PASSWORD (AFTER GOOGLE VERIFICATION)
             ═══════════════════════════════════════════════════════════════════ */}
          {mode === "forgot_new_password" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[18px] font-black text-slate-900 tracking-tight">
                  Create New Password
                </h4>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Identity verified for account: <strong className="text-slate-900">{forgotGoogleProfile?.email}</strong>
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-[13.5px] font-medium outline-none focus:border-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      {showResetPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-[13.5px] font-medium outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[13.5px] shadow-md shadow-amber-400/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Save New Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
