"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import {
  FolderKanban,
  Users,
  FileText,
  DollarSign,
  Loader2,
  Sparkles,
  Send,
  TrendingUp,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface MonthRevenue {
  month: string;
  amount: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    pendingInvoices: 0,
    revenue: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthRevenue[]>([]);
  const [chatMessage, setChatMessage] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [p, c, inv, projList, clientList] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("amount, status, created_at"),
      supabase
        .from("projects")
        .select("id, name, status, created_at, clients(name)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("clients")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const invoices = inv.data || [];
    const pending = invoices.filter(
      (i) => i.status === "sent" || i.status === "overdue"
    ).length;
    const revenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // Build monthly revenue for last 6 months
    const months: MonthRevenue[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      const monthAmount = invoices
        .filter((inv) => inv.status === "paid" && inv.created_at?.startsWith(key))
        .reduce((sum, inv) => sum + Number(inv.amount), 0);
      months.push({ month: label, amount: monthAmount });
    }

    setStats({ projects: p.count || 0, clients: c.count || 0, pendingInvoices: pending, revenue });
    setProjects((projList.data as unknown as Project[]) || []);
    setClients((clientList.data as Client[]) || []);
    setMonthlyRevenue(months);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [user, authLoading, loadData]);

  useRealtime("projects", () => loadData(), { enabled: !!user });
  useRealtime("clients", () => loadData(), { enabled: !!user });
  useRealtime("invoices", () => loadData(), { enabled: !!user });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Projects", value: stats.projects },
    { title: "Active Clients", value: stats.clients },
    { title: "Invoices", value: stats.pendingInvoices },
    { title: "Revenue", value: `€${stats.revenue.toLocaleString()}` },
  ];

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const firstName = fullName.split(" ")[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "completed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "on_hold": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      default: return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{greeting}, {firstName}!</h1>
          <p className="text-muted-foreground mt-3">
            Welcome back, here&apos;s your overview.
          </p>
        </div>

        <div className="hidden sm:flex items-start gap-16 pt-1 ml-8">
          {statCards.map((card) => (
            <div key={card.title}>
              <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-5xl font-bold text-[#37322F] dark:text-white leading-none mt-0.5">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 self-center">
          <Link
            href="/dashboard/projects"
            className="h-10 px-4 rounded-xl bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] flex items-center gap-2 text-sm font-medium text-[rgba(55,50,47,0.6)] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white transition-all duration-200"
          >
            <FolderKanban className="h-4 w-4" />
            New Project
          </Link>
          <Link
            href="/dashboard/clients"
            className="h-10 px-4 rounded-xl bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] flex items-center gap-2 text-sm font-medium text-[rgba(55,50,47,0.6)] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            New Client
          </Link>
          <Link
            href="/dashboard/invoices"
            className="h-10 px-4 rounded-xl bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] flex items-center gap-2 text-sm font-medium text-[rgba(55,50,47,0.6)] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white transition-all duration-200"
          >
            <FileText className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Left — AI Assistant Chat */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] p-5 flex flex-col h-[360px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#E8A040]/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#E8A040]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#37322F] dark:text-white">AI Assistant</h3>
              <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500">Coming soon</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col justify-end gap-3 overflow-hidden">
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-[#E8A040]/15 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3 w-3 text-[#E8A040]" />
              </div>
              <div className="rounded-xl rounded-tl-sm bg-[rgba(55,50,47,0.03)] dark:bg-white/[0.04] px-3.5 py-2.5 max-w-[85%]">
                <p className="text-sm text-[rgba(55,50,47,0.7)] dark:text-zinc-400">
                  Hi {firstName}! I&apos;m your AI assistant. I can help you manage projects, draft messages to clients, and more. What would you like to do?
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 h-10 rounded-xl bg-[rgba(55,50,47,0.03)] dark:bg-white/[0.04] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] px-3.5 text-sm text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 outline-none focus:border-[#E8A040]/40"
            />
            <button className="h-10 w-10 rounded-xl bg-[#37322F] dark:bg-[#E8A040] flex items-center justify-center text-white hover:opacity-90 transition-opacity">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Top Right — Projects */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] p-5 h-[360px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-indigo-500" />
              </div>
              <h3 className="text-sm font-semibold text-[#37322F] dark:text-white">Projects</h3>
            </div>
            <Link href="/dashboard/projects" className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:text-[#37322F] dark:hover:text-white transition-colors">
              View all →
            </Link>
          </div>

          <div className="flex-1 overflow-auto">
            {projects.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-[rgba(55,50,47,0.3)] dark:text-zinc-600">No projects yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider">
                    <th className="text-left pb-3 font-medium">Name</th>
                    <th className="text-left pb-3 font-medium">Client</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="border-t border-[rgba(55,50,47,0.04)] dark:border-white/[0.04]">
                      <td className="py-2.5 font-medium text-[#37322F] dark:text-white">
                        <Link href={`/dashboard/projects/${proj.id}`} className="hover:text-[#E8A040] transition-colors">
                          {proj.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
                        {proj.clients?.name || "—"}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(proj.status)}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[rgba(55,50,47,0.4)] dark:text-zinc-500 text-xs">
                        {new Date(proj.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom Left — Clients */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] p-5 h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="text-sm font-semibold text-[#37322F] dark:text-white">Clients</h3>
            </div>
            <Link href="/dashboard/clients" className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:text-[#37322F] dark:hover:text-white transition-colors">
              View all →
            </Link>
          </div>

          <div className="flex-1 overflow-auto">
            {clients.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-[rgba(55,50,47,0.3)] dark:text-zinc-600">No clients yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider">
                    <th className="text-left pb-3 font-medium">Name</th>
                    <th className="text-left pb-3 font-medium">Email</th>
                    <th className="text-right pb-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t border-[rgba(55,50,47,0.04)] dark:border-white/[0.04]">
                      <td className="py-2.5 font-medium text-[#37322F] dark:text-white">{client.name}</td>
                      <td className="py-2.5 text-[rgba(55,50,47,0.5)] dark:text-zinc-500">{client.email}</td>
                      <td className="py-2.5 text-right text-[rgba(55,50,47,0.4)] dark:text-zinc-500 text-xs">
                        {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom Right — Revenue Graph */}
        <div className="rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] p-5 h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="text-sm font-semibold text-[#37322F] dark:text-white">Revenue</h3>
            </div>
            <p className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500">Last 6 months</p>
          </div>

          {/* Bar chart */}
          <div className="flex-1 flex items-end gap-3">
            {monthlyRevenue.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-[10px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 font-medium">
                  {m.amount > 0 ? `€${m.amount}` : ""}
                </p>
                <div className="w-full relative" style={{ height: "180px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-lg transition-all duration-500"
                    style={{
                      height: m.amount > 0 ? `${Math.max((m.amount / maxRevenue) * 100, 8)}%` : "4%",
                      backgroundColor: m.amount > 0
                        ? i === monthlyRevenue.length - 1 ? "#E8A040" : "rgba(232,160,64,0.3)"
                        : "rgba(55,50,47,0.04)",
                    }}
                  />
                </div>
                <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 font-medium">
                  {m.month}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
