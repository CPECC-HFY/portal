import { logAuditAction } from "@/app/actions/audit-actions";

/**
 * Log an audit event.
 * Now calls a server action to capture IP address and ensure reliable logging.
 */
export async function logAudit(
  action: "Create" | "Update" | "Delete" | "Login" | "Logout" | "Export" | "Import" | "View",
  resource: string,
  details: string
) {
  // Simply proxy to the server action
  return logAuditAction(action, resource, details);
}
