"use client";

import { useEffect, useState } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

export function Topbar() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email || "U";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("org_name")
        .eq("id", user.id)
        .single();
      if (data?.org_name) setOrgName(data.org_name);
    }
    loadProfile();
  }, [user]);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="h-[64px] mt-3 flex items-center justify-between pr-6 pl-4">
      {/* Left — Agency name */}
      <div className="flex items-center">
        <span
          className="text-[#37322F] dark:text-white text-2xl tracking-tight"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          {orgName || "Handoff"}
        </span>
      </div>

      {/* Center — Theme switch */}
      <div className="flex items-center">
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative h-10 w-20 rounded-full bg-white/60 dark:bg-white/10 border border-[rgba(55,50,47,0.08)] dark:border-white/10 transition-colors duration-300 flex items-center justify-between px-1"
          >
            {/* Sun icon — left side */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                !isDark
                  ? "bg-[#37322F] text-white"
                  : "bg-transparent text-[#37322F] dark:text-white"
              }`}
            >
              <Sun className="h-4 w-4" strokeWidth={1.5} />
            </div>
            {/* Moon icon — right side */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark
                  ? "bg-[#E8A040] text-white"
                  : "bg-transparent text-[#37322F]"
              }`}
            >
              <Moon className="h-4 w-4" strokeWidth={1.5} />
            </div>
          </button>
        )}
      </div>

      {/* Right — Search + Avatar */}
      <div className="flex items-center gap-3">
        <button
          title="Search"
          className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/50 dark:bg-white/5 text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/70 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white transition-all duration-200"
        >
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E8A040] to-[#D4922E] flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
          {initial}
        </div>
      </div>
    </header>
  );
}
