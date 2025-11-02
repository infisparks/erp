"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjldxdgbrkhtjjwpbezk.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbGR4ZGdicmtodGpqd3BiZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTEzNDYsImV4cCI6MjA3NzU4NzM0Nn0.ScEhn27QPejnCnsoAIuNpOLx_FYrHLijwQsje808IEQ",
    )
  }
  return supabaseClient
}
