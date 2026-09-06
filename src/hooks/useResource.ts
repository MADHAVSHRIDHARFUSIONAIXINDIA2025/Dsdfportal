"use client";

import { api, del } from "@/lib/client";
import { useToast } from "@/components/ui/Toast";
import { useCallback, useEffect, useRef, useState } from "react";

export function useResource<T>(path: string) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<T>(path));
    } catch (error) {
      toastRef.current.push(error instanceof Error ? error.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await api<T>(path);
        if (!cancelled) setData(result);
      } catch (error) {
        if (!cancelled) {
          toastRef.current.push(error instanceof Error ? error.message : "Failed to load", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  const remove = useCallback(
    async (id: string) => {
      if (!confirm("Delete this record?")) return;
      try {
        await del(`${path}/${id}`);
        toastRef.current.push("Deleted");
        await reload();
      } catch (error) {
        toastRef.current.push(error instanceof Error ? error.message : "Delete failed", "error");
      }
    },
    [path, reload]
  );

  return { data, loading, reload, remove };
}
