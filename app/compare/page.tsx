"use client";

import { Button } from "@/components/ui/button";
import { CompareTable } from "@/components/CompareTable";
import { EmptyState } from "@/components/EmptyState";
import { PageBackground } from "@/components/PageBackground";
import { useCompareStore } from "@/store/useCompareStore";

export default function ComparePage() {
  const { compareList, clearCompare } = useCompareStore();

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <PageBackground variant="beams" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Compare colleges</h1>
            <p className="mt-2 text-muted-foreground">Review up to three colleges side by side.</p>
          </div>
          {compareList.length > 0 ? (
            <Button variant="outline" onClick={clearCompare}>
              Clear all
            </Button>
          ) : null}
        </div>

        {compareList.length < 2 ? (
          <EmptyState message="Choose at least two colleges to compare." ctaLabel="Go explore colleges" ctaHref="/colleges" />
        ) : (
          <CompareTable />
        )}
      </div>
    </div>
  );
}
