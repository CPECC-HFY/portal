"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";
import { MessageSquare, Send, Trash2, User, Loader2 } from "lucide-react";
import { useComments, useUser } from "@/hooks/use-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { Separator } from "@/components/ui/separator";
import { useUserProfile } from "@/hooks/use-supabase";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { useTranslations } from "next-intl";

interface AnnouncementCommentsProps {
  announcementId: string;
}

export function AnnouncementComments({ announcementId }: AnnouncementCommentsProps) {
  const t = useTranslations("Comments");
  const commonT = useTranslations("Common");
  const { comments, loading, addComment, deleteComment } = useComments(announcementId);
  const { user } = useUser();
  const { profile } = useUserProfile(user?.id);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const { error } = await addComment(newComment.trim());
    if (!error) {
      setNewComment("");
    } else {
      console.error("Failed to add comment:", error);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await deleteComment(deleteId);
    if (error) {
      console.error("Failed to delete comment:", error);
    } else {
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-4 mt-6 border-t pt-6">
      <div className="flex items-center gap-2 px-1">
        <MessageSquare className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">
          {t("title", { count: comments.length })}
        </h3>
      </div>

      <ScrollArea className="max-h-[300px] px-1">
        <div className="space-y-4 pr-3">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs italic">
              {t("noComments")}
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="group relative flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{comment.user?.name}</span>
                      <RoleBadge role={comment.user?.role} size="sm" />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(user?.id === comment.user_id ||
                      profile?.role === "Admin" ||
                      profile?.role === "Super Admin") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => setDeleteId(comment.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-2 rounded-lg">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDesc")}
        confirmText={commonT("delete")}
        variant="destructive"
      />

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center bg-muted/20 p-2 rounded-xl border border-border/50"
      >
        <Input
          placeholder={t("placeholder")}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 h-9 text-sm"
          disabled={submitting}
        />
        <Button
          size="icon"
          className="size-8 rounded-lg shrink-0"
          type="submit"
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
