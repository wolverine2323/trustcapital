import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChecklistState = "done" | "pending" | "waiting";

export function Checklist({ items }: { items: { label: string; description?: string; state: ChecklistState }[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const Icon = item.state === "done" ? CheckCircle2 : item.state === "waiting" ? Clock : Circle;
        return (
          <li key={item.label} className={cn("flex gap-3 py-3", i > 0 && "border-t border-border")}>
            <Icon
              className={cn(
                "mt-0.5 size-[18px] shrink-0",
                item.state === "done" ? "text-success" : item.state === "waiting" ? "text-warning" : "text-muted-foreground/60",
              )}
              aria-hidden
            />
            <div>
              <p className={cn("text-sm font-medium", item.state === "done" && "text-muted-foreground line-through decoration-muted-foreground/40")}>
                {item.label}
                <span className="sr-only">{item.state === "done" ? " (completado)" : item.state === "waiting" ? " (en espera)" : " (pendiente)"}</span>
              </p>
              {item.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{item.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
