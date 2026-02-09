"use client";

// Re-export browser client for backward compatibility
import { createClient } from "@/lib/supabase/client";

export const supabase = createClient();
