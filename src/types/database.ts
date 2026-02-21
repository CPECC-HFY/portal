// Convenient aliases derived from generated types
import type { Database } from "./supabase";
export type { Database };

export type DbUser = Database["public"]["Tables"]["users"]["Row"];
export type DbAnnouncement = Database["public"]["Tables"]["announcements"]["Row"];
export type DbAuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type DbNotification = Database["public"]["Tables"]["notifications"]["Row"];

// Announcement with joined author
export type AnnouncementWithAuthor = DbAnnouncement & {
  author: Pick<DbUser, "name" | "avatar" | "role"> | null;
};

// Audit log with joined user info
export type AuditLogWithUser = DbAuditLog & {
  user: Pick<DbUser, "name" | "role"> | null;
};
