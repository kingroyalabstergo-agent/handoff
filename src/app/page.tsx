"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  FolderKanban,
  Users,
  FileText,
  DollarSign,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    pendingInvoices: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function load() {
      const [p, c, inv] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("amount, status"),
      ]);
      const invoices = inv.data || [];
      const pending = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
      const revenue = invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + Number(i.amount), 0);
      setStats({
        projects: p.count || 0,
        clients: c.count || 0,
        pendingInvoices: pending,
        revenue,
      });
    }
    load();
  }, []);

  const cards = [
    {
      title: "Total Projects",
      value: stats.projects,
      icon: FolderKanban,
      color: "text-indigo-400",
    },
    {
      title: "Active Clients",
      value: stats.clients,
      icon: Users,
      color: "text-emerald-400",
    },
    {
      title: "Pending Invoices",
      value: stats.pendingInvoices,
      icon: FileText,
      color: "text-amber-400",
    },
    {
      title: "Revenue",
      value: `€${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s your overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New project created", time: "2 hours ago", badge: "Project" },
              { action: "Invoice #003 sent", time: "5 hours ago", badge: "Invoice" },
              { action: "Client feedback received", time: "1 day ago", badge: "Message" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
                <Badge variant="secondary">{item.badge}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
