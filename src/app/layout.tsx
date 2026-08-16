import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "QuestMore — Engineering & Property Services",
  description:
    "Nigeria's trusted platform for construction, electrical, plumbing, property, maintenance, and engineering services. Verified professionals, quality guaranteed.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuestMore",
    startupImage: "/apple-touch-icon.png",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow pinch-zoom (accessibility)
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#07111F" },
    { media: "(prefers-color-scheme: light)", color: "#07111F" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* PWA — Manifest & Apple */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QuestMore" />
        <meta name="application-name" content="QuestMore" />

        {/* PWA — Microsoft (Edge) */}
        <meta name="msapplication-TileColor" content="#07111F" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* General */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <link rel="shortcut icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
