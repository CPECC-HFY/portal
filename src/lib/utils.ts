import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtml(html: string) {
  if (!html) return "";
  // First, replace common block-level tags with spaces to avoid merging words
  const semiClean = html.replace(/<(p|div|br|h[1-6]|li|blockquote|section|article)[^>]*>?/gim, " ");
  // Then remove all other tags
  const clean = semiClean.replace(/<[^>]*>?/gm, "");
  // Decode basic HTML entities and collapse whitespace
  return clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
