/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNotificationStore } from "@/store/notification-store";
import { supabase } from "@/lib/supabase";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  DbUser,
  DbNotification,
  AnnouncementWithAuthor,
  AuditLogWithUser,
} from "@/types/database";

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

// ─── Shared result type ───
interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// ─── Helper: mounted ref (avoids setState-after-unmount) ───
function useMountedRef() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}

// =========================================
// 1. Auth User (session-level)
// =========================================
export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately — no need for getUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// =========================================
// 2. User Profile (public.users row)
// =========================================
export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const fetch = useCallback(
    async (isRefresh = false) => {
      if (!userId || !mounted.current) return;
      if (!isRefresh) setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!mounted.current) return;

      if (err) {
        setError(err.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    },
    [userId, mounted]
  );

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetch();

    const channel = supabase
      .channel(`profile_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        () => fetch(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetch]);

  return { profile, loading, error, refresh: () => fetch(true) };
}

// =========================================
// 3. Dashboard Data
// =========================================
interface DashboardStats {
  totalAnnouncements: number;
  activeUsers: number;
  departments: number;
  recentLoginsToday: number;
  announcementsThisWeek: number;
}

interface RecentActivity {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  details: string;
  time: string;
}

interface DepartmentDist {
  name: string;
  employees: number;
  color: string;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

const DEPT_COLORS = [
  "oklch(0.615 0.21 270)",
  "oklch(0.6 0.2 145)",
  "oklch(0.75 0.18 75)",
  "oklch(0.646 0.222 41.12)",
  "oklch(0.7 0.15 200)",
  "oklch(0.65 0.19 320)",
];

const EMPTY_STATS: DashboardStats = {
  totalAnnouncements: 0,
  activeUsers: 0,
  departments: 0,
  recentLoginsToday: 0,
  announcementsThisWeek: 0,
};

export interface WeeklyActivityData {
  name: string;
  logins: number;
  tasks: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentDist[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, { v: number }[]>>({
    announcements: [],
    users: [],
    notifications: [],
    activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!mounted.current) return;
      if (!isRefresh) setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [statsRes, announcementsRes, usersRes, auditRes, weeklyAuditRes, notificationsRes] =
          await Promise.all([
            supabase.rpc("get_dashboard_stats"),
            supabase
              .from("announcements")
              .select("*, author:users(name, avatar, role)")
              .order("created_at", { ascending: false })
              .limit(50),
            supabase.from("users").select("department, created_at").eq("status", "Active"),
            supabase
              .from("audit_logs")
              .select("id, timestamp, action, resource, details, user:users(name, role)")
              .order("timestamp", { ascending: false })
              .limit(10),
            supabase
              .from("audit_logs")
              .select("timestamp, action")
              .gte("timestamp", sevenDaysAgo.toISOString()),
            supabase
              .from("notifications")
              .select("id, created_at")
              .gte("created_at", sevenDaysAgo.toISOString()),
          ]);

        if (!mounted.current) return;

        // Check for any critical errors
        const errors = [
          statsRes,
          announcementsRes,
          usersRes,
          auditRes,
          weeklyAuditRes,
          notificationsRes,
        ]
          .filter((r) => r.error)
          .map((r) => r.error!.message);

        if (errors.length > 0) {
          setError(errors.join("; "));
        }

        // Stats
        if (statsRes.data) {
          const s = statsRes.data as Record<string, number>;
          setStats({
            totalAnnouncements: s.total_announcements ?? 0,
            activeUsers: s.total_users ?? 0,
            departments: s.departments ?? 0,
            recentLoginsToday: s.recent_logins_today ?? 0,
            announcementsThisWeek: s.announcements_this_week ?? 0,
          });
        }

        // Announcements + category breakdown
        if (announcementsRes.data) {
          const anns = announcementsRes.data as unknown as AnnouncementWithAuthor[];
          setAnnouncements(anns);

          const catMap: Record<string, number> = {};
          anns.forEach((a) => {
            catMap[a.category] = (catMap[a.category] || 0) + 1;
          });
          const total = anns.length || 1;
          setCategoryBreakdown(
            Object.entries(catMap).map(([category, count]) => ({
              category,
              count,
              percentage: Math.round((count / total) * 100),
            }))
          );
        }

        // Department distribution
        if (usersRes.data) {
          const distMap: Record<string, number> = {};
          usersRes.data.forEach((u) => {
            const dept = u.department;
            if (dept) distMap[dept] = (distMap[dept] || 0) + 1;
          });
          setDepartmentDistribution(
            Object.entries(distMap).map(([name, employees], idx) => ({
              name,
              employees,
              color: DEPT_COLORS[idx % DEPT_COLORS.length],
            }))
          );
        }

        // Recent activity
        if (auditRes.data) {
          setRecentActivity(
            auditRes.data.map((log: any) => ({
              id: log.id,
              user: log.user?.name || "System",
              role: log.user?.role || "Employee",
              action: log.action,
              target: log.resource,
              details: log.details || "",
              time: new Date(log.timestamp).toLocaleDateString(),
            }))
          );
        }

        // Weekly Activity Chart Aggregation
        if (weeklyAuditRes.data) {
          const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const weeklyDataMap = new Map<string, { logins: number; tasks: number }>();

          // Initialize the last 7 days to ensure they appear in order, even if empty
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weeklyDataMap.set(daysOfWeek[d.getDay()], { logins: 0, tasks: 0 });
          }

          weeklyAuditRes.data.forEach((log: any) => {
            const date = new Date(log.timestamp);
            const dayName = daysOfWeek[date.getDay()];

            if (weeklyDataMap.has(dayName)) {
              const current = weeklyDataMap.get(dayName)!;
              if (log.action === "Login") {
                current.logins += 1;
              } else {
                current.tasks += 1;
              }
            }
          });

          const aggregatedWeeklyActivity: WeeklyActivityData[] = Array.from(
            weeklyDataMap.entries()
          ).map(([name, counts]) => ({
            name,
            logins: counts.logins,
            tasks: counts.tasks,
          }));

          setWeeklyActivity(aggregatedWeeklyActivity);
        }

        // Sparklines Aggregation (Last 7 Days)
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d.toISOString().split("T")[0]);
        }

        const newSparklines: Record<string, { v: number }[] | any> = {
          announcements: days.map((day) => ({ v: 0 })),
          users: days.map((day) => ({ v: usersRes.data?.length || 0 })), // Simplistic: show current total as baseline
          notifications: days.map((day) => ({ v: 0 })),
          activity: days.map((day) => ({ v: 0 })),
        };

        // Map data to days
        if (announcementsRes.data) {
          announcementsRes.data.forEach((a: any) => {
            const dateStr = new Date(a.created_at).toISOString().split("T")[0];
            const idx = days.indexOf(dateStr);
            if (idx !== -1) newSparklines.announcements[idx].v++;
          });
        }

        if (notificationsRes.data) {
          notificationsRes.data.forEach((n: any) => {
            const dateStr = new Date(n.created_at).toISOString().split("T")[0];
            const idx = days.indexOf(dateStr);
            if (idx !== -1) newSparklines.notifications[idx].v++;
          });
        }

        if (weeklyAuditRes.data) {
          weeklyAuditRes.data.forEach((log: any) => {
            const dateStr = new Date(log.timestamp).toISOString().split("T")[0];
            const idx = days.indexOf(dateStr);
            if (idx !== -1) newSparklines.activity[idx].v++;
          });
        }

        setSparklines(newSparklines);
      } catch (e) {
        if (mounted.current) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [mounted]
  );

  useEffect(() => {
    loadData();

    // Subscribe to SPECIFIC tables, not the entire schema
    const channel = supabase
      .channel("dashboard_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () =>
        loadData(true)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () =>
        loadData(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return {
    stats,
    recentActivity,
    announcements,
    departmentDistribution,
    categoryBreakdown,
    weeklyActivity,
    sparklines,
    loading,
    error,
    refetch: loadData,
  };
}

// =========================================
// 4. Paginated List Hook (Generic)
// =========================================
interface PaginatedOptions {
  pageSize?: number;
  realtimeTable?: string;
}

function usePaginatedList<T>(
  table: keyof Database["public"]["Tables"],
  selectQuery: string,
  orderColumn: string,
  options: PaginatedOptions = {}
) {
  const { pageSize = 50, realtimeTable } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mounted = useMountedRef();

  const fetchPage = useCallback(
    async (pageNum: number, append = false, isRefresh = false) => {
      if (!mounted.current) return;
      if (!isRefresh) setLoading(true);
      setError(null);

      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, error: err } = await supabase
        .from(table)
        .select(selectQuery)
        .order(orderColumn, { ascending: false })
        .range(from, to);

      if (!mounted.current) return;

      if (err) {
        setError(err.message);
      } else if (rows) {
        setData((prev) => (append ? [...prev, ...(rows as T[])] : (rows as T[])));
        setHasMore(rows.length === pageSize);
      }

      setLoading(false);
    },
    [table, selectQuery, orderColumn, pageSize, mounted]
  );

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  }, [page, fetchPage]);

  const refetch = useCallback(() => {
    setPage(0);
    fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(0);

    if (!realtimeTable) return;

    const channel = supabase
      .channel(`${realtimeTable}_list`)
      .on("postgres_changes", { event: "*", schema: "public", table: realtimeTable }, () => {
        // Reset to first page on changes
        if (mounted.current) {
          setPage(0);
          fetchPage(0, false, true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPage, realtimeTable, mounted]);

  return { data, loading, error, hasMore, loadMore, refetch };
}

// =========================================
// 5. Announcements List
// =========================================
export function useAnnouncementsList() {
  return usePaginatedList<AnnouncementWithAuthor>(
    "announcements",
    "*, author:users(name, avatar, role)",
    "created_at",
    { realtimeTable: "announcements" }
  );
}

// =========================================
// 6. Users List
// =========================================
export function useUsersList() {
  return usePaginatedList<DbUser>("users", "*", "created_at", {
    realtimeTable: "users",
  });
}

// =========================================
// 7. Audit Logs List
// =========================================
export function useAuditLogsList() {
  return usePaginatedList<AuditLogWithUser>(
    "audit_logs",
    "*, user:users(name)",
    "timestamp",
    { pageSize: 100 } // no realtime — audit_logs removed from publication
  );
}

// =========================================
// 8. Notifications (user-scoped)
// =========================================
export function useNotificationsList(userId: string | undefined) {
  const {
    notifications: data,
    unreadCount,
    setNotifications,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllRead,
    removeNotification: storeRemoveNotification,
    removeAllNotifications: storeRemoveAllNotifications,
  } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const fetchNotifications = useCallback(
    async (uid: string, isRefresh = false) => {
      if (!mounted.current) return;
      if (!isRefresh) setLoading(true);

      const { data: rows, error: err } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!mounted.current) return;

      if (err) {
        setError(err.message);
      } else if (rows) {
        setNotifications(rows);
      }
      setLoading(false);
    },
    [mounted, setNotifications]
  );

  const markAllRead = useCallback(async () => {
    const { error: err } = await supabase.rpc("mark_all_notifications_read");
    if (err) {
      setError(err.message);
    } else {
      storeMarkAllRead();
    }
  }, [storeMarkAllRead]);

  const markAsRead = useCallback(
    async (id: string) => {
      const { error: err } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (err) {
        setError(err.message);
      } else {
        storeMarkAsRead(id);
      }
    },
    [storeMarkAsRead]
  );

  const clearNotification = useCallback(
    async (id: string) => {
      storeRemoveNotification(id); // Optimistic clear
      const { error: err } = await supabase.from("notifications").delete().eq("id", id);
      if (err) {
        setError(err.message);
        if (userId) fetchNotifications(userId); // Revert on failure
      }
    },
    [storeRemoveNotification, userId, fetchNotifications]
  );

  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;
    storeRemoveAllNotifications(); // Optimistic clear
    const { error: err } = await supabase.from("notifications").delete().eq("user_id", userId);
    if (err) {
      setError(err.message);
      fetchNotifications(userId); // Revert on failure
    }
  }, [storeRemoveAllNotifications, userId, fetchNotifications]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications(userId);

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // If it's a new notification, attempt to play the sound
          if (payload.eventType === "INSERT") {
            // Use a shared audio instance to avoid potential GC issues
            if (typeof window !== "undefined") {
              const audio = new Audio("/notificationsound.mp3");
              audio.volume = 0.5;
              audio.play().catch((e) => {
                // Most common reason is user hasn't interacted with the page yet
                console.warn("[Notification] Sound play blocked or failed:", e.message);
              });
            }
          }

          fetchNotifications(userId, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    data,
    loading,
    error,
    unreadCount,
    markAllRead,
    markAsRead,
    clearNotification,
    clearAllNotifications,
  };
}

// =========================================
// 9. Analytics Data (Real Data)
// =========================================
export function useAnalyticsData() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [topAnnouncements, setTopAnnouncements] = useState<any[]>([]);
  const [dailySparklines, setDailySparklines] = useState<{
    views: { v: number }[];
    engagement: { v: number }[];
    users: { v: number }[];
    announcements: { v: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const loadRealData = useCallback(async () => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);

    try {
      // Get last 6 months for main charts
      const months: any[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.toLocaleString("default", { month: "short" }),
          fullMonth: d.getMonth(),
          year: d.getFullYear(),
          announcements: 0,
          views: 0,
          engagement: 0,
          commentCount: 0,
        });
      }

      // Get last 14 days for sparklines
      const days: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
      const sparkStartDate = days[0];

      // 1. Fetch announcements
      const { data: anns, error: annErr } = await supabase
        .from("announcements")
        .select("created_at, views, title, category, id")
        .gte("created_at", startDate);

      if (annErr) throw annErr;

      // 2. Fetch comments
      const { data: comms, error: commErr } = await supabase
        .from("comments")
        .select("created_at")
        .gte("created_at", startDate);

      if (commErr) throw commErr;

      // 3. Fetch audit logs for views and logins (daily)
      const { data: audits, error: auditErr } = await supabase
        .from("audit_logs")
        .select("action, timestamp, resource")
        .gte("timestamp", sparkStartDate);

      if (auditErr) throw auditErr;

      // Monthly Aggregation
      anns?.forEach((ann) => {
        const date = new Date(ann.created_at);
        const monthIdx = months.findIndex(
          (m) => m.fullMonth === date.getMonth() && m.year === date.getFullYear()
        );
        if (monthIdx !== -1) {
          months[monthIdx].announcements++;
          months[monthIdx].views += ann.views || 0;
        }
      });

      comms?.forEach((comm) => {
        const date = new Date(comm.created_at);
        const monthIdx = months.findIndex(
          (m) => m.fullMonth === date.getMonth() && m.year === date.getFullYear()
        );
        if (monthIdx !== -1) {
          months[monthIdx].commentCount++;
        }
      });

      const finalMonthlyData = months.map((m) => ({
        month: m.month,
        announcements: m.announcements,
        views: m.views,
        engagement:
          m.announcements > 0
            ? Math.round((m.views + m.commentCount * 5) / m.announcements)
            : m.views + m.commentCount * 5,
      }));

      // Daily Sparkline Aggregation
      const sparklines: any = {
        views: days.map(() => ({ v: 0 })),
        engagement: days.map(() => ({ v: 0 })),
        users: days.map(() => ({ v: 0 })),
        announcements: days.map(() => ({ v: 0 })),
      };

      // Helpers for daily aggregation
      const dailyComments = days.map(() => 0);

      audits?.forEach((log) => {
        const dateStr = new Date(log.timestamp).toISOString().split("T")[0];
        const dayIdx = days.indexOf(dateStr);
        if (dayIdx !== -1) {
          if (log.action === "View" && log.resource === "Announcement") {
            sparklines.views[dayIdx].v++;
          } else if (log.action === "Login") {
            sparklines.users[dayIdx].v++;
          }
        }
      });

      anns?.forEach((ann) => {
        const dateStr = new Date(ann.created_at).toISOString().split("T")[0];
        const dayIdx = days.indexOf(dateStr);
        if (dayIdx !== -1) {
          sparklines.announcements[dayIdx].v++;
        }
      });

      comms?.forEach((comm) => {
        const dateStr = new Date(comm.created_at).toISOString().split("T")[0];
        const dayIdx = days.indexOf(dateStr);
        if (dayIdx !== -1) {
          dailyComments[dayIdx]++;
        }
      });

      // Calculate daily engagement
      days.forEach((_, i) => {
        const v = sparklines.views[i].v;
        const c = dailyComments[i];
        const a = sparklines.announcements[i].v;
        sparklines.engagement[i].v = a > 0 ? Math.round((v + c * 5) / a) : v + c * 5;
      });

      // Top performers
      const top = (anns || [])
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((a) => ({
          title: a.title,
          views: a.views || 0,
          category: a.category,
          engagement: a.views > 100 ? "High" : a.views > 50 ? "Medium" : "Low",
        }));

      if (mounted.current) {
        setAnalyticsData(finalMonthlyData);
        setTopAnnouncements(top);
        setDailySparklines(sparklines);
      }
    } catch (e: any) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  return {
    analyticsData,
    topAnnouncements,
    dailySparklines,
    loading,
    error,
    refetch: loadRealData,
  };
}

// =========================================
// 9. Groups Management
// =========================================
export function useGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const { data, error: err } = await supabase
      .from("groups")
      .select(
        `
                *,
                members:group_members(user_id)
            `
      )
      .order("name");

    if (err) setError(err.message);
    else setGroups(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, error, refresh: () => fetchGroups(true) };
}

// =========================================
// 10. Comments List
// =========================================
export function useComments(announcementId: string | undefined) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();
  const commentsRef = useRef(comments);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  const fetchComments = useCallback(
    async (aid: string, isRefresh = false) => {
      if (!mounted.current) return;
      if (!isRefresh) setLoading(true);
      const { data, error: err } = await supabase
        .from("comments")
        .select(
          `
                *,
                user:users(name, role, avatar)
            `
        )
        .eq("announcement_id", aid)
        .order("created_at", { ascending: true });

      if (!mounted.current) return;
      if (err) setError(err.message);
      else setComments(data || []);
      setLoading(false);
    },
    [mounted]
  );

  useEffect(() => {
    if (!announcementId) {
      setComments([]);
      setLoading(false);
      return;
    }

    fetchComments(announcementId);

    const channel = supabase
      .channel(`comments_${announcementId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          // Filter client-side to ensure maximum reliability
          const newAnnId =
            payload.new && "announcement_id" in payload.new ? payload.new.announcement_id : null;
          const oldAnnId =
            payload.old && "announcement_id" in payload.old ? payload.old.announcement_id : null;
          const deletedId = payload.eventType === "DELETE" ? payload.old.id : null;

          if (
            newAnnId === announcementId ||
            oldAnnId === announcementId ||
            (deletedId && commentsRef.current.some((c) => c.id === deletedId))
          ) {
            fetchComments(announcementId, true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [announcementId, fetchComments]);

  const addComment = async (content: string) => {
    if (!announcementId) return { error: "No announcement selected" };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error: err } = await supabase.from("comments").insert({
      announcement_id: announcementId,
      user_id: user.id,
      content,
    });

    return { error: err?.message };
  };

  const deleteComment = async (commentId: string) => {
    const { error: err } = await supabase.from("comments").delete().eq("id", commentId);
    return { error: err?.message };
  };

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refresh: () => announcementId && fetchComments(announcementId, true),
  };
}

// =========================================
// 11. Announcement Attachments
// =========================================
export function useAnnouncementAttachments(announcementId: string | undefined) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const fetchAttachments = useCallback(
    async (aid: string) => {
      if (!mounted.current) return;
      setLoading(true);
      const { data, error: err } = await (supabase as any)
        .from("announcement_attachments")
        .select("*")
        .eq("announcement_id", aid);

      if (!mounted.current) return;
      if (err) setError(err.message);
      else setAttachments(data || []);
      setLoading(false);
    },
    [mounted]
  );

  useEffect(() => {
    if (!announcementId) {
      setAttachments([]);
      setLoading(false);
      return;
    }

    fetchAttachments(announcementId);
  }, [announcementId, fetchAttachments]);

  return {
    attachments,
    loading,
    error,
    refresh: () => announcementId && fetchAttachments(announcementId),
  };
}
