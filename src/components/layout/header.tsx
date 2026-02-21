"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { usePathname } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSidebarStore } from "@/store/sidebar-store";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useKBar } from "kbar";

const HeaderAuth = dynamic(() => import("./header-auth").then((mod) => mod.HeaderAuth), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="relative transition-none" type="button">
        <Bell className="size-[1.2rem] opacity-50" />
      </Button>
      <div className="flex size-9 items-center justify-center">
        <div className="size-8 rounded-full bg-muted/20 animate-pulse" />
      </div>
    </div>
  ),
});

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/announcements": "Announcements",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/settings": "Settings",
  "/admin/analytics": "Analytics",
  "/admin/users": "Manage Users",
  "/admin/announcements": "Manage Announcements",
  "/admin/audit-log": "Audit Log",
};

export function Header() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const title = routeTitles[pathname] || "Employee Portal";
  const crumbs = pathname.split("/").filter(Boolean);
  const { query } = useKBar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden hover:bg-muted/50 transition-colors"
        onClick={toggle}
      >
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Home
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/50">/</span>
            <span
              className={
                i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {crumb.charAt(0).toUpperCase() + crumb.slice(1).replace(/-/g, " ")}
            </span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Search trigger */}
        <Button
          variant="outline"
          className="hidden h-9 w-64 items-center gap-2 justify-start rounded-full border-muted-foreground/20 bg-muted/20 px-4 text-muted-foreground shadow-none hover:bg-muted/50 sm:flex lg:w-80"
          onClick={() => query.toggle()}
        >
          <Search className="size-4 text-primary/70 shrink-0" />
          <span className="text-sm font-normal">Search anywhere...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded-sm border border-muted-foreground/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-foreground/70 opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <ThemeToggle />

        <HeaderAuth />
      </div>
    </header>
  );
}
