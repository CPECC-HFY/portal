"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/incompatible-library */

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
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  Pin,
  Megaphone,
  Users,
  Monitor,
  Landmark,
  ShieldAlert,
  CalendarDays,
  User as UserIcon,
  CheckCircle2,
  FileEdit,
  Clock,
  PlusCircle,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleBadge } from "@/components/ui/role-badge";
import { type AnnouncementWithAuthor } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type Announcement } from "@/lib/mock-data";
import { useAnnouncementsList, useUsersList, useUser, useGroups } from "@/hooks/use-supabase";
import { useAnnouncementCategories } from "@/hooks/use-announcement-categories";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import {
  notifyAllUsers,
  notifyMentions,
  notifyTargetedGroups,
} from "@/app/actions/notification-actions";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileUploader, type Attachment } from "@/components/ui/file-uploader";
import { Separator } from "@/components/ui/separator";
import { CategoryManager } from "@/components/announcements/category-manager";
import { cn, stripHtml } from "@/lib/utils";

function getDate(ann: any): string {
  const raw = ann.published_at || ann.publishedAt || ann.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const priorityConfig: Record<
  string,
  { badge: string; innerDot: string; outerDot: string; wrapper: string }
> = {
  Urgent: {
    badge:
      "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.2)]",
    outerDot: "bg-red-500 animate-ping opacity-75",
    innerDot: "bg-red-500",
    wrapper: "",
  },
  High: {
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_6px_rgba(245,158,11,0.2)]",
    outerDot: "bg-amber-500/40 animate-pulse",
    innerDot: "bg-amber-500",
    wrapper: "",
  },
  Medium: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/15",
    outerDot: "bg-blue-500/20",
    innerDot: "bg-blue-500",
    wrapper: "animate-[pulse_3s_ease-in-out_infinite]",
  },
  Low: {
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/15",
    outerDot: "bg-slate-400/20",
    innerDot: "bg-slate-400",
    wrapper: "animate-[pulse_5s_ease-in-out_infinite]",
  },
};

const DynamicCategoryIcon = ({ icon, className }: { icon: string; className?: string }) => {
  if (!icon) return <Megaphone className={className} />;

  if (icon.trim().startsWith("<svg")) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: icon }} />;
  }

  const Icon = (LucideIcons as any)[icon] || Megaphone;
  return <Icon className={className} />;
};

const announcementStatusConfig: Record<string, string> = {
  Published:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  Draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  Archived: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
};

