"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Users, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 8;

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const supabase = createClient();

  const loadClients = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    loadClients();
  }, [user, loadClients]);

  useRealtime("clients", () => loadClients(), { enabled: !!user });

  async function handleCreate() {
    if (!name || !user) return;
    await supabase.from("clients").insert({
      name,
      email: email || null,
      company: company || null,
      user_id: user.id,
    });
    setName("");
    setEmail("");
    setCompany("");
    setOpen(false);
    loadClients();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-3">Manage your client list</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 px-5 rounded-xl bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-[rgba(55,50,47,0.6)] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white font-medium shadow-none">
              <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-[rgba(55,50,47,0.08)] dark:border-white/[0.06] bg-[#F7F5F3] dark:bg-zinc-950 rounded-2xl">
            <div className="p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-[#37322F] dark:text-white" style={{ fontFamily: "var(--font-instrument-serif)" }}>
                  Add new client
                </h2>
                <p className="text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500 mt-1">
                  Add a client to start collaborating.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Client name"
                    autoFocus
                    className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#37322F] dark:text-zinc-300 text-sm">Company</Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="h-11 rounded-xl border-[rgba(55,50,47,0.1)] dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 focus-visible:ring-[#E8A040]/30 focus-visible:border-[#E8A040]/50"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!name}
                  className="w-full h-11 rounded-xl bg-[#37322F] hover:bg-[#4A443F] dark:bg-[#E8A040] dark:hover:bg-[#D4922E] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Add Client
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(55,50,47,0.3)] dark:text-zinc-600" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search clients..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-sm text-[#37322F] dark:text-white placeholder:text-[rgba(55,50,47,0.3)] dark:placeholder:text-zinc-600 outline-none focus:border-[#E8A040]/40 transition-colors"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Users className="h-10 w-10 text-[rgba(55,50,47,0.1)] dark:text-zinc-800 mb-4" strokeWidth={1.5} />
          <p className="text-[#37322F] dark:text-white font-medium text-lg">
            {search ? "No clients found" : "No clients yet"}
          </p>
          <p className="text-sm text-[rgba(55,50,47,0.4)] dark:text-zinc-500 mt-1">
            {search ? "Try a different search term" : "Add your first client to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white dark:bg-zinc-900/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(55,50,47,0.06)] dark:border-white/[0.04]">
                  <th className="text-left px-5 py-3.5 text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider font-medium">Name</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider font-medium">Email</th>
                  <th className="text-left px-5 py-3.5 text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider font-medium">Company</th>
                  <th className="text-right px-5 py-3.5 text-[11px] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 uppercase tracking-wider font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-[rgba(55,50,47,0.04)] dark:border-white/[0.03] last:border-0 hover:bg-[rgba(55,50,47,0.02)] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#37322F] dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-[#37322F] dark:text-white">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
                      {client.email || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-[rgba(55,50,47,0.5)] dark:text-zinc-500">
                      {client.company || "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                      {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[rgba(55,50,47,0.4)] dark:text-zinc-500">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-[#E8A040] text-white shadow-md shadow-[#E8A040]/20"
                        : "bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/50 dark:bg-white/5 border border-[rgba(55,50,47,0.06)] dark:border-white/[0.06] text-[rgba(55,50,47,0.4)] dark:text-zinc-500 hover:bg-white/80 dark:hover:bg-white/10 hover:text-[#37322F] dark:hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
