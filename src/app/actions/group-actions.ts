export const runtime = "edge";
("use server");

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createGroup(name: string, description?: string) {
  const { data, error } = await supabaseAdmin
    .from("groups")
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/groups");
  return data;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabaseAdmin.from("groups").delete().eq("id", groupId);

  if (error) throw error;
  revalidatePath("/admin/groups");
}

export async function addGroupMember(groupId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from("group_members")
    .insert([{ group_id: groupId, user_id: userId }]);

  if (error) throw error;
  revalidatePath("/admin/groups");
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error } = await supabaseAdmin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
  revalidatePath("/admin/groups");
}

export async function updateGroupMembers(groupId: string, userIds: string[]) {
  // 1. Delete existing members
  await supabaseAdmin.from("group_members").delete().eq("group_id", groupId);

  // 2. Insert new members
  if (userIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("group_members")
      .insert(userIds.map((userId) => ({ group_id: groupId, user_id: userId })));
    if (error) throw error;
  }
  revalidatePath("/admin/groups");
}
