"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type ChangeCallback = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;

/**
 * Subscribe to realtime changes on a Supabase table.
 * Calls `onChange` for INSERT, UPDATE, and DELETE events.
 * Optionally filter by a column value.
 */
export function useRealtime(
  table: string,
  onChange: ChangeCallback,
  options?: { filter?: string; enabled?: boolean }
) {
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `realtime-${table}-${options?.filter || "all"}-${Date.now()}`;

    const config: {
      event: "*";
      schema: "public";
      table: string;
      filter?: string;
    } = {
      event: "*",
      schema: "public",
      table,
    };

    if (options?.filter) {
      config.filter = options.filter;
    }

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", config, onChange)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, options?.filter, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
