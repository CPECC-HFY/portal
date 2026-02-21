// ─── Mock Data for Employee Portal ───

export interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: { name: string; avatar: string; role: string };
  category: "General" | "HR" | "IT" | "Finance" | "Safety" | "Events";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Draft" | "Published" | "Archived";
  publishedAt: string;
  published_at?: string;
  views: number;
  pinned: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Employee" | "HR";
  department: string;
  status: "Active" | "Inactive" | "Suspended";
  joinDate: string;
  avatar: string;
  phone: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "Create" | "Update" | "Delete" | "Login" | "Logout" | "Export" | "Import";
  resource: string;
  details: string;
  ipAddress: string;
}

export interface AnalyticsData {
  month: string;
  announcements: number;
  views: number;
  engagement: number;
}

// ── Announcements ──
export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Q1 2026 Company All-Hands Meeting",
    content:
      "Join us for the quarterly company-wide meeting where we'll discuss Q4 2025 results, Q1 2026 goals, and exciting new initiatives. All employees are expected to attend.",
    excerpt:
      "Quarterly all-hands meeting scheduled for March 5th. All employees are expected to attend.",
    author: { name: "Sarah Johnson", avatar: "SJ", role: "Super Admin" },
    category: "General",
    priority: "High",
    status: "Published",
    publishedAt: "2026-02-20T08:00:00Z",
    views: 342,
    pinned: true,
  },
  {
    id: "ann-2",
    title: "Updated Remote Work Policy",
    content:
      "Effective March 1st, 2026, the company is updating its remote work policy. Employees may now work remotely up to 3 days per week with manager approval. Please review the full policy document attached.",
    excerpt: "New remote work policy allows up to 3 days WFH per week starting March 1st.",
    author: { name: "Emily Chen", avatar: "EC", role: "Admin" },
    category: "HR",
    priority: "High",
    status: "Published",
    publishedAt: "2026-02-19T10:00:00Z",
    views: 518,
    pinned: true,
  },
  {
    id: "ann-3",
    title: "IT System Upgrade: Email Migration",
    content:
      "The IT department will be migrating all email accounts to the new cloud-based system over the weekend of Feb 28-Mar 1. Please save any important drafts before Friday evening.",
    excerpt: "Email migration scheduled for Feb 28-Mar 1. Save drafts before Friday.",
    author: { name: "Michael Park", avatar: "MP", role: "Super Admin" },
    category: "IT",
    priority: "Urgent",
    status: "Published",
    publishedAt: "2026-02-18T14:00:00Z",
    views: 285,
    pinned: false,
  },
  {
    id: "ann-4",
    title: "Annual Benefits Enrollment Now Open",
    content:
      "Open enrollment for 2026 benefits is now live. Review your current elections and make any changes by March 15th. Information sessions will be held daily this week.",
    excerpt: "2026 benefits enrollment is open. Deadline: March 15th.",
    author: { name: "Lisa Wong", avatar: "LW", role: "Admin" },
    category: "HR",
    priority: "Medium",
    status: "Published",
    publishedAt: "2026-02-17T09:00:00Z",
    views: 431,
    pinned: false,
  },
  {
    id: "ann-5",
    title: "Workplace Safety Training Reminder",
    content:
      "All employees must complete the annual workplace safety training by February 28th. Access the training module through the Learning Portal.",
    excerpt: "Complete safety training by Feb 28th via Learning Portal.",
    author: { name: "Robert Kim", avatar: "RK", role: "Employee" },
    category: "Safety",
    priority: "Medium",
    status: "Published",
    publishedAt: "2026-02-16T11:00:00Z",
    views: 198,
    pinned: false,
  },
  {
    id: "ann-6",
    title: "Company Picnic: Save the Date!",
    content:
      "Mark your calendars! The annual company picnic will be held on April 12th at Riverside Park. Bring your families! More details to follow.",
    excerpt: "Annual company picnic on April 12th at Riverside Park. Families welcome!",
    author: { name: "Ana Rodriguez", avatar: "AR", role: "Employee" },
    category: "Events",
    priority: "Low",
    status: "Published",
    publishedAt: "2026-02-15T13:00:00Z",
    views: 267,
    pinned: false,
  },
  {
    id: "ann-7",
    title: "Q4 2025 Financial Results Summary",
    content:
      "We are pleased to share that Q4 2025 results exceeded expectations with 12% revenue growth. Full financial details are available in the investor portal.",
    excerpt: "Q4 2025 exceeded expectations with 12% revenue growth.",
    author: { name: "David Thompson", avatar: "DT", role: "Super Admin" },
    category: "Finance",
    priority: "Medium",
    status: "Published",
    publishedAt: "2026-02-14T08:30:00Z",
    views: 156,
    pinned: false,
  },
  {
    id: "ann-8",
    title: "New Employee Onboarding Process",
    content:
      "We've streamlined the onboarding process for new hires. Managers, please review the updated checklist and use the new onboarding portal for all future hires.",
    excerpt: "Streamlined onboarding process. Managers to review new checklist.",
    author: { name: "Emily Chen", avatar: "EC", role: "HR Director" },
    category: "HR",
    priority: "Low",
    status: "Draft",
    publishedAt: "2026-02-13T15:00:00Z",
    views: 0,
    pinned: false,
  },
];

