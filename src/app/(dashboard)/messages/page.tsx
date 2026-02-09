"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  projects: { name: string } | null;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("messages")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setMessages((data as Message[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">All project communications</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="pt-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Messages will appear here when you communicate in projects</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      {msg.projects?.name && <Badge variant="secondary" className="text-xs">{msg.projects.name}</Badge>}
                      {msg.is_internal && <Badge variant="outline" className="text-xs">Internal</Badge>}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
