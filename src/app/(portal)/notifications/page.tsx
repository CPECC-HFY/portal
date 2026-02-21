"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from "react";
import {
  Megaphone,
  AlertTriangle,
  AtSign,
  RefreshCw,
  Bell,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotificationsList, useUser } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { cn, stripHtml } from "@/lib/utils";
import Link from "next/link";

const typeIcons: Record<string, React.ElementType> = {
  announcement: Megaphone,
  system: AlertTriangle,
  mention: AtSign,
  update: RefreshCw,
};

const typeColors: Record<string, string> = {
  announcement: "text-blue-500 bg-blue-500/10",
  system: "text-amber-500 bg-amber-500/10",
  mention: "text-purple-500 bg-purple-500/10",
  update: "text-emerald-500 bg-emerald-500/10",
};

const typeBadgeColors: Record<string, string> = {
  announcement: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  system: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  mention: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
  update: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
};

function NotificationItem({
  notification,
  onMarkRead,
  onClear,
}: {
  notification: any;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const Icon =
    typeIcons[notification.link?.includes("announcement") ? "announcement" : "mention"] || Bell;
  const type = notification.link?.includes("announcement") ? "announcement" : "mention";
  const colorClass = typeColors[type] || "text-gray-500 bg-gray-500/10";

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-lg border p-4 transition-all hover:shadow-sm",
        !notification.is_read && "border-primary/20 bg-primary/[0.02]"
      )}
    >
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", colorClass)}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={cn("text-sm", !notification.is_read ? "font-semibold" : "font-medium")}>
              {notification.title}
            </h4>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
              {stripHtml(notification.message)}
            </p>
          </div>
          {!notification.is_read && (
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={cn(
              "inline-flex w-[105px] justify-center items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
              typeBadgeColors[type] ||
                "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20"
            )}
          >
            <Icon className="shrink-0 size-3" />
            <span className="truncate capitalize">{type}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.created_at)}
          </span>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              <Check className="size-3" />
              Mark read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100",
              notification.is_read ? "ml-auto" : "ml-1.5"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClear(notification.id);
            }}
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Clear notification</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Swipeable wrapper for touch devices */
function SwipeableNotification({
  notification,
  onMarkRead,
  onClear,
}: {
  notification: any;
  onMarkRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef<number | null>(null);
  const THRESHOLD = -80; // Negative because we swipe left

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Only allow swiping left
    if (diff < 0) {
      // Add some resistance if pulling past threshold
      setOffset(diff < THRESHOLD - 20 ? THRESHOLD - 20 + (diff - (THRESHOLD - 20)) * 0.2 : diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (offset < THRESHOLD) {
      onClear(notification.id);
    } else {
      setOffset(0); // Snap back
    }
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-lg group">
      {/* Background Delete Action (revealed on swipe) */}
      <div className="absolute inset-0 flex items-center justify-end bg-destructive px-6 text-destructive-foreground rounded-lg transition-opacity duration-300">
        <Trash2 className="size-5" />
      </div>

      {/* Foreground Content */}
      <div
        className="relative bg-background touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <NotificationItem notification={notification} onMarkRead={onMarkRead} onClear={onClear} />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useUser();
  const {
    data: notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotificationsList(user?.id);
  const [tab, setTab] = useState("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filtered =
    tab === "all"
      ? notifications
      : tab === "unread"
        ? notifications?.filter((n) => !n.is_read)
        : notifications?.filter((n) => n.is_read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p suppressHydrationWarning className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 size-4" />
              Mark all as read
            </Button>
          )}
          {(notifications?.length || 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-muted"
            >
              <Trash2 className="mr-2 size-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {isMounted ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {notifications?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && <Badge className="ml-1.5 text-[10px]">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <div className="mt-4 space-y-3">
              {!filtered || filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="mb-4 size-12 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold">
                      {tab === "unread" ? "No unread notifications" : "No notifications"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tab === "unread"
                        ? "You've read all your notifications!"
                        : "Nothing here yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filtered.map((notification) => (
                  <SwipeableNotification
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onClear={clearNotification}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="h-10 w-full max-w-[200px] animate-pulse rounded-md bg-muted/20" />
          <div className="mt-4 h-[400px] w-full animate-pulse rounded-lg bg-muted/20" />
        </div>
      )}
    </div>
  );
}