// ── Users ──
export const users: User[] = [
  {
    id: "usr-1",
    name: "Sarah Johnson",
    email: "s.johnson@company.com",
    role: "Admin",
    department: "Executive",
    status: "Active",
    joinDate: "2020-03-15",
    avatar: "SJ",
    phone: "+1 (555) 100-0001",
  },
  {
    id: "usr-2",
    name: "Emily Chen",
    email: "e.chen@company.com",
    role: "HR",
    department: "Human Resources",
    status: "Active",
    joinDate: "2021-06-01",
    avatar: "EC",
    phone: "+1 (555) 100-0002",
  },
  {
    id: "usr-3",
    name: "Michael Park",
    email: "m.park@company.com",
    role: "Manager",
    department: "IT",
    status: "Active",
    joinDate: "2019-01-20",
    avatar: "MP",
    phone: "+1 (555) 100-0003",
  },
  {
    id: "usr-4",
    name: "Lisa Wong",
    email: "l.wong@company.com",
    role: "HR",
    department: "Human Resources",
    status: "Active",
    joinDate: "2022-02-14",
    avatar: "LW",
    phone: "+1 (555) 100-0004",
  },
  {
    id: "usr-5",
    name: "Robert Kim",
    email: "r.kim@company.com",
    role: "Employee",
    department: "Operations",
    status: "Active",
    joinDate: "2021-09-10",
    avatar: "RK",
    phone: "+1 (555) 100-0005",
  },
  {
    id: "usr-6",
    name: "Ana Rodriguez",
    email: "a.rodriguez@company.com",
    role: "Employee",
    department: "Marketing",
    status: "Active",
    joinDate: "2023-04-03",
    avatar: "AR",
    phone: "+1 (555) 100-0006",
  },
  {
    id: "usr-7",
    name: "David Thompson",
    email: "d.thompson@company.com",
    role: "Manager",
    department: "Finance",
    status: "Active",
    joinDate: "2018-11-05",
    avatar: "DT",
    phone: "+1 (555) 100-0007",
  },
  {
    id: "usr-8",
    name: "Jessica Martinez",
    email: "j.martinez@company.com",
    role: "Employee",
    department: "Engineering",
    status: "Inactive",
    joinDate: "2020-07-22",
    avatar: "JM",
    phone: "+1 (555) 100-0008",
  },
  {
    id: "usr-9",
    name: "James Wilson",
    email: "j.wilson@company.com",
    role: "Employee",
    department: "Sales",
    status: "Active",
    joinDate: "2024-01-08",
    avatar: "JW",
    phone: "+1 (555) 100-0009",
  },
  {
    id: "usr-10",
    name: "Priya Patel",
    email: "p.patel@company.com",
    role: "Manager",
    department: "Engineering",
    status: "Active",
    joinDate: "2019-05-18",
    avatar: "PP",
    phone: "+1 (555) 100-0010",
  },
  {
    id: "usr-11",
    name: "Thomas Brown",
    email: "t.brown@company.com",
    role: "Employee",
    department: "IT",
    status: "Suspended",
    joinDate: "2022-08-30",
    avatar: "TB",
    phone: "+1 (555) 100-0011",
  },
  {
    id: "usr-12",
    name: "Maria Garcia",
    email: "m.garcia@company.com",
    role: "Employee",
    department: "Customer Service",
    status: "Active",
    joinDate: "2023-11-12",
    avatar: "MG",
    phone: "+1 (555) 100-0012",
  },
];

