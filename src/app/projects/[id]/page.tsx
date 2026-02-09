"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { CheckCircle2, Circle, Clock, Send, Upload } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
}
interface FileRow {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
}
interface Message {
  id: string;
  content: string;
  created_at: string;
  is_internal: boolean;
}
interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string | null;
}

const milestoneIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  "in-progress": <Clock className="h-4 w-4 text-amber-400" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<{ name: string; description: string | null; status: string } | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    async function load() {
      const [pRes, mRes, fRes, msgRes, invRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("milestones").select("*").eq("project_id", id).order("position"),
        supabase.from("files").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("messages").select("*").eq("project_id", id).order("created_at"),
        supabase.from("invoices").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
      if (pRes.data) setProject(pRes.data);
      setMilestones(mRes.data || []);
      setFiles(fRes.data || []);
      setMessages(msgRes.data || []);
      setInvoices(invRes.data || []);
    }
    load();
  }, [id]);

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  async function sendMessage() {
    if (!newMsg.trim()) return;
    await supabase.from("messages").insert({ project_id: id, content: newMsg });
    setNewMsg("");
    const { data } = await supabase.from("messages").select("*").eq("project_id", id).order("created_at");
    setMessages(data || []);
  }

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      {milestones.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {milestoneIcon[m.status]}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(m.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Files</CardTitle>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files uploaded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell>{f.file_type || "—"}</TableCell>
                        <TableCell>{new Date(f.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-80 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-sm ${
                        msg.is_internal
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : "bg-muted/50"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                        {msg.is_internal && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
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
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          €{Number(inv.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.status}</Badge>
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
