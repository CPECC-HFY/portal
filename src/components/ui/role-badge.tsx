"use client";

import { Crown, ShieldCheck, User, Briefcase, Heart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ────────────────────────────────────────────
   Role Definitions
   ──────────────────────────────────────────── */

type RoleName = "Super Admin" | "Admin" | "Manager" | "HR" | "Employee";

interface RoleStyle {
  badge: string;
  Icon: LucideIcon;
}

const roleStyles: Record<RoleName, RoleStyle> = {
  "Super Admin": {
    badge:
      "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-violet-500/25 ring-violet-500/10",
    Icon: Crown,
  },
  Admin: {
    badge: "bg-blue-500/12 text-blue-700 dark:text-blue-400 border-blue-500/25 ring-blue-500/10",
    Icon: ShieldCheck,
  },
  Manager: {
    badge:
      "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25 ring-amber-500/10",
    Icon: Briefcase,
  },
  HR: {
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 ring-emerald-500/10",
    Icon: Heart,
  },
  Employee: {
    badge: "bg-slate-500/8 text-slate-600 dark:text-slate-400 border-slate-500/15 ring-slate-500/5",
    Icon: User,
  },
};

const fallbackRole: RoleStyle = roleStyles.Employee;

/* ────────────────────────────────────────────
   Badge Variants
   ──────────────────────────────────────────── */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 border font-medium transition-colors select-none",
  {
    variants: {
      size: {
        xs: "rounded px-1.5 py-px text-[9px] tracking-wider uppercase",
        sm: "rounded-md px-2 py-0.5 text-[10px] tracking-wide uppercase",
        md: "rounded-full px-2.5 py-1 text-[11px]",
        lg: "rounded-full px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

const iconSizeMap: Record<NonNullable<VariantProps<typeof badgeVariants>["size"]>, string> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-3.5",
  lg: "size-3.5",
};

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

interface RoleBadgeProps extends VariantProps<typeof badgeVariants> {
  role: string;
  showIcon?: boolean;
  className?: string;
}

import { useTranslations } from "next-intl";

export function RoleBadge({ role, size = "sm", showIcon = true, className }: RoleBadgeProps) {
  const t = useTranslations("Roles");
  const config = roleStyles[role as RoleName] ?? fallbackRole;
  const { Icon } = config;
  const resolvedSize = size ?? "sm";
  const isUppercase = resolvedSize === "xs" || resolvedSize === "sm";

  const translatedRole = t(role.toLowerCase());

  return (
    <span className={cn(badgeVariants({ size }), config.badge, className)}>
      {showIcon && <Icon className={cn("shrink-0", iconSizeMap[resolvedSize])} />}
      <span className="truncate leading-none">
        {isUppercase ? translatedRole.toUpperCase() : translatedRole}
      </span>
    </span>
  );
}

/* ────────────────────────────────────────────
   Exports
   ──────────────────────────────────────────── */

export { roleStyles, type RoleName };