// ── Audit Log ──
export const auditLog: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-02-20T09:15:00Z",
    user: "Sarah Johnson",
    action: "Create",
    resource: "Announcement",
    details: "Created 'Q1 2026 Company All-Hands Meeting'",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log-2",
    timestamp: "2026-02-20T09:00:00Z",
    user: "Emily Chen",
    action: "Update",
    resource: "User",
    details: "Updated profile for Michael Park",
    ipAddress: "192.168.1.22",
  },
  {
    id: "log-3",
    timestamp: "2026-02-20T08:45:00Z",
    user: "Michael Park",
    action: "Login",
    resource: "System",
    details: "Successful login from Chrome on Windows",
    ipAddress: "10.0.0.55",
  },
  {
    id: "log-4",
    timestamp: "2026-02-19T17:30:00Z",
    user: "Sarah Johnson",
    action: "Export",
    resource: "Report",
    details: "Exported monthly analytics report",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log-5",
    timestamp: "2026-02-19T16:00:00Z",
    user: "Emily Chen",
    action: "Update",
    resource: "Announcement",
    details: "Updated 'Remote Work Policy' status to Published",
    ipAddress: "192.168.1.22",
  },
  {
    id: "log-6",
    timestamp: "2026-02-19T14:20:00Z",
    user: "David Thompson",
    action: "Create",
    resource: "Announcement",
    details: "Created 'Q4 2025 Financial Results Summary'",
    ipAddress: "192.168.1.40",
  },
  {
    id: "log-7",
    timestamp: "2026-02-19T11:00:00Z",
    user: "Lisa Wong",
    action: "Delete",
    resource: "User",
    details: "Deactivated account for Thomas Brown",
    ipAddress: "192.168.1.33",
  },
  {
    id: "log-8",
    timestamp: "2026-02-19T10:30:00Z",
    user: "Robert Kim",
    action: "Login",
    resource: "System",
    details: "Successful login from Safari on macOS",
    ipAddress: "10.0.0.88",
  },
  {
    id: "log-9",
    timestamp: "2026-02-18T15:45:00Z",
    user: "Sarah Johnson",
    action: "Update",
    resource: "Settings",
    details: "Updated notification preferences",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log-10",
    timestamp: "2026-02-18T12:00:00Z",
    user: "Ana Rodriguez",
    action: "Create",
    resource: "Announcement",
    details: "Created 'Company Picnic: Save the Date!'",
    ipAddress: "192.168.1.57",
  },
  {
    id: "log-11",
    timestamp: "2026-02-18T09:15:00Z",
    user: "Priya Patel",
    action: "Import",
    resource: "Users",
    details: "Imported 5 new user accounts from CSV",
    ipAddress: "10.0.0.42",
  },
  {
    id: "log-12",
    timestamp: "2026-02-17T16:30:00Z",
    user: "Michael Park",
    action: "Update",
    resource: "System",
    details: "Applied security patch v2.4.1",
    ipAddress: "10.0.0.55",
  },
  {
    id: "log-13",
    timestamp: "2026-02-17T14:00:00Z",
    user: "James Wilson",
    action: "Logout",
    resource: "System",
    details: "User logout",
    ipAddress: "10.0.0.99",
  },
  {
    id: "log-14",
    timestamp: "2026-02-17T10:45:00Z",
    user: "Emily Chen",
    action: "Create",
    resource: "User",
    details: "Created account for Maria Garcia",
    ipAddress: "192.168.1.22",
  },
  {
    id: "log-15",
    timestamp: "2026-02-16T11:30:00Z",
    user: "Sarah Johnson",
    action: "Delete",
    resource: "Announcement",
    details: "Archived 'Holiday Schedule 2025'",
    ipAddress: "192.168.1.10",
  },
];

