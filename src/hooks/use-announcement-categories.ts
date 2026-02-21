"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

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

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export function useAnnouncementCategories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMountedRef();

  const fetch = useCallback(
    async (isRefresh = false) => {
      if (!mounted.current) return;
      if (!isRefresh) setLoading(true);
      setError(null);

      const { data, error: err } = await (supabase as any)
        .from("announcement_categories")
        .select("*")
        .order("name");

      if (!mounted.current) return;

      if (err) {
        setError(err.message);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    },
    [mounted]
  );

  useEffect(() => {
    fetch();

    const channel = (supabase as any)
      .channel("announcement_categories_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcement_categories" },
        () => fetch(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  const addCategory = async (name: string, icon: string, color?: string) => {
    const { data, error: err } = await (supabase as any)
      .from("announcement_categories")
      .insert({
        name,
        icon,
        color: color || "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
      })
      .select()
      .single();

    return { data, error: err };
  };

  return { categories, loading, error, addCategory, refresh: () => fetch(true) };
}
