"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Home,
  Megaphone,
  Bell,
  User,
  Settings,
  BarChart3,
  Users,
  FileText,
  Shield,
  ChevronLeft,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useUser, useUserProfile, useNotificationsList } from "@/hooks/use-supabase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Notifications", href: "/notifications", icon: Bell, badge: true },
  { title: "Settings", href: "/settings", icon: Settings },
];

const adminNav = [
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Manage Users", href: "/admin/users", icon: Users },
  { title: "Manage Groups", href: "/admin/groups", icon: Sparkles },
  { title: "Manage Announcements", href: "/admin/announcements", icon: FileText },
  { title: "Audit Log", href: "/admin/audit-log", icon: Shield },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  const { data: notifications, unreadCount } = useNotificationsList(user?.id);
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { profile } = useUserProfile(user?.id);
  const isAdmin = profile?.role === "Admin" || profile?.role === "Super Admin";
  const t = useTranslations("Navigation");

  const translatedMainNav = [
    { title: t("dashboard"), href: "/dashboard", icon: Home },
    { title: t("announcements"), href: "/announcements", icon: Megaphone },
    { title: t("notifications"), href: "/notifications", icon: Bell, badge: true },
    { title: t("settings"), href: "/settings", icon: Settings },
  ];

  const translatedAdminNav = [
    { title: t("analytics"), href: "/admin/analytics", icon: BarChart3 },
    { title: t("manageUsers"), href: "/admin/users", icon: Users },
    { title: t("manageGroups"), href: "/admin/groups", icon: Sparkles },
    { title: t("manageAnnouncements"), href: "/admin/announcements", icon: FileText },
    { title: t("auditLog"), href: "/admin/audit-log", icon: Shield },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={toggle}
        />
      )}

      <aside
        className={cn(
          "fixed start-0 top-0 z-50 flex h-svh flex-col border-e bg-sidebar-background transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          isOpen
            ? "w-64 translate-x-0"
            : cn("w-[68px] lg:translate-x-0", isRTL ? "translate-x-full" : "-translate-x-full")
        )}
      >
        {/* Logo container */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-2",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          {isOpen ? (
            <div className="flex flex-1 items-center justify-center">
              <Link href="/dashboard" className="flex items-center justify-center">
                <div
                  className={cn(
                    "flex items-center justify-center transition-all duration-300 overflow-hidden",
                    "w-32 h-10"
                  )}
                >
                  {isMounted ? (
                    <Image
                      src="/icons/raseplogof.png"
                      alt="Logo"
                      width={120}
                      height={40}
                      className="h-full w-full object-contain"
                      priority
                    />
                  ) : (
                    <div className="h-4 w-12 animate-pulse rounded bg-muted/20" />
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center">
              <div
                className={cn(
                  "flex items-center justify-center transition-all duration-300 overflow-hidden",
                  "size-8"
                )}
              >
                {isMounted ? (
                  <Image
                    src="/icons/raseplogof.png"
                    alt="Logo"
                    width={120}
                    height={40}
                    className="h-full w-full object-cover"
                    priority
                  />
                ) : (
                  <div className="h-4 w-12 animate-pulse rounded bg-muted/20" />
                )}
              </div>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8 shrink-0 lg:hidden", !isOpen && "absolute start-4")}
            onClick={toggle}
          >
            <Menu className="size-5" />
          </Button>

          {/* Desktop Chevron Toggle */}
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 hidden lg:flex end-2 absolute"
              onClick={toggle}
            >
              <ChevronLeft className={cn("size-4 transition-transform duration-300", isRTL && "rotate-180")} />
            </Button>
          )}

          {!isOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 hidden lg:flex absolute -end-4 top-4 z-50 bg-background border shadow-sm rounded-full"
              onClick={toggle}
            >
              <ChevronLeft className={cn("size-4 transition-transform duration-300", isRTL ? "" : "rotate-180")} />
            </Button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-64px)] pb-10">
          <nav className="flex flex-col gap-1 p-3">
            {isOpen && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("main")}
              </p>
            )}
            {translatedMainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !isOpen && "justify-center px-2"
                  )}
                >
                  {isActive && (
                    <div className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-e-full bg-sidebar-primary" />
                  )}
                  <item.icon
                    className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")}
                  />
                  {isOpen && <span>{item.title}</span>}
                  {item.badge && unreadCount > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground",
                        isOpen ? "ms-auto size-5" : "absolute -end-1 -top-1 size-4"
                      )}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
              return isOpen ? (
                link
              ) : (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side={isRTL ? "left" : "right"}>
                    {item.title}
                    {item.badge && unreadCount > 0 && ` (${unreadCount})`}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            <Separator className="my-3" />

            {isAdmin && (
              <>
                {isOpen && (
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("administration")}
                  </p>
                )}
                {translatedAdminNav.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        !isOpen && "justify-center px-2"
                      )}
                    >
                      {isActive && (
                        <div className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-e-full bg-sidebar-primary" />
                      )}
                      <item.icon
                        className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")}
                      />
                      {isOpen && <span>{item.title}</span>}
                    </Link>
                  );
                  return isOpen ? (
                    link
                  ) : (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side={isRTL ? "left" : "right"}>{item.title}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

      </aside>
    </TooltipProvider>
  );
}
