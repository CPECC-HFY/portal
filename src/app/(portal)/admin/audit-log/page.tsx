"use client";
export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/incompatible-library */

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  FilePlus,
  FileEdit,
  Trash2,
  Download,
  Upload,
  Shield,
  User as UserIcon,
  Activity,
  Users,
  Megaphone,
  Monitor,
  FileText,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AuditLogWithUser } from "@/types/database";
import { useAuditLogsList } from "@/hooks/use-supabase";

const actionConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  Create: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    icon: <FilePlus className="size-3" />,
  },
  Update: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    icon: <FileEdit className="size-3" />,
  },
  Delete: {
    bg: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
    icon: <Trash2 className="size-3" />,
  },
  Login: {
    bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
    icon: <LogIn className="size-3" />,
  },
  Logout: {
    bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
    icon: <LogOut className="size-3" />,
  },
  Export: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    icon: <Download className="size-3" />,
  },
  Import: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    icon: <Upload className="size-3" />,
  },
};

const resourceConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  Announcement: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    icon: <Megaphone className="size-3" />,
  },
  User: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    icon: <UserIcon className="size-3" />,
  },
  Users: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    icon: <Users className="size-3" />,
  },
  System: {
    bg: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
    icon: <Monitor className="size-3" />,
  },
  Report: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    icon: <FileText className="size-3" />,
  },
  Settings: {
    bg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
    icon: <Settings className="size-3" />,
  },
};

export default function AuditLogPage() {
  const { data, loading } = useAuditLogsList();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const filtered = useMemo(
    () => (actionFilter === "All" ? data : data.filter((e) => e.action === actionFilter)),
    [data, actionFilter]
  );

  const columns: ColumnDef<AuditLogWithUser>[] = useMemo(
    () => [
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => {
          const d = new Date(row.original.timestamp);
          return (
            <div className="text-sm">
              <p className="font-medium">
                {d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {d.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <UserIcon className="size-3.5 opacity-80" />
            </div>
            <span className="text-sm font-medium">{row.original.user?.name || "System"}</span>
          </div>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
          const aCfg = actionConfig[row.original.action] || {
            bg: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
            icon: <Shield className="size-3" />,
          };
          return (
            <span
              className={`inline-flex w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${aCfg.bg}`}
            >
              {aCfg.icon}
              <span className="truncate">{row.original.action}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "resource",
        header: "Resource",
        cell: ({ row }) => {
          const resCfg = resourceConfig[row.original.resource] || {
            bg: "bg-slate-500/10 text-slate-600 border border-slate-500/20",
            icon: <Shield className="size-3" />,
          };
          return (
            <span
              className={`inline-flex w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${resCfg.bg}`}
            >
              {resCfg.icon}
              <span className="truncate">{row.original.resource}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => {
          const details = row.original.details;
          if (!details) return <span className="text-muted-foreground italic">No details</span>;

          // 1. Handle JSON (e.g., {"name":"Ahmed Kamal","role":"Employee"})
          try {
            if (details.startsWith("{")) {
              const parsed = JSON.parse(details);
              if (parsed.name) {
                return (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{parsed.name}</span>
                    {parsed.role && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] font-normal opacity-80"
                      >
                        {parsed.role}
                      </Badge>
                    )}
                  </div>
                );
              }
            }
          } catch (e) {
            /* ignore and fallback to raw text */
          }

          // 2. Handle Deletion ID text (e.g., "Deleted user ID: 0fad...")
          if (details.includes("Deleted user ID:")) {
            return (
              <span className="text-red-600/80 font-medium">
                {details.replace("Deleted user ID:", "User deleted (ID:").concat(")")}
              </span>
            );
          }

          // 3. Already improved server logs (e.g., "Deleted user: Name")
          if (details.startsWith("Deleted user:")) {
            return <span className="text-red-700 font-semibold">{details}</span>;
          }

          return (
            <span className="max-w-[300px] truncate text-sm text-muted-foreground">{details}</span>
          );
        },
      },
      {
        accessorKey: "ip_address",
        header: "IP Address",
        cell: ({ row }) => {
          const ip = row.original.ip_address as string;
          if (!ip || ip === "N/A")
            return (
              <span className="text-muted-foreground flex items-center justify-center opacity-30">
                â€”
              </span>
            );

          const isLocal = ip === "::1" || ip === "127.0.0.1";

          return (
            <div className="flex items-center gap-1.5">
              {isLocal ? (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-500/20 lowercase">
                  localhost
                </span>
              ) : (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  {ip}
                </code>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const actionTypes = ["All", "Create", "Update", "Delete", "Login", "Logout", "Export", "Import"];

  const statsData = [
    {
      title: "Total Logs",
      value: data.length,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-500/5",
    },
    {
      title: "Logins",
      value: data.filter((e) => e.action === "Login").length,
      icon: LogIn,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-500/5",
    },
    {
      title: "Creates",
      value: data.filter((e) => e.action === "Create").length,
      icon: FilePlus,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-500/5",
    },
    {
      title: "Deletes",
      value: data.filter((e) => e.action === "Delete").length,
      icon: Trash2,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      gradientFrom: "from-red-500/20",
      gradientTo: "to-red-500/5",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Detailed logs of all system actions and user activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsData.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-50`}
            />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {actionTypes.map((action) => (
            <Button
              key={action}
              variant={actionFilter === action ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(action)}
              className="text-xs flex-1 sm:flex-none"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>{table.getFilteredRowModel().rows.length} log entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && !data.length ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center animate-pulse">
                      Loading live audit logs...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No log entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex-1 sm:flex-none"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
