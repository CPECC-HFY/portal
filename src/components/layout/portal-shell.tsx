"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { CommandBarProvider } from "@/components/providers/kbar-provider";
import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <CommandBarProvider>
      <div className="relative flex min-h-svh">
        <AppSidebar />
        <div
          className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out w-full",
            "lg:ml-[68px]", // Desktop default (collapsed)
            isOpen && "lg:ml-64", // Desktop open
            !isOpen && "ml-0" // Ensure no margin on mobile or when forced closed
          )}
        >
          <Header />
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </CommandBarProvider>
  );
}
