"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollegeCard } from "@/components/CollegeCard";
import { EmptyState } from "@/components/EmptyState";
import { PageBackground } from "@/components/PageBackground";
import { SkeletonCard } from "@/components/SkeletonCard";
import { createClient } from "@/lib/supabase";
import { useSaved } from "@/hooks/useSaved";

export default function SavedPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { savedColleges, loading, error, toggleSavedRemote } = useSaved();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    void checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="relative isolate min-h-screen overflow-hidden">
        <PageBackground variant="beams" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <PageBackground variant="beams" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Saved colleges</h1>
          <p className="mt-2 text-muted-foreground">Your personal shortlist for later review.</p>
        </div>

        {error ? (
          <EmptyState message={error} ctaLabel="Explore colleges" ctaHref="/colleges" />
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : savedColleges.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedColleges.map((college) => (
              <CollegeCard key={college.id} college={college} onToggleSaved={toggleSavedRemote} />
            ))}
          </div>
        ) : (
          <EmptyState message="You have not saved any colleges yet." ctaLabel="Explore colleges" ctaHref="/colleges" />
        )}
      </div>
    </div>
  );
}
