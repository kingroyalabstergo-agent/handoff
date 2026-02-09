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
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  return (
    <aside className="hidden lg:flex w-[60px] flex-col items-center py-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-8">
        <div className="h-9 w-9 rounded-xl bg-[#37322F] dark:bg-[#E8A040] flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-[#37322F]/10 dark:bg-white/10 text-[#37322F] dark:text-white"
                  : "text-[rgba(55,50,47,0.35)] dark:text-zinc-600 hover:text-[#37322F] dark:hover:text-white hover:bg-[rgba(55,50,47,0.05)] dark:hover:bg-white/5"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        <Link
          href="/dashboard/settings"
          title="Settings"
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
            pathname.startsWith("/dashboard/settings")
              ? "bg-[#37322F]/10 dark:bg-white/10 text-[#37322F] dark:text-white"
              : "text-[rgba(55,50,47,0.35)] dark:text-zinc-600 hover:text-[#37322F] dark:hover:text-white hover:bg-[rgba(55,50,47,0.05)] dark:hover:bg-white/5"
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={pathname.startsWith("/dashboard/settings") ? 2 : 1.5} />
        </Link>

        <ThemeToggle />

        <button
          onClick={handleLogout}
          title="Sign out"
          className="h-10 w-10 rounded-xl flex items-center justify-center text-[rgba(55,50,47,0.35)] dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>

        {/* Avatar */}
        <div className="mt-2 h-8 w-8 rounded-full bg-gradient-to-br from-[#E8A040] to-[#D4922E] flex items-center justify-center text-white text-xs font-semibold">
          {initial}
        </div>
      </div>
    </aside>
  );
}
