"use client";

import { useEffect, useState, useCallback, use } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Send,
  Download,
  Calendar,
  DollarSign,
  FolderKanban,
  FileText,
  Zap,
} from "lucide-react";

interface PortalToken {
  id: string;
  client_id: string;
  user_id: string;
}

interface Profile {
  org_name: string | null;
  brand_color: string | null;
}

interface Client {
  name: string;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  budget: number | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  created_at: string;
}

interface FileRow {
  id: string;
  name: string;
  file_path: string;
  size_bytes: number | null;
  created_at: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  description: string | null;
  due_date: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-blue-500/20 text-blue-400",
  archived: "bg-gray-500/20 text-gray-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
};

function createAnonClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const supabase = createAnonClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [portalUserId, setPortalUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPortal();
  }, [token]);

  async function loadPortal() {
    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("portal_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      setError("Invalid or expired portal link");
      setLoading(false);
      return;
    }

    const pt = tokenData as PortalToken;
    setPortalUserId(pt.user_id);

    // Load profile (branding)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_name, brand_color")
      .eq("id", pt.user_id)
      .single();
    setProfile(profileData);

    // Load client info
    const { data: clientData } = await supabase
      .from("clients")
      .select("name, company")
      .eq("id", pt.client_id)
      .single();
    setClient(clientData);

    // Load projects for this client
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", pt.client_id)
      .order("created_at", { ascending: false });
    
    const projs = (projectData || []) as Project[];
    setProjects(projs);

    if (projs.length > 0) {
      setSelectedProject(projs[0]);
      await loadProjectData(projs[0].id);
    }

    setLoading(false);
  }

  const loadProjectData = useCallback(async (projectId: string) => {
    const [msgRes, fileRes, invRes] = await Promise.all([
      supabase.from("messages").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("files").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    ]);
    setMessages(msgRes.data || []);
    setFiles(fileRes.data || []);
    setInvoices(invRes.data || []);
  }, [supabase]);

  // Real-time subscriptions for the selected project
  useEffect(() => {
    if (!selectedProject) return;
    const pid = selectedProject.id;

    const msgChannel = supabase
      .channel(`portal-messages-${pid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `project_id=eq.${pid}` },
        () => loadProjectData(pid))
      .subscribe();

    const fileChannel = supabase
      .channel(`portal-files-${pid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "files", filter: `project_id=eq.${pid}` },
        () => loadProjectData(pid))
      .subscribe();

    const invChannel = supabase
      .channel(`portal-invoices-${pid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `project_id=eq.${pid}` },
        () => loadProjectData(pid))
      .subscribe();

    return () => {
      msgChannel.unsubscribe();
      fileChannel.unsubscribe();
      invChannel.unsubscribe();
    };
  }, [selectedProject, supabase, loadProjectData]);

  async function selectProject(project: Project) {
    setSelectedProject(project);
    await loadProjectData(project.id);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selectedProject) return;
    await supabase.from("messages").insert({
      project_id: selectedProject.id,
      content: newMsg,
      sender_id: null, // Client messages have no sender_id
    });
    setNewMsg("");
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", selectedProject.id)
      .order("created_at");
    setMessages(data || []);
  }

  async function downloadFile(file: FileRow) {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-border/50 max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center space-y-4">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Portal Unavailable</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brandColor = profile?.brand_color || "#6366f1";
  const orgName = profile?.org_name || "Handoff";
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidAmount = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const pendingAmount = totalInvoiced - paidAmount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: brandColor }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">{orgName}</span>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
          {client && (
            <div className="text-right">
              <p className="text-sm font-medium">{client.name}</p>
              {client.company && (
                <p className="text-xs text-muted-foreground">{client.company}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Project selector (if multiple) */}
        {projects.length > 1 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Projects</h2>
            <div className="flex gap-2 flex-wrap">
              {projects.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProject?.id === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectProject(p)}
                  style={
                    selectedProject?.id === p.id
                      ? { backgroundColor: brandColor }
                      : {}
                  }
                >
                  <FolderKanban className="mr-2 h-3 w-3" />
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedProject ? (
          <>
            {/* Project header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                <Badge className={statusColors[selectedProject.status] || ""}>
                  {selectedProject.status}
                </Badge>
              </div>
              {selectedProject.description && (
                <p className="text-muted-foreground">{selectedProject.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" /> Due Date
                  </div>
                  <p className="font-semibold">
                    {selectedProject.due_date
                      ? new Date(selectedProject.due_date).toLocaleDateString()
                      : "Not set"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" /> Total Invoiced
                  </div>
                  <p className="font-semibold">€{totalInvoiced.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" /> Pending
                  </div>
                  <p className="font-semibold text-amber-400">€{pendingAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="messages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="messages">
                  Messages {messages.length > 0 && `(${messages.length})`}
                </TabsTrigger>
                <TabsTrigger value="files">
                  Files {files.length > 0 && `(${files.length})`}
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  Invoices {invoices.length > 0 && `(${invoices.length})`}
                </TabsTrigger>
              </TabsList>

              {/* Messages */}
              <TabsContent value="messages">
                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No messages yet. Send one below!
                        </p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg text-sm ${
                              msg.sender_id
                                ? "bg-muted/50 border border-border/50 mr-8"
                                : "ml-8 border"
                            }`}
                            style={
                              !msg.sender_id
                                ? {
                                    backgroundColor: `${brandColor}15`,
                                    borderColor: `${brandColor}30`,
                                  }
                                : {}
                            }
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {msg.sender_id ? orgName : "You"}
                              </span>
                            </div>
                            <p>{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Textarea
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[60px]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        size="icon"
                        className="shrink-0"
                        disabled={!newMsg.trim()}
                        style={{ backgroundColor: brandColor }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Files */}
              <TabsContent value="files">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    {files.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No files shared yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {files.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {f.name}
                                </div>
                              </TableCell>
                              <TableCell>{formatBytes(f.size_bytes)}</TableCell>
                              <TableCell>
                                {new Date(f.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => downloadFile(f)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoices */}
              <TabsContent value="invoices">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    {invoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No invoices yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell>{inv.description || "Invoice"}</TableCell>
                              <TableCell className="font-medium">
                                €{Number(inv.amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge className={statusColors[inv.status] || ""}>
                                  {inv.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {inv.due_date
                                  ? new Date(inv.due_date).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="border-border/50">
            <CardContent className="pt-8 text-center">
              <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No projects yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-medium">Handoff</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
