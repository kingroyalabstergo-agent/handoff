"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, FileText } from "lucide-react";

interface Invoice {
  id: string; amount: number; currency: string; status: string;
  due_date: string | null; description: string | null; created_at: string;
  projects: { name: string } | null;
  clients: { name: string } | null;
}
interface Project { id: string; name: string; }
interface Client { id: string; name: string; }

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400", sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400", overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) { loadInvoices(); loadRefs(); } }, [user]);

  async function loadInvoices() {
    const supabase = createClient();
    const { data } = await supabase.from("invoices").select("*, projects(name), clients(name)").order("created_at", { ascending: false });
    setInvoices((data as Invoice[]) || []);
    setLoading(false);
  }

  async function loadRefs() {
    const supabase = createClient();
    const [p, c] = await Promise.all([
      supabase.from("projects").select("id, name").order("name"),
      supabase.from("clients").select("id, name").order("name"),
    ]);
    setProjects(p.data || []);
    setClients(c.data || []);
  }

  async function handleCreate() {
    if (!amount || !user) return;
    const supabase = createClient();
    await supabase.from("invoices").insert({
      amount: parseFloat(amount),
      description: description || null,
      project_id: projectId || null,
      client_id: clientId || null,
      due_date: dueDate || null,
      user_id: user.id,
    });
    setAmount(""); setDescription(""); setProjectId(""); setClientId(""); setDueDate("");
    setOpen(false);
    loadInvoices();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track payments and billing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Amount (€)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
              <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Invoice description" /></div>
              <div><Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <Button onClick={handleCreate} className="w-full">Create Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="pt-6">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.description || "—"}</TableCell>
                      <TableCell>{inv.projects?.name || "—"}</TableCell>
                      <TableCell>{inv.clients?.name || "—"}</TableCell>
                      <TableCell className="font-medium">€{Number(inv.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusColors[inv.status] || ""}>{inv.status}</Badge></TableCell>
                      <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
