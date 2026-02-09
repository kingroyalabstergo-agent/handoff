"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AuthProvider } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-[#F7F5F3] dark:bg-zinc-950 relative overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(234,160,60,0.08)_0%,_rgba(220,130,40,0.04)_35%,_transparent_70%)]" />
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(234,160,60,0.06)_0%,_rgba(220,130,40,0.03)_40%,_transparent_70%)]" />
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col relative z-10">
          <Topbar />
          <main className="flex-1 overflow-auto pl-4 pr-6 pt-3 pb-6 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
