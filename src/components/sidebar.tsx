"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
// ThemeToggle moved to topbar

const navItems = [
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "U";
  const initial = displayName.charAt(0).toUpperCase();

  const isDashboard = pathname === "/dashboard";

  return (
    <aside className="hidden lg:flex w-24 flex-col items-center py-6 relative z-20">
      {/* Logo */}
      <div className="mb-10">
        <div className="h-10 w-10 rounded-xl bg-[#37322F] dark:bg-[#E8A040] flex items-center justify-center">
          <Zap className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Dashboard icon — stays at top */}
      <Link
        href="/dashboard"
        title="Dashboard"
        className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
          isDashboard
            ? "bg-[#E8A040] text-white shadow-md shadow-[#E8A040]/20"
            : "bg-white/50 dark:bg-white/5 text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/70 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white"
        )}
      >
        <LayoutDashboard className="h-5 w-5" strokeWidth={isDashboard ? 2 : 1.5} />
      </Link>

      {/* Gap then nav icons */}
      <div className="h-12" />

      <nav className="flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-[#E8A040] text-white shadow-md shadow-[#E8A040]/20"
                  : "bg-white/50 dark:bg-white/5 text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/70 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/dashboard/settings"
          title="Settings"
          className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200",
            pathname.startsWith("/dashboard/settings")
              ? "bg-[#E8A040] text-white shadow-md shadow-[#E8A040]/20"
              : "bg-white/50 dark:bg-white/5 text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/70 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" strokeWidth={pathname.startsWith("/dashboard/settings") ? 2 : 1.5} />
        </Link>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/50 dark:bg-white/5 text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Avatar moved to topbar */}
      </div>
    </aside>
  );
}
