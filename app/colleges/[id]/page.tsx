"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GitCompare, Heart, MapPin, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";
import { useCompareStore } from "@/store/useCompareStore";
import { useSaved } from "@/hooks/useSaved";
import { useSavedStore } from "@/store/useSavedStore";
import type { College } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function CollegeDetailPage() {
  const params = useParams<{ id: string }>();
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { compareList, addToCompare, removeFromCompare } = useCompareStore();
  const { savedIds } = useSavedStore();
  const { toggleSavedRemote } = useSaved();

  useEffect(() => {
    async function loadCollege() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: collegeError } = await supabase
          .from("colleges")
          .select("*")
          .eq("id", params.id)
          .single();

        if (collegeError) {
          throw collegeError;
        }

        setCollege(data as College);
      } catch (detailError) {
        setError(detailError instanceof Error ? detailError.message : "Unable to load this college.");
      } finally {
        setLoading(false);
      }
    }

    void loadCollege();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-80 w-full" />
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState message={error ?? "College not found."} ctaLabel="Back to colleges" ctaHref="/colleges" />
      </div>
    );
  }

  const isCompared = compareList.some((item) => item.id === college.id);
  const isSaved = savedIds.includes(college.id);
  const compareDisabled = !isCompared && compareList.length >= 3;

  const handleSave = async () => {
    setActionError(null);
    setIsSaving(true);

    try {
      await toggleSavedRemote(college.id);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Unable to update saved colleges. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompare = () => {
    setActionError(null);

    if (compareDisabled) {
      setActionError("You can compare up to 3 colleges at a time. Remove one from Compare first.");
      return;
    }

    if (isCompared) {
      removeFromCompare(college.id);
      return;
    }

    addToCompare(college);
  };

  return (
    <div>
      <section className="relative min-h-[420px] overflow-hidden">
        <Image src={college.image_url} alt={college.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-4 py-10 text-white sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-white/80">
            <MapPin className="size-4" />
            {college.location}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold sm:text-5xl">{college.name}</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleSave} disabled={isSaving}>
              <Heart className={isSaved ? "fill-current" : ""} />
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCompare}
              title={compareDisabled ? "You can compare up to 3 colleges at a time." : undefined}
            >
              <GitCompare />
              {isCompared ? "Remove from Compare" : "Add to Compare"}
            </Button>
          </div>
          {actionError ? (
            <p className="mt-4 max-w-xl rounded-md bg-white/15 p-3 text-sm text-white backdrop-blur">
              {actionError}{" "}
              {actionError.toLowerCase().includes("log in") ? (
                <Link href="/login" className="font-semibold underline underline-offset-4">
                  Login
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Annual fees</p>
            <p className="mt-2 text-2xl font-semibold">{currencyFormatter.format(college.fees)}</p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Star className="size-5 fill-amber-400 text-amber-400" />
              {college.rating.toFixed(1)} / 5
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">Placement</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <TrendingUp className="size-5 text-primary" />
              {college.placement_percent}%
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-2xl font-semibold">About</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{college.description}</p>
          </div>
          <aside className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">Courses</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {college.courses.map((course) => (
                <span key={course} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  {course}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
