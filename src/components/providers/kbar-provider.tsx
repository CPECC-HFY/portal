"use client";

import { useRouter } from "next/navigation";
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  type Action,
} from "kbar";
import React from "react";
import { useUserProfile, useUser } from "@/hooks/use-supabase";
import {
  LayoutDashboard,
  Megaphone,
  Bell,
  User,
  Settings,
  BarChart,
  Users,
  MessageSquare,
  FileText,
} from "lucide-react";

const actions: Action[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    shortcut: ["d"],
    keywords: "home overview",
    section: "Navigation",
    perform: () => { },
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    id: "announcements",
    name: "Announcements",
    shortcut: ["a"],
    keywords: "news updates posts",
    section: "Navigation",
    perform: () => { },
    icon: <Megaphone className="size-4" />,
  },
  {
    id: "notifications",
    name: "Notifications",
    shortcut: ["n"],
    keywords: "alerts unread",
    section: "Navigation",
    perform: () => { },
    icon: <Bell className="size-4" />,
  },
  {
    id: "profile",
    name: "My Profile",
    shortcut: ["p"],
    keywords: "account user info",
    section: "Navigation",
    perform: () => { },
    icon: <User className="size-4" />,
  },
  {
    id: "settings",
    name: "Settings",
    shortcut: ["s"],
    keywords: "preferences config",
    section: "Navigation",
    perform: () => { },
    icon: <Settings className="size-4" />,
  },
  {
    id: "analytics",
    name: "Analytics",
    shortcut: [],
    keywords: "charts data insights statistics",
    section: "Navigation",
    perform: () => { },
    icon: <BarChart className="size-4" />,
  },
  {
    id: "manage-users",
    name: "Manage Users",
    keywords: "admin users accounts",
    section: "Administration",
    perform: () => { },
    icon: <Users className="size-4" />,
  },
  {
    id: "manage-announcements",
    name: "Manage Announcements",
    keywords: "admin posts create edit",
    section: "Administration",
    perform: () => { },
    icon: <MessageSquare className="size-4" />,
  },
  {
    id: "audit-log",
    name: "Audit Log",
    keywords: "admin logs history actions",
    section: "Administration",
    perform: () => { },
    icon: <FileText className="size-4" />,
  },
];

const routeMap: Record<string, string> = {
  dashboard: "/dashboard",
  announcements: "/announcements",
  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
  analytics: "/analytics",
  "manage-users": "/admin/users",
  "manage-announcements": "/admin/announcements",
  "audit-log": "/admin/audit-log",
};

function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {item}
          </div>
        ) : (
          <div
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
          >
            {item.icon as React.ReactNode}
            <span className="font-medium">{item.name}</span>
            {item.shortcut?.length ? (
              <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                {item.shortcut.join("+")}
              </kbd>
            ) : null}
          </div>
        )
      }
    />
  );
}

export function CommandBarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useUserProfile(user?.id);

  const isAdmin = profile?.role === "Admin";

  const routeActions = actions
    .filter((action) => {
      // Hide Administration section from non-admins
      if (action.section === "Administration" && !isAdmin) {
        return false;
      }
      return true;
    })
    .map((action) => ({
      ...action,
      perform: () => {
        const route = routeMap[action.id];
        if (route) router.push(route);
      },
    }));

  return (
    <KBarProvider actions={routeActions}>
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
          <KBarAnimator className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl">
            <KBarSearch
              className="w-full border-b bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
              defaultPlaceholder="Type a command or search..."
            />
            <div className="pb-2">
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
}
