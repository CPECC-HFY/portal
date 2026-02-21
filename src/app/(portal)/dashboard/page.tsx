"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {
  Megaphone,
  Users,
  Bell,
  Building2,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  ArrowUpRight,
  Activity,
  BarChart3,
  CalendarDays,
  Sparkles,
  User,
  Monitor,
  Landmark,
  ShieldAlert,
  Settings,
  Pin,
  Share2,
  Bookmark,
  Paperclip,
  Download,
  FileText,
  Megaphone as MegaphoneIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useDashboardData,
  useUser,
  useNotificationsList,
  useUserProfile,
  useAnnouncementAttachments,
} from "@/hooks/use-supabase";
import { useAnnouncementCategories } from "@/hooks/use-announcement-categories";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleBadge } from "@/components/ui/role-badge";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { AnnouncementComments } from "@/components/announcements/announcement-comments";

const priorityConfig: Record<
  string,
  { border: string; badge: string; innerDot: string; outerDot: string; wrapper: string }
> = {
  Urgent: {
    border: "border-l-red-500",
    badge:
      "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.2)]",
    outerDot: "bg-red-500 animate-ping opacity-75",
    innerDot: "bg-red-500",
    wrapper: "",
  },
  High: {
    border: "border-l-amber-500",
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_6px_rgba(245,158,11,0.2)]",
    outerDot: "bg-amber-500/40 animate-pulse",
    innerDot: "bg-amber-500",
    wrapper: "",
  },
  Medium: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/15",
    outerDot: "bg-blue-500/20",
    innerDot: "bg-blue-500",
    wrapper: "animate-[pulse_3s_ease-in-out_infinite]",
  },
  Low: {
    border: "border-l-slate-400",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/15",
    outerDot: "bg-slate-400/20",
    innerDot: "bg-slate-400",
    wrapper: "animate-[pulse_5s_ease-in-out_infinite]",
  },
};

const DynamicCategoryIcon = ({ icon, className }: { icon: string; className?: string }) => {
  if (!icon) return <MegaphoneIcon className={className} />;

  if (icon.trim().startsWith("<svg")) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: icon }} />;
  }

  const Icon = (LucideIcons as any)[icon] || MegaphoneIcon;
  return <Icon className={className} />;
};

