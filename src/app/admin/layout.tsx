import type { ReactNode } from "react";

export const metadata = {
  title: "QuestMore Admin Panel",
  description: "Manage categories, services, requests, and platform content.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
