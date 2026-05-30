"use client";

import Link from "next/link";
import { GitCompare, Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";
import PixelCard from "@/components/PixelCard";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/store/useCompareStore";
import { useSavedStore } from "@/store/useSavedStore";
import type { College } from "@/types";

interface CollegeCardProps {
  college: College;
  onToggleSaved?: (id: string) => Promise<void> | void;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function CollegeCard({ college, onToggleSaved }: CollegeCardProps) {
  const { compareList, addToCompare, removeFromCompare } = useCompareStore();
  const { savedIds, toggleSaved } = useSavedStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isCompared = compareList.some((item) => item.id === college.id);
  const isSaved = savedIds.includes(college.id);
  const compareDisabled = !isCompared && compareList.length >= 3;

  const handleSave = async () => {
    setActionError(null);
    setIsSaving(true);

    try {
      if (onToggleSaved) {
        await onToggleSaved(college.id);
        return;
      }

      toggleSaved(college.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update saved colleges. Please try again.");
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
    <article className="group overflow-hidden rounded-lg border bg-card/95 text-card-foreground shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
      <Link href={`/colleges/${college.id}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-950">
          <PixelCard variant="pink" className="absolute inset-0 rounded-none border-0">
            <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
              <h2 className="max-w-full text-balance text-2xl font-extrabold leading-tight tracking-normal text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                {college.name}
              </h2>
            </div>
          </PixelCard>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div className="flex min-h-6 items-center justify-center text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4" />
            {college.location}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="min-w-0 rounded-md bg-secondary p-2 text-center">
            <p className="text-xs text-muted-foreground">Fees</p>
            <p className="truncate font-semibold">{currencyFormatter.format(college.fees)}</p>
          </div>
          <div className="min-w-0 rounded-md bg-secondary p-2 text-center">
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="flex items-center justify-center gap-1 font-semibold">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {college.rating.toFixed(1)}
            </p>
          </div>
          <div className="min-w-0 rounded-md bg-secondary p-2 text-center">
            <p className="text-xs text-muted-foreground">Placement</p>
            <p className="font-semibold">{college.placement_percent}%</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={isSaved ? "secondary" : "outline"} className="flex-1" onClick={handleSave} disabled={isSaving}>
            <Heart className={isSaved ? "fill-current" : ""} />
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            variant={isCompared ? "secondary" : "outline"}
            className="flex-1"
            onClick={handleCompare}
            title={compareDisabled ? "You can compare up to 3 colleges at a time." : undefined}
          >
            <GitCompare />
            {isCompared ? "Added" : "Compare"}
          </Button>
        </div>
        {actionError ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {actionError}{" "}
            {actionError.toLowerCase().includes("log in") ? (
              <Link href="/login" className="font-medium underline underline-offset-4">
                Login
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  );
}