export default function ManageAnnouncementsPage() {
  const { data, loading } = useAnnouncementsList();
  const { data: usersData } = useUsersList();
  const { user } = useUser();
  const { groups } = useGroups();
  const { categories, loading: categoriesLoading } = useAnnouncementCategories();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formPriority, setFormPriority] = useState("Low");
  const [formContent, setFormContent] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formTargetType, setFormTargetType] = useState<"All" | "Groups">("All");
  const [formTargetGroups, setFormTargetGroups] = useState<string[]>([]);
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

  // Edit states
  const [editAnn, setEditAnn] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editPriority, setEditPriority] = useState("Low");
  const [editPinned, setEditPinned] = useState(false);
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Preview state
  const [previewAnn, setPreviewAnn] = useState<any>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setFormContent(val);
    setCursorPosition(pos);

    // Check for @mention
    const lastWord = val.slice(0, pos).split(/\s/).pop();
    if (lastWord?.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (userName: string) => {
    const val = formContent;
    const pos = cursorPosition;
    const beforeMention = val.slice(0, pos).replace(/@[^\s]*$/, ""); // remove the typing @name
    const newText = beforeMention + "@" + userName + " " + val.slice(pos);
    setFormContent(newText);
    setMentionQuery(null);
  };

  const filteredUsers =
    mentionQuery !== null
      ? usersData.filter((u: any) => u.name.toLowerCase().includes(mentionQuery))
      : [];

  const handlePublish = async (status: "Draft" | "Published") => {
    if (!user || !formTitle || !formContent) return;

    const { data: insertedData, error } = await supabase
      .from("announcements")
      .insert({
        title: formTitle,
        content: formContent,
        excerpt:
          formContent.replace(/\n/g, " ").substring(0, 120).trim() +
          (formContent.length > 120 ? "..." : ""),
        category: formCategory as any,
        priority: formPriority as any,
        status: status as any,
        pinned: formPinned,
        author_id: user.id,
        target_type: formTargetType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return;
    }

    if (insertedData) {
      // Check for group targeting
      if (formTargetType === "Groups" && formTargetGroups.length > 0) {
        const { error: targetError } = await supabase.from("announcement_targets").insert(
          formTargetGroups.map((groupId) => ({
            announcement_id: insertedData.id,
            group_id: groupId,
          }))
        );
        if (targetError) console.error("Error adding targeting:", targetError);
      }

      // 1. Audit log
      await logAudit(
        "Create",
        "Announcement",
        `${status === "Published" ? "Published" : "Drafted"}: ${formTitle}`
      );

      // 2. Notifications (Only if Published)
      if (formTargetType === "All") {
        // Broadcast to all users
        await notifyAllUsers(
          `New Announcement: ${formTitle}`,
          formContent.substring(0, 50) + "...",
          "/announcements"
        );
      } else if (formTargetType === "Groups" && formTargetGroups.length > 0) {
        // Notify specific groups
        await notifyTargetedGroups(
          formTargetGroups,
          `New Group Announcement: ${formTitle}`,
          formContent.substring(0, 50) + "...",
          "/announcements"
        );
      }

      // Specific mentions notification (if any)
      await notifyMentions(
        formContent,
        `You were mentioned in an announcement`,
        formTitle,
        "/announcements"
      );

      // 3. Attachments
      if (formAttachments.length > 0) {
        const { error: attachError } = await (supabase as any)
          .from("announcement_attachments")
          .insert(
            formAttachments.map((att) => ({
              announcement_id: insertedData.id,
              file_name: att.file_name,
              file_type: att.file_type,
              file_size: att.file_size,
              file_path: att.file_path,
            }))
          );
        if (attachError) console.error("Error adding attachments:", attachError);
      }
    }

    // Reset and close
    setFormTitle("");
    setFormContent("");
    setFormCategory("General");
    setFormPriority("Low");
    setFormPinned(false);
    setFormTargetType("All");
    setFormTargetGroups([]);
    setFormAttachments([]);
    setDialogOpen(false);
  };

  // ── Edit handler ──
  const handleEditOpen = async (ann: any) => {
    setEditAnn(ann);
    setEditTitle(ann.title || "");
    setEditContent(ann.content || "");
    setEditCategory(ann.category || "General");
    setEditPriority(ann.priority || "Low");
    setEditPinned(ann.pinned || false);

    // Fetch existing attachments
    const { data: attachments, error } = await (supabase as any)
      .from("announcement_attachments")
      .select("*")
      .eq("announcement_id", ann.id);

    if (!error && attachments) {
      setEditAttachments(attachments);
    } else {
      setEditAttachments([]);
    }

    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editAnn) return;
    setEditSaving(true);

    // 1. Update main announcement
    const { error } = await supabase
      .from("announcements")
      .update({
        title: editTitle,
        content: editContent,
        excerpt:
          stripHtml(editContent).substring(0, 120).trim() + (editContent.length > 120 ? "..." : ""),
        category: editCategory as any,
        priority: editPriority as any,
        pinned: editPinned,
      })
      .eq("id", editAnn.id);

    if (error) {
      console.error("Failed to update announcement:", error);
      setEditSaving(false);
      return;
    }

    // 2. Sync attachments (Simple approach: delete all and re-insert)
    // Note: Real storage files are kept if they aren't explicitly deleted,
    // but here we just manage the DB records.
    await (supabase as any)
      .from("announcement_attachments")
      .delete()
      .eq("announcement_id", editAnn.id);

    if (editAttachments.length > 0) {
      const { error: attachError } = await (supabase as any)
        .from("announcement_attachments")
        .insert(
          editAttachments.map((att) => ({
            announcement_id: editAnn.id,
            file_name: att.file_name,
            file_type: att.file_type,
            file_size: att.file_size,
            file_path: att.file_path,
          }))
        );
      if (attachError) console.error("Error updating attachments:", attachError);
    }

    await logAudit("Update", "Announcement", `Edited: ${editTitle}`);
    setEditDialogOpen(false);
    setEditAnn(null);
    setEditSaving(false);
  };

  // ── Archive handler ──
  const handleArchive = async (ann: any) => {
    const { error } = await supabase.rpc("archive_announcement", { p_announcement_id: ann.id });
    if (!error) {
      await logAudit("Update", "Announcement", `Archived: ${ann.title}`);
    } else {
      console.error("Failed to archive:", error);
    }
  };

  // ── Delete handler ──
  const handleDelete = async (ann: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${ann.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    const { error } = await supabase.from("announcements").delete().eq("id", ann.id);
    if (!error) {
      await logAudit("Delete", "Announcement", `Deleted: ${ann.title}`);
    } else {
      console.error("Failed to delete:", error);
    }
  };

  const columns: ColumnDef<AnnouncementWithAuthor>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.pinned && <Pin className="size-3 rotate-45 text-primary" />}
            <span className="max-w-[250px] truncate font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <UserIcon className="size-3.5 opacity-80" />
            </div>
            <span className="text-sm">{row.original.author?.name || "Unknown"}</span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = categories.find((c) => c.name === row.original.category);
          const bg = cat
            ? cat.color
            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
          const iconValue = cat ? cat.icon : "Megaphone";

          return (
            <span
              className={`inline-flex w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${bg}`}
            >
              <DynamicCategoryIcon icon={iconValue} className="size-3" />
              <span className="truncate">{row.original.category}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const pCfg = priorityConfig[row.original.priority] || priorityConfig.Low;
          return (
            <span
              className={`inline-flex w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${pCfg.badge}`}
            >
              <span className={`relative flex size-2 items-center justify-center ${pCfg.wrapper}`}>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${pCfg.outerDot}`}
                ></span>
                <span
                  className={`relative inline-flex size-1.5 rounded-full ${pCfg.innerDot}`}
                ></span>
              </span>
              <span className="truncate">{row.original.priority}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const sCfg =
            announcementStatusConfig[row.original.status] || announcementStatusConfig.Archived;
          return (
            <span
              className={`inline-flex w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${sCfg}`}
            >
              <span className="truncate">{row.original.status}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "views",
        header: "Views",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="size-3" />
            {row.original.views.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "publishedAt",
        header: "Date",
        cell: ({ row }) => getDate(row.original),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditOpen(row.original)}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPreviewAnn(row.original)}>
                <Eye className="mr-2 size-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchive(row.original)}>
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(row.original)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [categories]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const statsData = [
    {
      title: "Total Announcements",
      value: data.length,
      icon: Megaphone,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-500/5",
    },
    {
      title: "Published",
      value: data.filter((a) => a.status === "Published").length,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-500/5",
    },
    {
      title: "Drafts",
      value: data.filter((a) => a.status === "Draft").length,
      icon: FileEdit,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradientFrom: "from-amber-500/20",
      gradientTo: "to-amber-500/5",
    },
    {
      title: "Total Views",
      value: data.reduce((sum, a) => sum + a.views, 0).toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-500/5",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Announcements</h1>
          <p className="text-muted-foreground">Create, edit, and manage all announcements.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" />
          New Announcement
        </Button>
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

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle>All Announcements</CardTitle>
            <CardDescription>
              {table.getFilteredRowModel().rows.length} announcement(s)
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
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
                      Loading live announcements...
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
                      No results found.
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

      {/* New Announcement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <span className="bg-primary/20 p-2 rounded-lg text-primary">
                  <Megaphone className="size-5" />
                </span>
                Create New Announcement
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm">
                Compose a new message to broadcast across the employee portal.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="title"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="E.g., Quarterly All-Hands Meeting"
                  className="text-lg font-medium border-muted-foreground/20 focus-visible:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="category"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Category
                  </Label>
                  <div className="flex gap-2">
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setCategoryManagerOpen(true)}
                      title="Manage Categories"
                    >
                      <PlusCircle className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="priority"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Priority
                  </Label>
                  <select
                    id="priority"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2 pt-2">
                <Label
                  htmlFor="content"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Full Content
                </Label>
                <RichTextEditor
                  content={formContent}
                  onChange={setFormContent}
                  placeholder="Write the full details of your announcement here..."
                />
              </div>

              <FileUploader attachments={formAttachments} onChange={setFormAttachments} />

              <div className="grid gap-4 p-4 rounded-lg border border-border/50 bg-muted/10">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Target Audience
                  </Label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="targetType"
                        checked={formTargetType === "All"}
                        onChange={() => setFormTargetType("All")}
                        className="accent-primary size-4"
                      />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        All Users
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="targetType"
                        checked={formTargetType === "Groups"}
                        onChange={() => setFormTargetType("Groups")}
                        className="accent-primary size-4"
                      />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        Specific Groups
                      </span>
                    </label>
                  </div>
                </div>

                {formTargetType === "Groups" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Select Groups
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((group) => (
                        <Badge
                          key={group.id}
                          variant={formTargetGroups.includes(group.id) ? "default" : "outline"}
                          className="cursor-pointer hover:opacity-80 transition-all border-primary/20"
                          onClick={() => {
                            setFormTargetGroups((prev) =>
                              prev.includes(group.id)
                                ? prev.filter((id) => id !== group.id)
                                : [...prev, group.id]
                            );
                          }}
                        >
                          {group.name}
                        </Badge>
                      ))}
                      {groups.length === 0 && (
                        <p className="text-xs text-destructive italic">
                          No groups found. Create groups first.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Pin to Dashboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep this announcement pinned to the top of the feed.
                  </p>
                </div>
                <Switch checked={formPinned} onCheckedChange={setFormPinned} />
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 bg-muted/10 p-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handlePublish("Draft")}>
                Save Draft
              </Button>
              <Button onClick={() => handlePublish("Published")} className="gap-2">
                <CheckCircle2 className="size-4" /> Publish Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Announcement Dialog ── */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditAnn(null);
        }}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <span className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                  <Edit className="size-5" />
                </span>
                Edit Announcement
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm">
                Update the announcement details. Changes are saved to the database.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label
                htmlFor="edit-title"
                className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Title
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-medium border-muted-foreground/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-category"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Category
                </Label>
                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="General">General</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Finance">Finance</option>
                  <option value="Safety">Safety</option>
                  <option value="Events">Events</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-priority"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Priority
                </Label>
                <select
                  id="edit-priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="edit-content"
                className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Content
              </Label>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Update the announcement details..."
              />
            </div>

            <FileUploader attachments={editAttachments} onChange={setEditAttachments} />

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Pin to Dashboard</Label>
                <p className="text-sm text-muted-foreground">
                  Keep this announcement pinned to the top.
                </p>
              </div>
              <Switch checked={editPinned} onCheckedChange={setEditPinned} />
            </div>
          </div>
          <div className="border-t border-border/50 bg-muted/10 p-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditAnn(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Announcement Dialog ── */}
      <Dialog open={!!previewAnn} onOpenChange={(open) => !open && setPreviewAnn(null)}>
        <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden outline-none border-none shadow-2xl rounded-2xl">
          {previewAnn &&
            (() => {
              const pConfig = priorityConfig[previewAnn.priority] || priorityConfig.Low;
              const cat = categories.find((c) => c.name === previewAnn.category);
              const cBg = cat
                ? cat.color
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
              const cIcon = cat ? cat.icon : "Megaphone";
              const readingTime = Math.max(
                1,
                Math.ceil((previewAnn.content || "").split(/\s+/).length / 200)
              );
              return (
                <>
                  {/* Header Section */}
                  <div className="p-8 pb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${cBg}`}
                      >
                        <DynamicCategoryIcon icon={cIcon} className="size-3" />
                        {previewAnn.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${pConfig.badge}`}
                      >
                        <span
                          className={`relative flex size-2 items-center justify-center ${pConfig.wrapper}`}
                        >
                          <span
                            className={`absolute inline-flex h-full w-full rounded-full ${pConfig.outerDot}`}
                          ></span>
                          <span
                            className={`relative inline-flex size-1.5 rounded-full ${pConfig.innerDot}`}
                          ></span>
                        </span>
                        {previewAnn.priority}
                      </span>
                      {previewAnn.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          📌 Pinned
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Clock className="size-3.5" />
                        {readingTime} MIN READ
                      </span>
                    </div>

                    <DialogHeader className="text-left space-y-4">
                      <DialogTitle className="text-3xl font-black leading-[1.1] tracking-tight decoration-primary/30 decoration-4 underline-offset-8">
                        {previewAnn.title}
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-4 py-4 border-y border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5">
                            <UserIcon className="size-5 text-primary/70" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold leading-none">
                              {previewAnn.author?.name || "Unknown"}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium mt-1">
                              {previewAnn.author?.role || "Employee"}
                            </span>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-border/50 hidden sm:block" />
                        <div className="flex items-center gap-6 ml-auto sm:ml-0">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">
                              Date Created
                            </span>
                            <span className="text-xs font-semibold tabular-nums">
                              {getDate(previewAnn)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">
                              Stats
                            </span>
                            <span className="text-xs font-semibold tabular-nums flex items-center gap-1">
                              <Eye className="size-3 text-primary/60" />
                              {previewAnn.views || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>
                  {/* Main Content and Sidebar */}
                  <div className="px-8 pb-8">
                    <ScrollArea className="max-h-[55vh]">
                      <div className="grid gap-10 lg:grid-cols-[1fr_220px]">
                        <div className="space-y-10">
                          {/* Rich Text Editor Content Integration */}
                          <article className="prose prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-a:text-primary prose-strong:text-foreground">
                            <div
                              className="preview-content"
                              dangerouslySetInnerHTML={{ __html: previewAnn.content }}
                            />
                          </article>

                          <Separator className="bg-border/40" />

                          <div className="p-12 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10 opacity-60">
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                              Comments Section (Client View Only)
                            </p>
                          </div>
                        </div>

                        {/* Sidebar for Attachments */}
                        <aside className="space-y-8">
                          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">
                              Editor Preview
                            </p>
                            <p className="text-xs font-semibold">
                              Attachments are managed in the edit dialog.
                            </p>
                          </div>
                        </aside>
                      </div>
                    </ScrollArea>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onCategoryCreated={(name) => {
          setFormCategory(name);
          setEditCategory(name);
        }}
      />
    </div>
  );
}