// ── Analytics ──
export const analyticsData: AnalyticsData[] = [
  { month: "Sep", announcements: 8, views: 1200, engagement: 340 },
  { month: "Oct", announcements: 12, views: 1850, engagement: 520 },
  { month: "Nov", announcements: 6, views: 980, engagement: 290 },
  { month: "Dec", announcements: 10, views: 1500, engagement: 410 },
  { month: "Jan", announcements: 14, views: 2100, engagement: 630 },
  { month: "Feb", announcements: 9, views: 1750, engagement: 480 },
];

export const dashboardStats = {
  totalAnnouncements: 47,
  activeUsers: 142,
  unreadNotifications: 5,
  departments: 8,
  announcementsThisMonth: 9,
  engagementRate: 78,
  avgViewsPerAnnouncement: 312,
  pendingApprovals: 3,
};

export const recentActivity = [
  {
    id: "act-1",
    user: "Sarah Johnson",
    action: "published a new announcement",
    target: "Q1 All-Hands Meeting",
    time: "2 hours ago",
  },
  {
    id: "act-2",
    user: "Emily Chen",
    action: "updated the",
    target: "Remote Work Policy",
    time: "5 hours ago",
  },
  {
    id: "act-3",
    user: "Michael Park",
    action: "scheduled maintenance for",
    target: "Email System",
    time: "Yesterday",
  },
  {
    id: "act-4",
    user: "Lisa Wong",
    action: "opened enrollment for",
    target: "2026 Benefits",
    time: "2 days ago",
  },
  {
    id: "act-5",
    user: "David Thompson",
    action: "shared",
    target: "Q4 Financial Results",
    time: "3 days ago",
  },
  {
    id: "act-6",
    user: "Ana Rodriguez",
    action: "created event",
    target: "Company Picnic",
    time: "4 days ago",
  },
];

// ── Dashboard Chart Data ──
export const weeklyActivityData = [
  { day: "Mon", logins: 98, announcements: 3, tasks: 42 },
  { day: "Tue", logins: 112, announcements: 5, tasks: 56 },
  { day: "Wed", logins: 125, announcements: 2, tasks: 48 },
  { day: "Thu", logins: 108, announcements: 4, tasks: 61 },
  { day: "Fri", logins: 95, announcements: 6, tasks: 38 },
  { day: "Sat", logins: 22, announcements: 0, tasks: 8 },
  { day: "Sun", logins: 15, announcements: 1, tasks: 5 },
];

export const departmentDistribution = [
  { name: "Engineering", employees: 38, color: "oklch(0.615 0.21 270)" },
  { name: "Marketing", employees: 22, color: "oklch(0.6 0.2 145)" },
  { name: "Human Resources", employees: 15, color: "oklch(0.75 0.18 75)" },
  { name: "Finance", employees: 18, color: "oklch(0.646 0.222 41.12)" },
  { name: "Sales", employees: 25, color: "oklch(0.6 0.118 184.71)" },
  { name: "Operations", employees: 12, color: "oklch(0.769 0.188 70.08)" },
  { name: "IT", employees: 8, color: "oklch(0.627 0.265 303.9)" },
  { name: "Executive", employees: 4, color: "oklch(0.645 0.246 16.44)" },
];

export const categoryBreakdown = [
  { category: "General", count: 12, percentage: 25 },
  { category: "HR", count: 15, percentage: 32 },
  { category: "IT", count: 8, percentage: 17 },
  { category: "Finance", count: 5, percentage: 11 },
  { category: "Safety", count: 4, percentage: 8 },
  { category: "Events", count: 3, percentage: 7 },
];

export const userGrowthData = [
  { month: "Sep", total: 108, new: 6 },
  { month: "Oct", total: 115, new: 7 },
  { month: "Nov", total: 120, new: 5 },
  { month: "Dec", total: 126, new: 6 },
  { month: "Jan", total: 135, new: 9 },
  { month: "Feb", total: 142, new: 7 },
];

export const performanceMetrics = {
  avgResponseTime: "1.2s",
  uptime: "99.8%",
  readRate: "84%",
  avgSessionDuration: "18m",
  peakHour: "10:00 AM",
  topDepartment: "Engineering",
};
