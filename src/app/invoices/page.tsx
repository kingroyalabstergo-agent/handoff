"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  description: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvoices(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground mt-1">Track payments and billing</p>
      </div>

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
    </div>
  );
}
