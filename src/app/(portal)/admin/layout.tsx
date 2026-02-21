"use client";

import { useUser, useUserProfile } from "@/hooks/use-supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const router = useRouter();

  useEffect(() => {
    // 1. Wait until Auth decides if a user exists
    if (userLoading) return;

    // 2. If Auth finished but no user found, kick to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // 3. User definitely exists. Wait for PostgreSQL profile fetch.
    if (profileLoading || !profile) return;

    // 4. PostgreSQL profile finished loading. Enforce RBAC block.
    if (profile.role !== "Admin" && profile.role !== "Super Admin") {
      router.replace("/dashboard");
    }
  }, [user, profile, userLoading, profileLoading, router]);

  // Show loading spinner while any part of the authentication sequence is unresolved
  if (userLoading || profileLoading || (user && !profile)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
          <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin shadow-lg" />
          <span className="font-semibold tracking-wide">Verifying Access...</span>
        </div>
      </div>
    );
  }

  // Safety net: don't render children if about to redirect
  if (!user || (profile?.role !== "Admin" && profile?.role !== "Super Admin")) {
    return null;
  }

  return <>{children}</>;
}
