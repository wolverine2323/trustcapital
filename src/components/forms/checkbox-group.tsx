"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { cn } from "@/lib/utils";

export function CheckboxGroup<T extends FieldValues>({
  control,
  name,
  options,
  columns = 2,
}: {
  control: Control<T, unknown, unknown>;
  name: Path<T>;
  options: readonly { value: string; label: string }[];
  columns?: 2 | 3;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : [];
        return (
          <div className={cn("grid gap-2", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    checked ? "border-accent bg-accent-soft text-foreground" : "border-input bg-card hover:bg-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent-strong)]"
                    checked={checked}
                    onChange={(e) =>
                      field.onChange(e.target.checked ? [...selected, opt.value] : selected.filter((v) => v !== opt.value))
                    }
                    onBlur={field.onBlur}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        );
      }}
    />
  );
}
