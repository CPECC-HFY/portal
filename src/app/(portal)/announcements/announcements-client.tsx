"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {
  Search,
  Filter,
  Eye,
  Clock,
  Pin,
  User,
  Megaphone,
  Users,
  Monitor,
  Landmark,
  ShieldAlert,
  CalendarDays,
  FileText,
  Share2,
  Bookmark,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAnnouncementsList, useAnnouncementAttachments } from "@/hooks/use-supabase";
import { useQueryState, parseAsString } from "nuqs";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoleBadge } from "@/components/ui/role-badge";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { cn, stripHtml } from "@/lib/utils";
import { AnnouncementComments } from "@/components/announcements/announcement-comments";
import { Paperclip, Download, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations, useFormatter } from "next-intl";

const categories = ["All", "General", "HR", "IT", "Finance", "Safety", "Events"];
const priorities = ["All", "Low", "Medium", "High", "Urgent"];

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

function getDate(ann: any, format: any): string {
  const raw = ann.published_at || ann.publishedAt || ann.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return format.dateTime(d, { month: "short", day: "numeric", year: "numeric" });
}

function getDateLong(ann: any, format: any): string {
  const raw = ann.published_at || ann.publishedAt || ann.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return format.dateTime(d, { month: "long", day: "numeric", year: "numeric" });
}

