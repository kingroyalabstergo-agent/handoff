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
import { Plus, Calendar, Loader2, FolderKanban, Zap, Clock, Archive, ArrowRight, ArrowLeft, Globe, Palette, Code, PenTool, Video, Megaphone, Check, Sparkles } from "lucide-react";

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
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] = useState<string>("");

  const TOTAL_STEPS = 3;
  const progress = (step / TOTAL_STEPS) * 100;

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
    setStep(1);
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
          <DialogTrigger asChild>
            <Button className="h-10 px-5 rounded-xl bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-[rgba(55,50,47,0.6)] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white font-medium shadow-none">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-[rgba(55,50,47,0.08)] dark:border-white/[0.06] bg-[#F7F5F3] dark:bg-zinc-950 rounded-2xl">
            {/* Progress bar */}
            <div className="w-full h-1 bg-[rgba(55,50,47,0.06)] dark:bg-zinc-900">
              <div className="h-full bg-[#E8A040] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>

            <div className="p-6 pt-5">
              {/* Step 1 — Project Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#37322F] dark:text-white" style={{ fontFamily: "var(--font-instrument-serif)" }}>
                      What type of project?
                    </h2>
                    <p className="text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 mt-1">
                      Choose the category that best fits this project.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "website", label: "Website", icon: Globe },
                      { id: "branding", label: "Branding", icon: Palette },
                      { id: "development", label: "Development", icon: Code },
                      { id: "design", label: "UI/UX Design", icon: PenTool },
                      { id: "video", label: "Video", icon: Video },
                      { id: "marketing", label: "Marketing", icon: Megaphone },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setProjectType(type.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                          projectType === type.id
                            ? "border-[#E8A040] bg-white dark:bg-zinc-900 shadow-sm"
                            : "border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] hover:border-[rgba(55,50,47,0.12)] dark:hover:border-white/[0.1]"
                        }`}
                      >
                        <type.icon
                          className={`h-5 w-5 mx-auto mb-2 ${
                            projectType === type.id
                              ? "text-[#E8A040]"
                              : "text-[rgba(55,50,47,0.3)] dark:text-zinc-500"
                          }`}
                          strokeWidth={1.5}
                        />
                        <span className={`text-xs font-medium ${
                          projectType === type.id
                            ? "text-[#37322F] dark:text-white"
                            : "text-[rgba(55,50,47,0.5)] dark:text-zinc-500"
                        }`}>
                          {type.label}
                        </span>
                        {projectType === type.id && (
                          <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#E8A040] flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Project Details */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-[#37322F] dark:text-white" style={{ fontFamily: "var(--font-instrument-serif)" }}>
                      Project details
                    </h2>
                    <p className="text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 mt-1">
                      Name your project and describe the scope.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Project Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Brand Redesign for Acme Co"
                        autoFocus
                        className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Description</Label>
                      <Textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Brief scope of work, deliverables, goals..."
                        rows={3}
                        className="rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Client</Label>
                      <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white">
                          <SelectValue placeholder="Assign to a client" />
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
                  </div>
                </div>
              )}

              {/* Step 3 — Timeline & Budget */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-[#37322F] dark:text-white" style={{ fontFamily: "var(--font-instrument-serif)" }}>
                      Timeline & budget
                    </h2>
                    <p className="text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 mt-1">
                      Set deadlines and pricing for this project.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Due Date</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Budget (€)</Label>
                        <Input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="0.00"
                          className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                        />
                      </div>
                    </div>

                    {/* Summary preview */}
                    <div className="rounded-xl bg-white dark:bg-zinc-900/50 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] p-4 space-y-2.5 mt-2">
                      <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-600 uppercase tracking-wider">Summary</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[rgba(55,50,47,0.5)] dark:text-zinc-500">Type</span>
                          <span className="text-[#37322F] dark:text-white font-medium capitalize">{projectType || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[rgba(55,50,47,0.5)] dark:text-zinc-500">Project</span>
                          <span className="text-[#37322F] dark:text-white font-medium">{name || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[rgba(55,50,47,0.5)] dark:text-zinc-500">Client</span>
                          <span className="text-[#37322F] dark:text-white font-medium">{clients.find(c => c.id === clientId)?.name || "—"}</span>
                        </div>
                        {budget && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[rgba(55,50,47,0.5)] dark:text-zinc-500">Budget</span>
                            <span className="text-[#37322F] dark:text-white font-medium">€{parseFloat(budget).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                {step > 1 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 hover:text-[#37322F] dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < TOTAL_STEPS ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={step === 1 && !projectType || step === 2 && !name}
                    className="h-10 px-5 rounded-xl bg-[#37322F] hover:bg-[#4A443F] dark:bg-[#E8A040] dark:hover:bg-[#D4922E] text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    disabled={!name}
                    className="h-10 px-6 rounded-xl bg-[#E8A040] hover:bg-[#D4922E] text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Project
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { label: "Active", icon: Zap, filter: "active" },
          { label: "On Hold", icon: Clock, filter: "on_hold" },
          { label: "Completed", icon: Archive, filter: "completed" },
        ].map((tab) => (
          <button
            key={tab.filter}
            className="h-9 px-4 rounded-full flex items-center gap-2 text-sm font-medium border border-[rgba(55,50,47,0.08)] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-[rgba(55,50,47,0.5)] dark:text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06] hover:text-[#37322F] dark:hover:text-white transition-all duration-200"
          >
            <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FolderKanban className="h-10 w-10 text-[rgba(55,50,47,0.1)] dark:text-zinc-800 mb-4" strokeWidth={1.5} />
          <p className="text-[#37322F] dark:text-white font-medium text-lg">No projects yet</p>
          <p className="text-sm text-[rgba(55,50,47,0.4)] dark:text-zinc-500 mt-1">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const gradients = [
              "from-amber-100/80 to-orange-50/60 dark:from-amber-900/20 dark:to-orange-900/10",
              "from-blue-100/80 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10",
              "from-emerald-100/80 to-green-50/60 dark:from-emerald-900/20 dark:to-green-900/10",
              "from-violet-100/80 to-purple-50/60 dark:from-violet-900/20 dark:to-purple-900/10",
              "from-rose-100/80 to-pink-50/60 dark:from-rose-900/20 dark:to-pink-900/10",
              "from-cyan-100/80 to-teal-50/60 dark:from-cyan-900/20 dark:to-teal-900/10",
            ];
            const grad = gradients[project.name.length % gradients.length];

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="rounded-2xl bg-white dark:bg-zinc-900/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  {/* Header: client avatar + name/date + status */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#37322F] dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold text-white">
                        {project.clients?.name?.charAt(0)?.toUpperCase() || project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#37322F] dark:text-white">{project.clients?.name || "No client"}</p>
                        <p className="text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                          {new Date(project.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-medium ${
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

                  {/* Thumbnail image area */}
                  <div className={`mx-4 h-40 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
                    <FolderKanban className="h-10 w-10 text-[rgba(55,50,47,0.08)] dark:text-white/5" strokeWidth={1.5} />
                  </div>

                  {/* Project info */}
                  <div className="px-5 pt-4 pb-5">
                    <h3 className="font-semibold text-[#37322F] dark:text-white">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-[rgba(55,50,47,0.5)] dark:text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                      {project.due_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {new Date(project.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {project.budget && (
                        <span className="font-medium">€{project.budget.toLocaleString()}</span>
                      )}
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

