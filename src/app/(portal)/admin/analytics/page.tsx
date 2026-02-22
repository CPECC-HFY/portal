"use client";
export const runtime = "edge";
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
  Landmark,
  ShieldAlert,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsData, useDashboardData } from "@/hooks/use-supabase";
import { useTranslations } from "next-intl";
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
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const miniChartData = {
  views: [{ v: 10 }, { v: 14 }, { v: 13 }, { v: 18 }, { v: 15 }, { v: 22 }, { v: 24 }],
  engagement: [{ v: 45 }, { v: 50 }, { v: 48 }, { v: 60 }, { v: 65 }, { v: 62 }, { v: 78 }],
  users: [{ v: 100 }, { v: 110 }, { v: 115 }, { v: 120 }, { v: 125 }, { v: 130 }, { v: 142 }],
  announcements: [{ v: 12 }, { v: 15 }, { v: 14 }, { v: 16 }, { v: 15 }, { v: 18 }, { v: 16 }],
};

const categoryConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  General: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    icon: <Megaphone className="size-3" />,
  },
  HR: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    icon: <Users className="size-3" />,
  },
  IT: {
    bg: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
    icon: <Monitor className="size-3" />,
  },
  Finance: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    icon: <Landmark className="size-3" />,
  },
  Safety: {
    bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20",
    icon: <ShieldAlert className="size-3" />,
  },
  Events: {
    bg: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20",
    icon: <CalendarDays className="size-3" />,
  },
};

const miniChartKeys = ["views", "engagement", "users", "announcements"] as const;

export default function AnalyticsPage() {
  const {
    analyticsData,
    topAnnouncements,
    dailySparklines,
    loading: analyticsLoading,
  } = useAnalyticsData();
  const { stats: dashboardStats, loading: dashboardLoading } = useDashboardData();

  const t = useTranslations("Admin");
  const commonT = useTranslations("Common");
  const announcementsT = useTranslations("Announcements");
  const navT = useTranslations("Navigation");

  if (analyticsLoading || dashboardLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse flex items-center justify-center h-full">
        {commonT("loading")}
      </div>
    );
  }

  const analyticsStats = [
    {
      title: t("totalViewsTitle"),
      value: analyticsData.reduce((sum, d) => sum + d.views, 0).toLocaleString(),
      change: t("last6Months"),
      trend: "up" as const,
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradientFrom: "from-blue-500/20",
      gradientTo: "to-blue-500/5",
      sparkKey: "views" as const,
    },
    {
      title: t("avgEngagement"),
      value: (
        analyticsData.reduce((sum, d) => sum + d.engagement, 0) / (analyticsData.length || 1)
      ).toFixed(1),
      change: t("weightedScore"),
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-500/5",
      sparkKey: "engagement" as const,
    },
    {
      title: t("activeUsersCount"),
      value: dashboardStats.activeUsers,
      change: commonT("realTime"),
      trend: "up" as const,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-500/5",
      sparkKey: "users" as const,
    },
    {
      title: commonT("announcements"),
      value: dashboardStats.totalAnnouncements,
      change: commonT("allTime"),
      trend: "up" as const,
      icon: Megaphone,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradientFrom: "from-amber-500/20",
      gradientTo: "to-amber-500/5",
      sparkKey: "announcements" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{navT("analytics")}</h1>
        <p className="text-muted-foreground">{t("analyticsDesc")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsStats.map((stat, index) => (
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
                    className={`mt-1 flex items-center gap-1 text-xs ${stat.trend === "up" ? "text-emerald-500" : "text-amber-500"}`}
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
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={dailySparklines ? dailySparklines[stat.sparkKey] : []}>
                      <defs>
                        <linearGradient
                          id={`sparkGradAnalytics-${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="currentColor"
                        fill={`url(#sparkGradAnalytics-${index})`}
                        strokeWidth={1.5}
                        className={stat.color}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("viewsAndEngagement")}</CardTitle>
            <CardDescription>{t("monthlyTrends")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.615 0.21 270)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.615 0.21 270)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.6 0.2 145)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.6 0.2 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="oklch(0.615 0.21 270)"
                    fill="url(#viewsGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="oklch(0.6 0.2 145)"
                    fill="url(#engGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("announcementsPublished")}</CardTitle>
            <CardDescription>{t("announcementsPerMonth")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="announcements" fill="oklch(0.615 0.21 270)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("topPerformingAnnouncements")}</CardTitle>
          <CardDescription>{t("rankedByViews")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{commonT("title")}</TableHead>
                <TableHead>{commonT("category")}</TableHead>
                <TableHead className="text-end">{announcementsT("views")}</TableHead>
                <TableHead className="text-end">{commonT("engagement")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAnnouncements.map((ann, i) => {
                const catCfg = categoryConfig[ann.category] || categoryConfig.General;
                return (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground/90">{ann.title}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-[86px] justify-center items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${catCfg.bg}`}
                      >
                        <span className="shrink-0">{catCfg.icon}</span>
                        <span className="truncate">{ann.category}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-end tabular-nums text-muted-foreground">
                      {ann.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
                      <span
                        className={`inline-flex min-w-[70px] justify-center items-center rounded-full px-2 py-0.5 text-[11px] font-medium border shadow-[0_0_8px_rgba(0,0,0,0.05)] ${ann.engagement === "High"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : ann.engagement === "Medium"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                          }`}
                      >
                        {ann.engagement === "High"
                          ? commonT("high")
                          : ann.engagement === "Medium"
                            ? commonT("medium")
                            : commonT("low")}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
