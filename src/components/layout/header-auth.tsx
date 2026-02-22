"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Bell, Megaphone, AtSign, Trash2, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useUserProfile, useNotificationsList } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { cn, stripHtml } from "@/lib/utils";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderAuth() {
  const { user } = useUser();
  const {
    data: notifications,
    unreadCount,
    markAllRead,
    markAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotificationsList(user?.id);
  const { profile } = useUserProfile(user?.id);
  const t = useTranslations("Navigation");
  const rolesT = useTranslations("Roles");

  const handleLogout = async () => {
    await logAudit("Logout", "System", "User logged out");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const userName =
    profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-1">
      {/* Notifications Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative group" type="button">
            <Bell className="size-[1.2rem] transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in duration-300">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 p-0 overflow-hidden shadow-2xl border-none rounded-xl"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/50">
            <DropdownMenuLabel className="font-bold text-sm">{t("notifications")}</DropdownMenuLabel>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-primary hover:text-primary/80 hover:bg-primary/5"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllRead();
                  }}
                >
                  {t("markAllAsRead")}
                </Button>
              )}
              {(notifications?.length || 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 uppercase font-semibold tracking-wider"
                  onClick={(e) => {
                    e.preventDefault();
                    clearAllNotifications();
                  }}
                >
                  {t("clearAll")}
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-foreground/80">{t("allCaughtUp")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("noNewNotifications")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "relative flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 cursor-pointer",
                      !n.is_read && "bg-primary/[0.02]"
                    )}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                    }}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                        n.link?.includes("announcement")
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-purple-500/10 text-purple-600"
                      )}
                    >
                      {n.link?.includes("announcement") ? (
                        <Megaphone className="size-4" />
                      ) : (
                        <AtSign className="size-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs leading-none tabular-nums text-muted-foreground truncate",
                            !n.is_read && "font-semibold text-foreground"
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary mt-1" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity",
                            n.is_read && "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(n.id);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {stripHtml(n.message)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/notifications"
            className="block text-center py-2.5 text-xs font-semibold bg-muted/20 border-t border-border/50 hover:bg-muted/40 transition-colors text-primary"
          >
            {t("viewAllNotifications")}
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            type="button"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors">
              <User className="size-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {profile?.role ? rolesT(profile.role.toLowerCase()) : rolesT("employee")}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="me-2 size-4" />
                <span>{t("profile")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="me-2 size-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="me-2 size-4" />
            <span>{t("logOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
