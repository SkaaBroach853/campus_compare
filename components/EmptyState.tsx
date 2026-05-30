import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ message, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-4 rounded-full bg-secondary p-3 text-secondary-foreground">
        <Compass className="size-7" />
      </div>
      <p className="max-w-md text-base font-medium text-foreground">{message}</p>
      {ctaLabel && ctaHref ? (
        <Button asChild className="mt-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
