export const runtime = "edge";
import { Suspense } from "react";
import AnnouncementsClient from "./announcements-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <AnnouncementsClient />
    </Suspense>
  );
}
