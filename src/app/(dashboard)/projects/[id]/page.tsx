"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  DollarSign,
  Users,
  Send,
  Upload,
  Download,
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

interface FileRow {
  id: string;
  name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_internal: boolean;
  sender_id: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
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

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  // Invoice dialog state
  const [invOpen, setInvOpen] = useState(false);
  const [invAmount, setInvAmount] = useState("");
  const [invDesc, setInvDesc] = useState("");
  const [invDueDate, setInvDueDate] = useState("");
  const [invStatus, setInvStatus] = useState("draft");

  const loadData = useCallback(async () => {
    const [pRes, fRes, msgRes, invRes] = await Promise.all([
      supabase.from("projects").select("*, clients(name)").eq("id", id).single(),
      supabase.from("files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").eq("project_id", id).order("created_at"),
      supabase.from("invoices").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    if (pRes.data) setProject(pRes.data as Project);
    setFiles(fRes.data || []);
    setMessages(msgRes.data || []);
    setInvoices(invRes.data || []);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, id, loadData]);

  async function sendMessage() {
    if (!newMsg.trim() || !user) return;
    await supabase.from("messages").insert({
      project_id: id,
      content: newMsg,
      sender_id: user.id,
    });
    setNewMsg("");
    // Reload messages
    const { data } = await supabase.from("messages").select("*").eq("project_id", id).order("created_at");
    setMessages(data || []);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    if (!user) return;
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;
    setUploading(true);

    for (const file of filesToUpload) {
      const filePath = `${user.id}/${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (!uploadError) {
        await supabase.from("files").insert({
          project_id: id,
          uploaded_by: user.id,
          name: file.name,
          file_path: filePath,
          size_bytes: file.size,
          mime_type: file.type,
        });
      }
    }
    loadData();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleFileDownload(file: FileRow) {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function handleCreateInvoice() {
    if (!invAmount || !user) return;
    await supabase.from("invoices").insert({
      amount: parseFloat(invAmount),
      description: invDesc || null,
      due_date: invDueDate || null,
      status: invStatus,
      project_id: id,
      user_id: user.id,
    });
    setInvAmount("");
    setInvDesc("");
    setInvDueDate("");
    setInvStatus("draft");
    setInvOpen(false);
    loadData();
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Project not found</p>
        <Link href="/projects" className="text-primary text-sm mt-2 hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const budgetProgress = project.budget ? (totalInvoiced / Number(project.budget)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <Badge className={statusColors[project.status] || ""}>
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">
            Files {files.length > 0 && `(${files.length})`}
          </TabsTrigger>
          <TabsTrigger value="messages">
            Messages {messages.length > 0 && `(${messages.length})`}
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices {invoices.length > 0 && `(${invoices.length})`}
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="h-4 w-4" /> Client
                </div>
                <p className="font-semibold">
                  {project.clients?.name || "No client"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" /> Budget
                </div>
                <p className="font-semibold">
                  {project.budget ? `€${Number(project.budget).toLocaleString()}` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" /> Due Date
                </div>
                <p className="font-semibold">
                  {project.due_date
                    ? new Date(project.due_date).toLocaleDateString()
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" /> Invoiced
                </div>
                <p className="font-semibold">
                  €{totalInvoiced.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {project.budget && (
            <Card className="border-border/50 mt-4">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget used</span>
                  <span className="font-medium">
                    {Math.min(Math.round(budgetProgress), 100)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budgetProgress, 100)}
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50 mt-4">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Files</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border/50 rounded-lg p-6 mb-4 text-center hover:border-primary/30 transition-colors"
              >
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop files here, or click Upload above
                </p>
              </div>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No files uploaded yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell>{formatBytes(f.size_bytes)}</TableCell>
                        <TableCell>
                          {new Date(f.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFileDownload(f)}
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

        {/* MESSAGES TAB */}
        <TabsContent value="messages">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-sm ${
                        msg.sender_id === user?.id
                          ? "bg-primary/10 border border-primary/20 ml-8"
                          : "bg-muted/50 border border-border/50 mr-8"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                        {msg.is_internal && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px]"
                          >
                            Internal
                          </Badge>
                        )}
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
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Dialog open={invOpen} onOpenChange={setInvOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> New Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Amount (€)</Label>
                        <Input
                          type="number"
                          value={invAmount}
                          onChange={(e) => setInvAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={invStatus} onValueChange={setInvStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={invDesc}
                        onChange={(e) => setInvDesc(e.target.value)}
                        placeholder="Invoice description"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={invDueDate}
                        onChange={(e) => setInvDueDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateInvoice} className="w-full">
                      Create Invoice
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No invoices for this project
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
                        <TableCell>{inv.description || "—"}</TableCell>
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
    </div>
  );
}
