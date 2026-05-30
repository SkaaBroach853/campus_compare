"use client";

import { useCallback, useMemo, useState } from "react";
import { CollegeCard } from "@/components/CollegeCard";
import { EmptyState } from "@/components/EmptyState";
import { FilterPanel } from "@/components/FilterPanel";
import { PageBackground } from "@/components/PageBackground";
import { SearchBar } from "@/components/SearchBar";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useColleges } from "@/hooks/useColleges";
import { useSaved } from "@/hooks/useSaved";

const locations = ["All", "Mumbai", "Delhi", "Pilani", "Pune", "Tiruchirappalli", "Vellore", "Manipal", "Patiala", "Hyderabad", "Kolkata"];

export default function CollegesPage() {
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxFees, setMaxFees] = useState(500000);
  const [location, setLocation] = useState("All");
  const filters = useMemo(
    () => ({ search, minRating, maxFees, location }),
    [search, minRating, maxFees, location],
  );
  const { colleges, loading, error } = useColleges(filters);
  const { toggleSavedRemote } = useSaved();
  const handleSearch = useCallback((value: string) => setSearch(value), []);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <PageBackground variant="beams" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Explore colleges</h1>
          <p className="mt-2 text-muted-foreground">Search and filter colleges by rating, fees, and city.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <SearchBar value={search} onChange={handleSearch} />
            <FilterPanel
              minRating={minRating}
              maxFees={maxFees}
              location={location}
              locations={locations}
              onMinRatingChange={setMinRating}
              onMaxFeesChange={setMaxFees}
              onLocationChange={setLocation}
            />
          </div>

          <section>
            {error ? (
              <EmptyState message={error} />
            ) : loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : colleges.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {colleges.map((college) => (
                  <CollegeCard key={college.id} college={college} onToggleSaved={toggleSavedRemote} />
                ))}
              </div>
            ) : (
              <EmptyState message="No colleges match your filters." ctaLabel="Reset filters" ctaHref="/colleges" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
