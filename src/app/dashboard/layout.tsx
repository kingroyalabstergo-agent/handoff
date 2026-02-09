"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
