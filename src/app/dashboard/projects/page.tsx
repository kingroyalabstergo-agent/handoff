"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/hooks/use-realtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Calendar, Loader2, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  budget: number | null;
  created_at: string;
  clients: { name: string } | null;
}

interface ClientOption {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-blue-500/20 text-blue-400",
  archived: "bg-gray-500/20 text-gray-400",
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");

  const supabase = createClient();

  const loadProjects = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  }, [supabase]);

  const loadClients = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");
    setClients(data || []);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    loadProjects();
    loadClients();
  }, [user, loadProjects, loadClients]);

  useRealtime("projects", () => loadProjects(), { enabled: !!user });

  async function handleCreate() {
    if (!name || !user) return;
    await supabase.from("projects").insert({
      name,
      description: desc || null,
      client_id: clientId || null,
      due_date: dueDate || null,
      budget: budget ? parseFloat(budget) : null,
      user_id: user.id,
    });
    setName("");
    setDesc("");
    setClientId("");
    setDueDate("");
    setBudget("");
    setOpen(false);
    loadProjects();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-3">
            Manage your active projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 px-5 rounded-xl bg-[#37322F] hover:bg-[#4A443F] dark:bg-[#E8A040] dark:hover:bg-[#D4922E] text-white">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Budget (€)</Label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl bg-[rgba(55,50,47,0.03)] dark:bg-white/[0.02] p-3">
          <div className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] backdrop-blur-sm p-12 flex flex-col items-center justify-center shadow-sm">
            <FolderKanban className="h-8 w-8 text-[rgba(55,50,47,0.15)] dark:text-zinc-700 mb-3" strokeWidth={1.5} />
            <p className="text-[#37322F] dark:text-white font-medium">No projects yet</p>
            <p className="text-sm text-[rgba(55,50,47,0.4)] dark:text-zinc-500 mt-1">
              Create your first project to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const colors = [
              "from-amber-100 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20",
              "from-blue-100 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20",
              "from-emerald-100 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20",
              "from-violet-100 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",
              "from-rose-100 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",
              "from-cyan-100 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/20",
            ];
            const colorClass = colors[project.name.length % colors.length];

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                  {/* Header: client + status */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[rgba(55,50,47,0.06)] dark:bg-white/[0.06] flex items-center justify-center text-xs font-semibold text-[#37322F] dark:text-white">
                        {project.clients?.name?.charAt(0) || project.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#37322F] dark:text-white">{project.clients?.name || "No client"}</p>
                        <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                          {new Date(project.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      project.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : project.status === "completed"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : project.status === "on_hold"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Thumbnail / gradient placeholder */}
                  <div className={`mx-3 h-36 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                    <FolderKanban className="h-8 w-8 text-[rgba(55,50,47,0.1)] dark:text-white/10" strokeWidth={1.5} />
                  </div>

                  {/* Project info */}
                  <div className="px-4 py-3.5">
                    <h3 className="font-semibold text-[#37322F] dark:text-white text-sm">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-[rgba(55,50,47,0.5)] dark:text-zinc-500 line-clamp-1 mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                      {project.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {project.budget && <span>€{project.budget.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

