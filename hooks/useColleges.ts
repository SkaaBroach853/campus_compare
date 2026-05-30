"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { College } from "@/types";

export interface CollegeFilters {
  search?: string;
  minRating?: number;
  maxFees?: number;
  location?: string;
  limit?: number;
}

interface CollegesState {
  colleges: College[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useColleges(filters: CollegeFilters = {}): CollegesState {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase.from("colleges").select("*").order("rating", { ascending: false });

      if (filters.search?.trim()) {
        query = query.ilike("name", `%${filters.search.trim()}%`);
      }

      if (filters.minRating && filters.minRating > 0) {
        query = query.gte("rating", filters.minRating);
      }

      if (filters.maxFees && filters.maxFees > 0) {
        query = query.lte("fees", filters.maxFees);
      }

      if (filters.location && filters.location !== "All") {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: collegesError } = await query;

      if (collegesError) {
        throw collegesError;
      }

      setColleges((data ?? []) as College[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load colleges.");
      setColleges([]);
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.maxFees, filters.minRating, filters.search, filters.limit]);

  useEffect(() => {
    void fetchColleges();
  }, [fetchColleges]);

  return { colleges, loading, error, refetch: fetchColleges };
}