export default function AnnouncementsClient() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [category, setCategory] = useQueryState("category", parseAsString.withDefault("All"));
  const [priority, setPriority] = useQueryState("priority", parseAsString.withDefault("All"));

  const { data: announcements, loading } = useAnnouncementsList();
  const [selectedAnn, setSelectedAnn] = useState<any>(null);

  const t = useTranslations("Announcements");
  const commonT = useTranslations("Common");
  const format = useFormatter();

  // Helper to translate safely with fallback to raw value
  const safeTranslate = (key: string, raw: string) => {
    const k = key.toLowerCase();
    return t.has(k) ? t(k) : raw;
  };

  const handleOpenAnn = async (ann: any) => {
    setSelectedAnn(ann);
    // Increment views
    try {
      await supabase.rpc("increment_announcement_views", { p_announcement_id: ann.id });
      await logAudit("View", "Announcement", `Viewed: ${ann.title}`);
    } catch (e) {
      console.error("Failed to increment views", e);
    }
  };

  const filtered = announcements
    .filter((a) => a.status === "Published")
    .filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        stripHtml(a.content || "")
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .filter((a) => category === "All" || a.category === category)
    .filter((a) => priority === "All" || a.priority === priority);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subHeader")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            className="ps-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat === "All" ? null : cat)}
                className="shrink-0"
              >
                {safeTranslate(cat, cat)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <Filter className="size-4 shrink-0 self-center text-muted-foreground" />
        {priorities.map((p) => (
          <Button
            key={p}
            variant={priority === p ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPriority(p === "All" ? null : p)}
            className="shrink-0 text-xs"
          >
            {safeTranslate(p, p)}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">{t("noAnnouncements")}</h3>
            <p className="text-sm text-muted-foreground">{t("adjustFilters")}</p>
          </div>
        ) : (
          filtered.map((ann) => {
            const config = priorityConfig[ann.priority] || priorityConfig.Low;
            const catCfg = categoryConfig[ann.category] || categoryConfig.General;

            return (
              <div
                key={ann.id}
                onClick={() => handleOpenAnn(ann)}
                className={`group relative cursor-pointer border-l-[3px] ${config.border} transition-colors hover:bg-muted/30`}
              >
                <div className="flex items-start gap-4 px-6 py-5">
                  {/* Avatar */}
                  <div className="relative mt-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <User className="size-4.5 opacity-80" />
                    </div>
                    {ann.pinned && (
                      <div className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-100 text-[10px] dark:bg-amber-900/50 shadow-sm">
                        📌
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-semibold transition-colors group-hover:text-primary">
                        {ann.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${catCfg.bg}`}
                      >
                        <span>{catCfg.icon}</span>
                        {safeTranslate(ann.category, ann.category)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${config.badge}`}
                      >
                        <span
                          className={`relative flex size-2 items-center justify-center ${config.wrapper}`}
                        >
                          <span
                            className={`absolute inline-flex h-full w-full rounded-full ${config.outerDot}`}
                          ></span>
                          <span
                            className={`relative inline-flex size-1.5 rounded-full ${config.innerDot}`}
                          ></span>
                        </span>
                        {safeTranslate(ann.priority, ann.priority)}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {stripHtml(ann.content || "")
                        .substring(0, 150)
                        .trim()}
                      {stripHtml(ann.content || "").length > 150 ? "..." : ""}
                    </p>

                    {/* Meta row */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {t("by")}{" "}
                        <span className="font-medium text-foreground/80">
                          {ann.author?.name || commonT("unknown")}
                        </span>
                        <RoleBadge role={ann.author?.role || "Employee"} size="sm" />
                      </span>
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Eye className="size-3.5" />
                        {t("viewsCount", { count: ann.views })}
                      </span>
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Clock className="size-3.5" />
                        {getDate(ann, format)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Announcement Reading Overlay — Professional Clean */}
      <Dialog open={!!selectedAnn} onOpenChange={(open) => !open && setSelectedAnn(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl gap-0 p-0 overflow-hidden outline-none border border-border/40 shadow-2xl rounded-3xl bg-background/95 backdrop-blur-xl [&>button]:hidden">
          {selectedAnn &&
            (() => {
              const config = priorityConfig[selectedAnn.priority] || priorityConfig.Low;
              const catCfg = categoryConfig[selectedAnn.category] || categoryConfig.General;
              const readingTime = Math.max(
                1,
                Math.ceil((selectedAnn.content || "").split(/\s+/).length / 200)
              );
              const formattedDate = getDateLong(selectedAnn, format);
              const viewCount = (selectedAnn.views || 0) + 1;

              return (
                <>
                  {/* Header */}
                  <div className="relative px-6 sm:px-10 pt-8 pb-6">
                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${catCfg.bg} ring-1 ring-black/[0.04] dark:ring-white/[0.06]`}
                      >
                        {catCfg.icon}
                        {safeTranslate(selectedAnn.category, selectedAnn.category)}
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
                        {safeTranslate(selectedAnn.priority, selectedAnn.priority)}
                      </span>
                      {selectedAnn.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-500/20">
                          <Pin className="size-3" />
                          {commonT("pinned")}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <DialogHeader className="text-start space-y-0 mb-6">
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
                            {selectedAnn.author?.name || commonT("unknown")}
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
                          {t("viewsCount", { count: viewCount })}
                        </span>
                      </div>

                      {/* Reading Time */}
                      <div className="flex items-center gap-2 text-muted-foreground sm:ms-auto">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="text-xs font-medium">{t("minReadCount", { count: readingTime })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedAnn.attachments?.length > 0 && (
                    <div className="px-6 sm:px-10 mb-6">
                      <AttachmentsList attachments={selectedAnn.attachments} t={t} />
                    </div>
                  )}

                  {/* Scrollable Body */}
                  <ScrollArea className="max-h-[60vh] border-t border-border/30">
                    <div className="px-6 sm:px-10 py-8">
                      <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
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
                          {commonT("close")}
                        </Button>
                      </DialogClose>
                    </div>
                  </div>
                </>
              );
            })()}

        </DialogContent>
      </Dialog>
    </div >
  );
}

function AttachmentsList({ attachments, t }: { attachments: any[]; t: any }) {



  if (attachments.length === 0) return null;

  const handleDownload = async (file: any, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleView = (file: any) => {
    const { data } = supabase.storage.from("announcements").getPublicUrl(file.file_path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
        <Paperclip className="size-3.5" />
        {t("attachments")}
      </h4>
      <div className="grid gap-3">
        {attachments.map((file) => (
          <div
            key={file.id}
            onClick={() => handleView(file)}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-muted/5 hover:bg-primary/[0.03] hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-background border shadow-sm group-hover:bg-primary/10 transition-colors">
              <FileText className="size-5 text-primary/60 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                {file.file_name}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                {(file.file_size / 1024).toFixed(1)} KB •{" "}
                {file.file_type.split("/").pop()?.toUpperCase() || "FILE"}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full bg-background/50 hover:bg-background border focus:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(file);
                      }}
                    >
                      <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{t("viewFile")}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full bg-background/50 hover:bg-background border focus:opacity-100"
                      onClick={(e) => handleDownload(file, e)}
                    >
                      <Download className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{t("downloadFile")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileTextPlaceholder({ className }: { className?: string }) {
  return <FileText className={className} />;
}
