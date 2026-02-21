import { PortalShell } from "@/components/layout/portal-shell";

// Auth-protected pages should not be statically generated
export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
