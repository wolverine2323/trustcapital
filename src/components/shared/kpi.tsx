import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md",
              tone === "accent" ? "bg-accent-soft text-accent-strong" : tone === "warning" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <span className="tabular mt-2 text-[1.45rem] font-semibold leading-tight tracking-tight text-primary">{value}</span>
      {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>{children}</div>;
}
