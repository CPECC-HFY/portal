"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { profile } = useUserProfile(user?.id);
  const isAdmin = profile?.role === "Admin" || profile?.role === "Super Admin";

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
          "fixed left-0 top-0 z-50 flex h-svh flex-col border-r bg-sidebar-background transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          isOpen ? "w-64 translate-x-0" : "w-[68px] -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b px-4",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-300 overflow-hidden",
                isOpen ? "w-32 h-10" : "size-8"
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
            {isOpen && (
              <span className="text-lg font-bold tracking-tight text-foreground">Portal</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 lg:hidden" // Hide on large screens
            onClick={toggle}
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 hidden lg:flex" // Show on large screens
            onClick={toggle}
          >
            <ChevronLeft
              className={cn("size-4 transition-transform duration-300", !isOpen && "rotate-180")}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {isOpen && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </p>
            )}
            {mainNav.map((item) => {
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
                    <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                  )}
                  <item.icon
                    className={cn("size-[18px] shrink-0", isActive && "text-sidebar-primary")}
                  />
                  {isOpen && <span>{item.title}</span>}
                  {item.badge && unreadCount > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground",
                        isOpen ? "ml-auto size-5" : "absolute -right-1 -top-1 size-4"
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
                  <TooltipContent side="right">
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
                    Administration
                  </p>
                )}
                {adminNav.map((item) => {
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
                        <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
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
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer removed to centralize profile in header */}
      </aside>
    </TooltipProvider>
  );
}
