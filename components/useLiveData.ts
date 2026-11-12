"use client";

import { useCallback, useEffect, useState } from "react";

/** Loads JSON from an API url, reloads when refreshKey changes and every `every` ms. */
export function useLiveData<T>(url: string, refreshKey = 0, every = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load data");
      setData(json as T);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data");
    }
  }, [url]);

  useEffect(() => {
    load();
    const t = setInterval(load, every);
    return () => clearInterval(t);
  }, [load, refreshKey, every]);

  return { data, error };
}
