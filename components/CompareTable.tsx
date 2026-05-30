"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/store/useCompareStore";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function CompareTable() {
  const { compareList, removeFromCompare } = useCompareStore();

  const rows = [
    { label: "Fees", value: (index: number) => currencyFormatter.format(compareList[index].fees) },
    { label: "Placement", value: (index: number) => `${compareList[index].placement_percent}%` },
    { label: "Rating", value: (index: number) => `${compareList[index].rating.toFixed(1)} / 5` },
    { label: "Location", value: (index: number) => compareList[index].location },
    { label: "Courses", value: (index: number) => compareList[index].courses.join(", ") },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/60">
            <th className="w-40 p-4 font-semibold">Criteria</th>
            {compareList.map((college) => (
              <th key={college.id} className="p-4 align-top">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-base font-semibold">{college.name}</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${college.name}`}
                    onClick={() => removeFromCompare(college.id)}
                  >
                    <X />
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b last:border-b-0">
              <td className="p-4 font-medium text-muted-foreground">{row.label}</td>
              {compareList.map((college, index) => (
                <td key={`${college.id}-${row.label}`} className="p-4 align-top">
                  {row.value(index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
