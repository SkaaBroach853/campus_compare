"use client";

import Link from "next/link";
import { ArrowRight, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollegeCard } from "@/components/CollegeCard";
import { EmptyState } from "@/components/EmptyState";
import { PageBackground } from "@/components/PageBackground";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useColleges } from "@/hooks/useColleges";
import { useSaved } from "@/hooks/useSaved";

export default function LandingPage() {
  const { colleges, loading, error } = useColleges({ limit: 6 });
  const { toggleSavedRemote } = useSaved();

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <PageBackground variant="pixel-blast" />
      <section className="relative min-h-[500px] overflow-hidden">
        <div className="relative mx-auto flex min-h-[500px] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Campus discovery made focused
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight text-foreground sm:text-6xl">Find Your Perfect College</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Search Indian colleges, compare placements and fees, and save the campuses that fit your goals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/colleges">
                Explore Colleges
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/compare">
                <GitCompare />
                Compare Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Featured colleges</h2>
            <p className="mt-2 text-muted-foreground">A quick look at top-rated options from Supabase.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/colleges">View all</Link>
          </Button>
        </div>

        {error ? (
          <EmptyState message={error} ctaLabel="Browse colleges" ctaHref="/colleges" />
        ) : loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : colleges.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college) => (
              <CollegeCard key={college.id} college={college} onToggleSaved={toggleSavedRemote} />
            ))}
          </div>
        ) : (
          <EmptyState message="No featured colleges found." ctaLabel="Explore colleges" ctaHref="/colleges" />
        )}
      </section>
    </div>
  );
}
