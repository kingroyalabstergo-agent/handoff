"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
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
import { Plus, Calendar, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  budget: number | null;
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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active projects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
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
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <Badge className={statusColors[project.status] || ""}>
                      {project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.clients?.name && (
                      <span>{project.clients.name}</span>
                    )}
                    {project.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {project.budget && <span>€{project.budget.toLocaleString()}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
