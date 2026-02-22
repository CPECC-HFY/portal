"use client";
export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserFormValues } from "@/lib/schemas";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Users,
  User as UserIcon,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { type DbUser } from "@/types/database";
import { useUsersList } from "@/hooks/use-supabase";
import { RoleBadge } from "@/components/ui/role-badge";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { useTranslations } from "next-intl";

const userStatusConfig: Record<string, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
  Inactive: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20",
  Suspended:
    "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
};

const roles = ["Super Admin", "Admin", "Manager", "HR", "Employee"] as const;
const statuses = ["Active", "Inactive", "Suspended"] as const;

export default function ManageUsersPage() {
  const { data, loading } = useUsersList();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const t = useTranslations("Admin");
  const commonT = useTranslations("Common");

  // Edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [createdUserDetails, setCreatedUserDetails] = useState<{
    name: string;
    email: string;
    tempPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Deletion states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
  });

  const onCreateUser = async (formData: CreateUserFormValues) => {
    // Insert a row into the public.users table using the secure server action
    const { createAdminUser } = await import("@/app/actions/user-actions");

    // We cast role since the form data might not strictly match the DB enum type in TypeScript
    const result = await createAdminUser({
      name: formData.name,
      email: formData.email,
      role: (formData.role as any) || "Employee",
      department: formData.department || "General",
    });

    if (result.success && result.data) {
      setCreatedUserDetails({
        name: result.data.name,
        email: result.data.email,
        tempPassword: result.data.tempPassword,
      });
      setCopied(false);
      setDialogOpen(false);
      reset();
    } else {
      console.error("Failed to create user:", result.error);
      // Optionally, we could show an error toast here
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) reset();
  };

  const handleCloseSuccessDialog = () => {
    setCreatedUserDetails(null);
    setCopied(false);
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const { deleteAdminUser } = await import("@/app/actions/user-actions");
    const result = await deleteAdminUser(userToDelete.id);

    if (result.success) {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      // The user list should refresh automatically if using a real-time subscription or revalidation
      // For now, if it's local state, we'd need to update it.
      // Since this is a client component, the user might expect it to vanish.
    } else {
      console.error("Failed to delete user:", result.error);
    }
    setIsDeleting(false);
  };

  const handleEditOpen = (user: any) => {
    setEditUser(user);
    setEditName(user.name || "");
    setEditRole(user.role || "Employee");
    setEditDepartment(user.department || "");
    setEditStatus(user.status || "Active");
    setEditPhone(user.phone || "");
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        name: editName,
        role: editRole as any,
        department: editDepartment,
        status: editStatus as any,
        phone: editPhone,
      })
      .eq("id", editUser.id);

    if (!error) {
      await logAudit(
        "Update",
        "User",
        `Updated user: ${editName} (role: ${editRole}, status: ${editStatus})`
      );
      setEditDialogOpen(false);
      setEditUser(null);
    } else {
      console.error("Failed to update user:", error);
    }
    setEditSaving(false);
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", user.id);
    if (!error) {
      await logAudit(
        "Update",
        "User",
        `${newStatus === "Active" ? "Activated" : "Deactivated"} user: ${user.name}`
      );
    }
  };

  const columns: ColumnDef<DbUser>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: commonT("name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <UserIcon className="size-4 opacity-80" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: commonT("role"),
        cell: ({ row }) => <RoleBadge role={row.original.role} size="md" />,
      },
      {
        accessorKey: "department",
        header: commonT("department"),
      },
      {
        accessorKey: "status",
        header: commonT("status"),
        cell: ({ row }) => {
          const sCfg = userStatusConfig[row.original.status] || userStatusConfig.Inactive;
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
        accessorKey: "join_date",
        header: commonT("joinDate"),
        cell: ({ row }) => {
          const raw = row.original.join_date;
          if (!raw) return "";
          const d = new Date(raw);
          return isNaN(d.getTime())
            ? ""
            : d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
        },
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
                <Edit className="me-2 size-4" />
                {commonT("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(row.original)}>
                {row.original.status === "Active" ? (
                  <>
                    <UserX className="me-2 size-4" />
                    {t("inactive")}
                  </>
                ) : (
                  <>
                    <UserCheck className="me-2 size-4" />
                    {t("active")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDeleteClick(row.original)}
              >
                <Trash2 className="me-2 size-4" />
                {commonT("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
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

  const stats = {
    total: data.length,
    active: data.filter((u) => u.status === "Active").length,
    inactive: data.filter((u) => u.status === "Inactive").length,
    suspended: data.filter((u) => u.status === "Suspended").length,
  };

  const statsData = [
    {
      title: t("totalUsers"),
      value: stats.total,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-500/5",
    },
    {
      title: t("active"),
      value: stats.active,
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-500/5",
    },
    {
      title: t("inactive"),
      value: stats.inactive,
      icon: UserIcon,
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
      gradientFrom: "from-slate-500/20",
      gradientTo: "to-slate-500/5",
    },
    {
      title: t("suspended"),
      value: stats.suspended,
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      gradientFrom: "from-red-500/20",
      gradientTo: "to-red-500/5",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("manageUsers")}</h1>
          <p className="text-muted-foreground">{t("manageUsersDesc")}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="me-2 size-4" />
          {t("addUser")}
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
            <CardTitle>{t("userDirectory")}</CardTitle>
            <CardDescription>
              {t("usersFound", { count: table.getFilteredRowModel().rows.length })}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchUsers")}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="ps-9"
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
                      {t("loadingUsers")}
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
                      {commonT("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {commonT("page")} {table.getState().pagination.pageIndex + 1} {commonT("of")} {table.getPageCount()}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="me-1 size-4" />
                {commonT("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex-1 sm:flex-none"
              >
                {commonT("next")}
                <ChevronRight className="ms-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addNewUser")}</DialogTitle>
            <DialogDescription>
              {t("createUserDesc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-name">{t("fullName")}</Label>
                <Input
                  id="user-name"
                  placeholder={t("fullNamePlaceholder")}
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">{commonT("email")}</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-role">{commonT("role")}</Label>
                  <Input
                    id="user-role"
                    placeholder={t("rolePlaceholder")}
                    {...register("role")}
                    aria-invalid={!!errors.role}
                  />
                  {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-dept">{commonT("department")}</Label>
                  <Input
                    id="user-dept"
                    placeholder={t("deptPlaceholder")}
                    {...register("department")}
                    aria-invalid={!!errors.department}
                  />
                  {errors.department && (
                    <p className="text-xs text-destructive">{errors.department.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                {commonT("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? commonT("creating") : t("createUser")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditUser(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editUser")}</DialogTitle>
            <DialogDescription>
              {t("editUserDesc")}
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("fullName")}</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">{commonT("role")}</Label>
                  <select
                    id="edit-role"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">{commonT("status")}</Label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-department">{commonT("department")}</Label>
                <Input
                  id="edit-department"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">{commonT("phone")}</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditUser(null);
              }}
            >
              {commonT("cancel")}
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? commonT("saving") : commonT("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog for New User */}
      <Dialog
        open={!!createdUserDetails}
        onOpenChange={(open) => {
          if (!open) handleCloseSuccessDialog();
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </span>
              {t("userCreated")}
            </DialogTitle>
            <DialogDescription>
              {t("userCreatedDesc")}
            </DialogDescription>
          </DialogHeader>
          {createdUserDetails && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{commonT("email")}</Label>
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  <span>{createdUserDetails.email}</span>
                </div>
              </div>
              {createdUserDetails.tempPassword && (
                <div className="grid gap-2">
                  <Label>{t("yourPassword")}</Label>
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    <span className="font-mono tracking-wider">
                      {createdUserDetails.tempPassword}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("loginImmediately")}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="w-full"
              variant={copied ? "secondary" : "default"}
              onClick={() => {
                if (createdUserDetails?.tempPassword) {
                  navigator.clipboard.writeText(
                    `Email: ${createdUserDetails.email}\nPassword: ${createdUserDetails.tempPassword}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                  {commonT("copied")}
                </>
              ) : (
                t("copyCredentials")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              {t("confirmDeletion")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteConfirmDesc", { name: userToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {commonT("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? commonT("deleting") : t("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
