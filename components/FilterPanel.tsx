"use client";

import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterPanelProps {
  minRating: number;
  maxFees: number;
  location: string;
  locations: string[];
  onMinRatingChange: (rating: number) => void;
  onMaxFeesChange: (fees: number) => void;
  onLocationChange: (location: string) => void;
}

export function FilterPanel({
  minRating,
  maxFees,
  location,
  locations,
  onMinRatingChange,
  onMaxFeesChange,
  onLocationChange,
}: FilterPanelProps) {
  return (
    <aside className="space-y-5 rounded-lg border bg-card p-4 text-card-foreground">
      <div>
        <Label>Minimum rating</Label>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onMinRatingChange(minRating === rating ? 0 : rating)}
              className="rounded-md p-1 text-amber-500 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Filter by ${rating} stars and above`}
            >
              <Star className={rating <= minRating ? "size-5 fill-current" : "size-5"} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="fees">Maximum fees</Label>
        <Input
          id="fees"
          type="range"
          min={0}
          max={500000}
          step={25000}
          value={maxFees}
          onChange={(event) => onMaxFeesChange(Number(event.target.value))}
          className="mt-3 h-2 cursor-pointer p-0"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Up to {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(maxFees)}
        </p>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <select
          id="location"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30"
        >
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