function getDate(ann: any): string {
  const raw = ann.published_at || ann.publishedAt || ann.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDateLong(ann: any): string {
  const raw = ann.published_at || ann.publishedAt || ann.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

export default function DashboardPage() {
  const [selectedAnn, setSelectedAnn] = useState<any>(null);
  const { user, loading: authLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const { unreadCount } = useNotificationsList(user?.id);
  const { categories } = useAnnouncementCategories();
  const {
    stats: dashboardStats,
    recentActivity,
    announcements,
    departmentDistribution,
    categoryBreakdown,
    weeklyActivity,
    sparklines,
    loading: dashboardLoading,
  } = useDashboardData();

  const isEmployee = profile?.role === "Employee";

  const handleOpenAnn = async (ann: any) => {
    setSelectedAnn(ann);
    try {
      await supabase.rpc("increment_announcement_views", { p_announcement_id: ann.id });
      await logAudit("View", "Announcement", `Viewed: ${ann.title}`);
    } catch (e) {
      console.error("Failed to increment views", e);
    }
  };

  if (dashboardLoading || profileLoading || authLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse flex items-center justify-center h-full">
        Loading live dashboard data...
      </div>
    );
  }

  const stats = [
    {
      title: "Total Announcements",
      value: dashboardStats.totalAnnouncements || announcements.length,
      change: `+${dashboardStats.announcementsThisWeek} this week`,
      trend: "up" as const,
      icon: Megaphone,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-500/5",
      adminOnly: false,
      sparkData: sparklines.announcements,
    },
    {
      title: "Active Users",
      value: dashboardStats.activeUsers,
      change: `${dashboardStats.recentLoginsToday} active today`,
      trend: "up" as const,
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-500/5",
      adminOnly: true,
      sparkData: sparklines.users,
    },
    {
      title: "Unread Notifications",
      value: unreadCount,
      change: `${unreadCount} unread`,
      trend: unreadCount > 0 ? ("up" as const) : ("down" as const),
      icon: Bell,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradientFrom: "from-amber-500/20",
      gradientTo: "to-amber-500/5",
      adminOnly: false,
      sparkData: sparklines.notifications,
    },
    {
      title: "Employee Engagement",
      value: dashboardStats.departments,
      change: `76.4% engagement`,
      trend: "up" as const,
      icon: Building2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-500/5",
      adminOnly: true,
      sparkData: sparklines.activity,
    },
  ].filter((s) => !isEmployee || !s.adminOnly);

  const recentAnnouncements = announcements.filter((a) => a.status === "Published").slice(0, 4);

  const totalEmployees = departmentDistribution.reduce((acc, d) => acc + d.employees, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="size-3" />
              Live
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your portal overview for{" "}
            <span className="font-medium text-foreground">February 2026</span>
          </p>
        </div>
        {!isEmployee && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">
                <BarChart3 className="mr-2 size-4" />
                Full Analytics
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/announcements">
                <Megaphone className="mr-2 size-4" />
                New Announcement
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid with Sparklines */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          isEmployee ? "lg:grid-cols-2" : "lg:grid-cols-4"
        )}
      >
        {stats.map((stat, index) => (
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
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      stat.trend === "up" ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {stat.change}
                  </p>
                </div>
                {/* Mini sparkline */}
                <div className="h-10 w-20">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={stat.sparkData}>
                      <defs>
                        <linearGradient id={`sparkGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="currentColor"
                        fill={`url(#sparkGrad-${index})`}
                        strokeWidth={1.5}
                        className={stat.color}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Row */}
      {!isEmployee && (
        <div className="grid gap-6 lg:grid-cols-10">
          {/* Weekly Activity Chart - Takes more space */}
          {/* Weekly Activity Chart - Takes more space */}
          <Card className="lg:col-span-4">
            <Tabs defaultValue="bar" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="size-4 text-primary" />
                      Weekly Activity
                    </CardTitle>
                    <CardDescription>
                      Logins, announcements, and tasks completed this week
                    </CardDescription>
                  </div>
                  <TabsList className="h-8">
                    <TabsTrigger value="bar" className="px-2 text-xs">
                      Bar
                    </TabsTrigger>
                    <TabsTrigger value="line" className="px-2 text-xs">
                      Line
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <TabsContent value="bar" className="h-[300px] mt-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={weeklyActivity} barCategoryGap="20%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          className="text-xs"
                          tick={{ fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                        <Bar
                          dataKey="logins"
                          name="Logins"
                          fill="oklch(0.615 0.21 270)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="tasks"
                          name="Tasks"
                          fill="oklch(0.6 0.2 145)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="line" className="h-[300px] mt-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <LineChart data={weeklyActivity}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          className="text-xs"
                          tick={{ fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                        <Line
                          type="monotone"
                          dataKey="logins"
                          name="Logins"
                          stroke="oklch(0.615 0.21 270)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="tasks"
                          name="Tasks"
                          stroke="oklch(0.6 0.2 145)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </div>
              </CardContent>
            </Tabs>
          </Card>

          {/* Department Distribution (Pie Chart) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Team Distribution
              </CardTitle>
              <CardDescription>
                Employees across {dashboardStats.departments} departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={departmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="employees"
                      strokeWidth={0}
                    >
                      {departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value} employees`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {departmentDistribution.slice(0, 6).map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: dept.color,
                        }}
                      />
                      <span className="text-muted-foreground">{dept.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {Math.round((dept.employees / totalEmployees) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                By Category
              </CardTitle>
              <CardDescription>Announcement distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => {
                  const colors: Record<string, string> = {
                    General: "bg-blue-500",
                    HR: "bg-emerald-500",
                    IT: "bg-purple-500",
                    Finance: "bg-amber-500",
                    Safety: "bg-orange-500",
                    Events: "bg-pink-500",
                  };
                  return (
                    <div key={cat.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cat.category}</span>
                        <span className="font-medium tabular-nums">
                          {cat.count}{" "}
                          <span className="text-xs text-muted-foreground">({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${colors[cat.category] || "bg-primary"} transition-all duration-700`}
                          style={{
                            width: `${cat.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity + Recent Announcements */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Activity Timeline */}
        {!isEmployee && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>What&apos;s happening across the portal</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity
                  .filter(
                    (activity) => !activity.details?.includes("New user registered via auth signup")
                  )
                  .slice(0, 5)
                  .map((activity) => (
                    <div key={activity.id} className="relative pl-6 pb-4 last:pb-0">
                      {/* Vertical Line */}
                      <div className="absolute left-[11px] top-7 bottom-0 w-[1px] bg-slate-200 dark:bg-slate-800 last:hidden" />

                      <div className="absolute left-0 top-1">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/5 text-primary">
                          <div className="size-2 rounded-full bg-current" />
                        </div>
                      </div>

                      <div className="text-sm leading-relaxed">
                        {activity.details &&
                        activity.action === "Create" &&
                        activity.target === "User" ? (
                          (() => {
                            let targetName = activity.details;
                            let targetRole = "Employee";
                            try {
                              const parsed = JSON.parse(activity.details);
                              targetName = parsed.name;
                              targetRole = parsed.role;
                            } catch (e) {
                              targetName = activity.details.replace(/^new account - /, "");
                            }

                            return (
                              <>
                                <span className="text-foreground font-semibold">{targetName}</span>
                                <span className="ml-2 inline-flex align-baseline mr-1.5">
                                  <RoleBadge role={targetRole} size="sm" />
                                </span>
                                <span className="text-muted-foreground mr-1.5">
                                  account created successfully by
                                </span>
                                <span className="font-bold text-primary mr-2">
                                  {activity.user === "System" ? "Murtadha Hassan" : activity.user}
                                </span>
                                <span className="inline-flex align-baseline">
                                  <RoleBadge
                                    role={activity.user === "System" ? "Admin" : activity.role}
                                    size="sm"
                                  />
                                </span>
                              </>
                            );
                          })()
                        ) : (
                          <>
                            <span className="font-medium text-foreground">{activity.user}</span>{" "}
                            <span className="text-muted-foreground lowercase">
                              {activity.action}d
                            </span>{" "}
                            <span className="font-medium text-foreground">{activity.target}</span>
                            {activity.details && (
                              <span className="ml-1 text-muted-foreground">
                                ({activity.details})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Announcements */}
        <Card className={cn("flex flex-col", isEmployee ? "lg:col-span-5" : "lg:col-span-3")}>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <MegaphoneIcon className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Announcements</CardTitle>
                <CardDescription className="text-xs">
                  {recentAnnouncements.length} published updates
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/announcements">
                View All
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border">
              {recentAnnouncements.map((ann) => {
                const config = priorityConfig[ann.priority] || priorityConfig.Low;
                const cat = categories.find((c) => c.name === ann.category);
                const cBg = cat
                  ? cat.color
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
                const cIcon = cat ? cat.icon : "Megaphone";

                return (
                  <div
                    key={ann.id}
                    onClick={() => handleOpenAnn(ann)}
                    className={`group relative cursor-pointer border-l-[3px] ${config.border} transition-colors hover:bg-muted/30`}
                  >
                    <div className="flex items-start gap-3 px-5 py-4">
                      {/* Avatar */}
                      <div className="relative mt-0.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                          <User className="size-4 opacity-80" />
                        </div>
                        {ann.pinned && (
                          <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-100 text-[8px] dark:bg-amber-900/50">
                            📌
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h4 className="text-sm font-semibold transition-colors group-hover:text-primary">
                                {ann.title}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${cBg}`}
                              >
                                <DynamicCategoryIcon icon={cIcon} className="size-2.5" />
                                {ann.category}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${config.badge}`}
                              >
                                <span
                                  className={`relative flex size-1.5 items-center justify-center ${config.wrapper}`}
                                >
                                  <span
                                    className={`absolute inline-flex h-full w-full rounded-full ${config.outerDot}`}
                                  ></span>
                                  <span
                                    className={`relative inline-flex size-1.5 rounded-full ${config.innerDot}`}
                                  ></span>
                                </span>
                                {ann.priority}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground leading-relaxed">
                              {stripHtml(ann.content || "")
                                .substring(0, 100)
                                .trim()}
                              {stripHtml(ann.content || "").length > 100 ? "..." : ""}
                            </p>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            by{" "}
                            <span className="font-medium text-foreground/80">
                              {ann.author?.name || "Unknown"}
                            </span>
                            <RoleBadge role={ann.author?.role || "Employee"} size="sm" />
                          </span>
                          <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 tabular-nums">
                              <Eye className="size-3" />
                              {ann.views}
                            </span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <Clock className="size-3" />
                              {getDate(ann)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/announcements">
                <Megaphone className="mr-2 size-4" />
                New Announcement
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/notifications">
                <Bell className="mr-2 size-4" />
                Notifications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">
                <User className="mr-2 size-4" />
                My Profile
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Reading Overlay — Professional Clean */}
      <Dialog open={!!selectedAnn} onOpenChange={(open) => !open && setSelectedAnn(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl gap-0 p-0 overflow-hidden outline-none border border-border/40 shadow-2xl rounded-3xl bg-background/95 backdrop-blur-xl [&>button]:hidden">
          {selectedAnn &&
            (() => {
              const config = priorityConfig[selectedAnn.priority] || priorityConfig.Low;
              const cat = categories.find((c) => c.name === selectedAnn.category);
              const cBg = cat
                ? cat.color
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
              const cIcon = cat ? cat.icon : "Megaphone";
              const readingTime = Math.max(
                1,
                Math.ceil((selectedAnn.content || "").split(/\s+/).length / 200)
              );
              const formattedDate = getDateLong(selectedAnn);
              const viewCount = (selectedAnn.views || 0) + 1;

              return (
                <>
                  {/* Header */}
                  <div className="relative px-6 sm:px-10 pt-8 pb-6">
                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cBg} ring-1 ring-black/[0.04] dark:ring-white/[0.06]`}
                      >
                        <DynamicCategoryIcon icon={cIcon} className="size-3" />
                        {selectedAnn.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${config.badge} ring-1 ring-black/[0.04] dark:ring-white/[0.06]`}
                      >
                        <span className={`relative flex size-1.5 ${config.wrapper}`}>
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${config.outerDot}`}
                          />
                          <span
                            className={`relative inline-flex size-1.5 rounded-full ${config.innerDot}`}
                          />
                        </span>
                        {selectedAnn.priority}
                      </span>
                      {selectedAnn.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20">
                          <Pin className="size-3" />
                          Pinned
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <DialogHeader className="text-left space-y-0 mb-6">
                      <DialogTitle className="text-xl sm:text-2xl lg:text-[28px] font-extrabold leading-[1.15] tracking-tight text-foreground">
                        {selectedAnn.title}
                      </DialogTitle>
                    </DialogHeader>

                    {/* Author & Meta Bar */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/40 px-5 py-4">
                      {/* Author */}
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                          <User className="size-4 text-primary" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold leading-none text-foreground">
                            {selectedAnn.author?.name || "Unknown"}
                          </span>
                          <span className="mt-0.5">
                            <RoleBadge role={selectedAnn.author?.role || "Employee"} size="sm" />
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-border/60" />

                      {/* Date */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span className="text-xs font-medium tabular-nums">{formattedDate}</span>
                      </div>

                      <div className="hidden sm:block h-6 w-px bg-border/60" />

                      {/* Views */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="size-3.5 shrink-0" />
                        <span className="text-xs font-medium tabular-nums">
                          {viewCount.toLocaleString()} {viewCount === 1 ? "view" : "views"}
                        </span>
                      </div>

                      {/* Reading Time */}
                      <div className="flex items-center gap-2 text-muted-foreground sm:ml-auto">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="text-xs font-medium">{readingTime} min read</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-6 sm:mx-10">
                    <Separator className="bg-border/30" />
                  </div>

                  {/* Scrollable Body */}
                  <ScrollArea className="max-h-[55vh]">
                    <div className="px-6 sm:px-10 py-8">
                      <div className="grid gap-10 lg:grid-cols-[1fr_200px]">
                        {/* Main Content Column */}
                        <div className="space-y-8 min-w-0">
                          {/* Article Content */}
                          <article
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                                prose-p:leading-[1.8] prose-p:text-muted-foreground
                                prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
                                prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
                                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-foreground prose-strong:font-semibold
                                prose-ul:my-4 prose-li:text-muted-foreground prose-li:leading-relaxed
                                prose-blockquote:border-l-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
                                prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                                prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-border/30
                                prose-hr:border-border/30"
                          >
                            <div
                              className="rich-content"
                              dangerouslySetInnerHTML={{ __html: selectedAnn.content }}
                            />
                          </article>

                          {/* Comments Section */}
                          <div className="pt-2">
                            <Separator className="bg-border/30 mb-8" />
                            <AnnouncementComments announcementId={selectedAnn.id} />
                          </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="space-y-6 lg:border-l lg:border-border/30 lg:pl-8">
                          <AttachmentsList announcementId={selectedAnn.id} />
                        </aside>
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Footer Actions */}
                  <div className="border-t border-border/30 bg-muted/20 px-6 sm:px-10 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-medium px-4"
                        >
                          Close
                        </Button>
                      </DialogClose>
                    </div>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachmentsList({ announcementId }: { announcementId: string }) {
  const { attachments, loading } = useAnnouncementAttachments(announcementId);

  if (loading) return null;
  if (attachments.length === 0) return null;

  const handleDownload = async (file: any) => {
    const { data, error } = await supabase.storage.from("announcements").download(file.file_path);

    if (error) {
      console.error("Download error:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
        <Paperclip className="size-3.5" />
        Attachments
      </h4>
      <div className="grid gap-3">
        {attachments.map((file) => (
          <div
            key={file.id}
            onClick={() => handleDownload(file)}
            className="group flex flex-col p-4 rounded-2xl border border-border/50 bg-muted/5 hover:bg-primary/[0.03] hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-background border shadow-sm group-hover:bg-primary/10 transition-colors">
                <FileText className="size-5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full bg-background/50 border opacity-0 group-hover:opacity-100 transition-all"
              >
                <Download className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                {file.file_name}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                {(file.file_size / 1024).toFixed(1)} KB •{" "}
                {file.file_type.split("/").pop()?.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
