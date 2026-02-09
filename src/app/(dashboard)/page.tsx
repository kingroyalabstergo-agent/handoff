"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  FolderKanban,
  Users,
  FileText,
  DollarSign,
  Activity,
  Loader2,
} from "lucide-react";

interface RecentProject {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    pendingInvoices: 0,
    revenue: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const [p, c, inv, recent] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("amount, status"),
        supabase
          .from("projects")
          .select("id, name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      const invoices = inv.data || [];
      const pending = invoices.filter(
        (i) => i.status === "sent" || i.status === "overdue"
      ).length;
      const revenue = invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + Number(i.amount), 0);
      setStats({
        projects: p.count || 0,
        clients: c.count || 0,
        pendingInvoices: pending,
        revenue,
      });
      setRecentProjects((recent.data as RecentProject[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {displayName}. Here&apos;s your overview.
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
            Recent Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects yet. Create your first project to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
