"use server";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export const runtime = "edge";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title,
    message,
    link,
    is_read: false,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function notifyAllUsers(title: string, message: string, link?: string) {
  try {
    // 1. Fetch all active users
    const { data: users, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("status", "Active");

    if (fetchError) throw fetchError;
    if (!users || users.length === 0) return { success: true, count: 0 };

    // 2. Prepare notifications
    const notifications = users.map((user) => ({
      user_id: user.id,
      title,
      message,
      link,
      is_read: false,
    }));

    // 3. Batch insert
    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);

    if (insertError) throw insertError;

    return { success: true, count: users.length };
  } catch (err: any) {
    console.error("Failed to notify all users:", err);
    return { success: false, error: err.message };
  }
}

export async function notifyTargetedGroups(
  groupIds: string[],
  title: string,
  message: string,
  link?: string
) {
  try {
    // 1. Fetch all unique user IDs from selected groups
    const { data: members, error: fetchError } = await supabaseAdmin
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds);

    if (fetchError) throw fetchError;
    if (!members || members.length === 0) return { success: true, count: 0 };

    // 2. Get unique user IDs
    const uniqueUserIds = Array.from(new Set(members.map((m) => m.user_id)));

    // 3. Prepare notifications
    const notifications = uniqueUserIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      link,
      is_read: false,
    }));

    // 4. Batch insert
    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);

    if (insertError) throw insertError;

    return { success: true, count: uniqueUserIds.length };
  } catch (err: any) {
    console.error("Failed to notify targeted groups:", err);
    return { success: false, error: err.message };
  }
}

export async function notifyMentions(
  content: string,
  title: string,
  announcementTitle: string,
  link: string
) {
  try {
    // 1. Fetch all users for matching
    const { data: users, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("status", "Active");

    if (fetchError) throw fetchError;
    if (!users) return { success: true, count: 0 };

    // 2. Find mentions in content (e.g., @Name)
    const mentionedUsers = users.filter((u) => content.includes(`@${u.name}`));
    if (mentionedUsers.length === 0) return { success: true, count: 0 };

    // 3. Prepare notifications
    const notifications = mentionedUsers.map((u) => ({
      user_id: u.id,
      title,
      message: announcementTitle,
      link,
      is_read: false,
    }));

    // 4. Batch insert
    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);

    if (insertError) throw insertError;

    return { success: true, count: mentionedUsers.length };
  } catch (err: any) {
    console.error("Failed to notify mentions:", err);
    return { success: false, error: err.message };
  }
}
