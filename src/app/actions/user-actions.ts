"use server";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export const runtime = "edge";

import { createClient } from "@supabase/supabase-js";
import { type Database } from "@/types/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { logAuditAction } from "./audit-actions";

async function getActorId() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

async function validateAdminRole(): Promise<
  { allowed: true; actorId: string } | { allowed: false; error: string }
> {
  const actorId = await getActorId();
  if (!actorId) return { allowed: false, error: "Unauthorized" };

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", actorId)
    .single();

  const allowedRoles = ["Super Admin", "Admin"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { allowed: false, error: "Access denied: Only admins can perform this action" };
  }

  return { allowed: true, actorId };
}

export async function createAdminUser(userData: {
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "HR" | "Employee";
  department: string;
}) {
  // We cannot use the default client component supabase here,
  // we must use the service role key to bypass RLS for user creation.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Missing Supabase configuration" };
  }

  const authCheck = await validateAdminRole();
  if (!authCheck.allowed) {
    return { success: false, error: authCheck.error };
  }

  const adminAuthClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Generate a random temporary password (8 characters, alphanumeric)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let tempPassword = "";
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: userData.email,
      email_confirm: true,
      password: tempPassword,
      user_metadata: {
        name: userData.name,
        role: userData.role,
        department: userData.department,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user.id;

    // 2. Ensure public.users record is accurate
    const { error: dbError } = await adminAuthClient.from("users").upsert({
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      status: "Active",
    });

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return { success: false, error: dbError.message };
    }

    // 3. Log the action on the server side
    await logAuditAction(
      "Create",
      "User",
      JSON.stringify({ name: userData.name, role: userData.role })
    );

    return { success: true, data: { id: userId, tempPassword, ...userData } };
  } catch (err: any) {
    console.error("Unexpected error creating user:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

export async function deleteAdminUser(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Missing Supabase configuration" };
  }

  const authCheck = await validateAdminRole();
  if (!authCheck.allowed) {
    return { success: false, error: authCheck.error };
  }

  const adminAuthClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // 1. Fetch user name before deletion
    const { data: userData, error: fetchError } = await adminAuthClient
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const targetName = userData?.name || userId;

    // 2. Delete from Auth first
    const { error: authError } = await adminAuthClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Auth deletion error:", authError);
      return { success: false, error: authError.message };
    }

    // 3. Delete from DB users table (though trigger might handle it, let's be explicit)
    const { error: dbError } = await adminAuthClient.from("users").delete().eq("id", userId);

    if (dbError) {
      console.error("DB deletion error:", dbError);
      return { success: false, error: dbError.message };
    }

    // 4. Log the action on the server side
    await logAuditAction("Delete", "User", `Deleted user: ${targetName}`);

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error deleting user:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}
