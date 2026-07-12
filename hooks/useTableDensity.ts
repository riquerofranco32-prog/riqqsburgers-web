"use client";

import { useState, useEffect, useCallback } from "react";

export type TableDensity = "comfortable" | "compact";

// Preferencia de UI personal del navegador — no por tenant, no va a Supabase (YAGNI).
const STORAGE_KEY = "takefyy_admin_density";

export function useTableDensity() {
  const [density, setDensityState] = useState<TableDensity>("comfortable");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "compact" || saved === "comfortable") {
        setDensityState(saved);
      }
    } catch {}
  }, []);

  const setDensity = useCallback((next: TableDensity) => {
    setDensityState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleDensity = useCallback(() => {
    setDensity(density === "compact" ? "comfortable" : "compact");
  }, [density, setDensity]);

  return { density, setDensity, toggleDensity };
}
