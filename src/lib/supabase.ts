import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database"; // using the more specific types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// NOTE: Admin client moved to lib/supabase-admin.ts with "server-only" guard
