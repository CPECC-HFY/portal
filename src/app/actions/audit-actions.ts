"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function logAuditAction(
  action: "Create" | "Update" | "Delete" | "Login" | "Logout" | "Export" | "Import" | "View",
  resource: string,
  details: string
) {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    // 1. Get IP address
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    // 2. Get current user ID (if any)
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Middleware handles this
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. Insert into audit_logs
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_id: user?.id ?? null,
      action,
      resource,
      details,
      ip_address: ipAddress,
    });

    if (error) {
      console.error("Failed to write server audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Audit action error:", err);
    return { success: false, error: err.message };
  }
}
