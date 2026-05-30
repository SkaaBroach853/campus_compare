"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useSavedStore } from "@/store/useSavedStore";
import type { College } from "@/types";

interface SavedState {
  savedColleges: College[];
  loading: boolean;
  error: string | null;
  reloadSaved: () => Promise<void>;
  toggleSavedRemote: (collegeId: string) => Promise<void>;
}

export function useSaved(): SavedState {
  const [savedColleges, setSavedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { savedIds, setSaved, toggleSaved } = useSavedStore();

  const reloadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setSaved([]);
        setSavedColleges([]);
        return;
      }

      const { data, error: savedError } = await supabase
        .from("saved_colleges")
        .select("college_id, colleges(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        throw savedError;
      }

      const rows = (data ?? []) as unknown as Array<{
        college_id: string;
        colleges: College | null;
      }>;
      const ids = rows.map((row) => row.college_id);
      const colleges = rows.flatMap((row) => (row.colleges ? [row.colleges] : []));

      setSaved(ids);
      setSavedColleges(colleges);
    } catch (savedError) {
      setError(savedError instanceof Error ? savedError.message : "Unable to load saved colleges.");
    } finally {
      setLoading(false);
    }
  }, [setSaved]);

  const toggleSavedRemote = useCallback(
    async (collegeId: string) => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in to save colleges.");
      }

      if (savedIds.includes(collegeId)) {
        const { error: deleteError } = await supabase
          .from("saved_colleges")
          .delete()
          .eq("user_id", user.id)
          .eq("college_id", collegeId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        const { error: insertError } = await supabase.from("saved_colleges").insert({
          user_id: user.id,
          college_id: collegeId,
        });

        if (insertError) {
          throw insertError;
        }
      }

      toggleSaved(collegeId);
      await reloadSaved();
    },
    [reloadSaved, savedIds, toggleSaved],
  );

  useEffect(() => {
    void reloadSaved();
  }, [reloadSaved]);

  return { savedColleges, loading, error, reloadSaved, toggleSavedRemote };
}
