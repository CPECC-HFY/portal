"use client";
export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState } from "react";
import { Plus, Trash2, Search, Users, Sparkles, X, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroups, useUsersList } from "@/hooks/use-supabase";
import { updateGroupMembers, createGroup, deleteGroup } from "@/app/actions/group-actions";
import { useTranslations } from "next-intl";

export default function ManageGroupsPage() {
  const { groups, loading: groupsLoading, refresh: refreshGroups } = useGroups();
  const { data: users, loading: usersLoading } = useUsersList();

  const t = useTranslations("Admin");
  const commonT = useTranslations("Common");
  const groupsT = useTranslations("Groups");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      await createGroup(newGroupName, newGroupDesc);
      setNewGroupName("");
      setNewGroupDesc("");
      setIsCreateOpen(false);
      refreshGroups();
    } catch (error) {
      console.error("Failed to create group", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm(t("deleteGroupConfirm"))) return;
    try {
      await deleteGroup(id);
      refreshGroups();
    } catch (error) {
      console.error("Failed to delete group", error);
    }
  };

  const handleOpenMembers = (group: any) => {
    setSelectedGroup(group);
    setSelectedUserIds(group.members.map((m: any) => m.user_id));
    setIsMembersOpen(true);
  };

  const handleSaveMembers = async () => {
    if (!selectedGroup) return;
    setIsSavingMembers(true);
    try {
      await updateGroupMembers(selectedGroup.id, selectedUserIds);
      setIsMembersOpen(false);
      refreshGroups();
    } catch (error) {
      console.error("Failed to update members", error);
    } finally {
      setIsSavingMembers(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users?.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t("targetedGroups")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("targetedGroupsDesc")}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="size-4" />
          {t("createNewGroup")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/40 h-40" />
          ))
        ) : groups.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
            <Users className="size-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">{t("noGroupsFoundTitle")}</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              {t("noGroupsFoundDesc")}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <Card
              key={group.id}
              className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5"
            >
              <CardHeader className="pb-3 bg-muted/10">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl">{group.name}</CardTitle>
                {group.description && (
                  <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1 italic">
                    &ldquo;{group.description}&rdquo;
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-4 flex items-center justify-between">
                <Badge variant="secondary" className="gap-1.5 font-medium px-2.5 py-0.5">
                  <Users className="size-3.5" />
                  {t("membersCount", { count: group.members.length })}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  onClick={() => handleOpenMembers(group)}
                >
                  {t("manageMembers")}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createTargetedGroup")}</DialogTitle>
            <DialogDescription>
              {t("createTargetedGroupDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("groupName")}</label>
              <Input
                placeholder={t("groupNamePlaceholder")}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{commonT("description")} ({commonT("optional")})</label>
              <Input
                placeholder={t("groupDescPlaceholder")}
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {commonT("cancel")}
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()}>
              {isCreating ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {t("createGroup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6 text-primary" />
              {t("manageMembers")}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              {t("group")}: <span className="text-foreground font-bold">{selectedGroup?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 border-b bg-muted/20">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("searchUsersPlaceholder")}
                className="ps-9 bg-background"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[40vh] px-6">
            <div className="py-2 space-y-1">
              {usersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                filteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedUserIds.includes(user.id)
                      ? "bg-primary/5 border border-primary/20"
                      : "hover:bg-muted/50 border border-transparent"
                      }`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedUserIds.includes(user.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{user.name}</div>
                        <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    {selectedUserIds.includes(user.id) ? (
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="size-3 text-primary-foreground font-bold" />
                      </div>
                    ) : (
                      <div className="size-5 rounded-full border-2 border-muted-foreground/20" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-muted/30 border-t flex flex-wrap gap-2 items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t("usersSelected", { count: selectedUserIds.length })}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsMembersOpen(false)}>
                {commonT("cancel")}
              </Button>
              <Button size="sm" onClick={handleSaveMembers} disabled={isSavingMembers}>
                {isSavingMembers ? <Loader2 className="size-4 animate-spin me-2" /> : null}
                {commonT("saveChanges")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
