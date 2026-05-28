"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { getUserLimits } from "@/lib/api";
import type { UserLimits } from "@/types";

export function useLimits() {
  const { getToken } = useAuth();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) setLimits(await getUserLimits(token));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { refresh(); }, [refresh]);
  return { limits, loading, refresh };
}
