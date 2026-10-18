"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/server/actions/types";

/**
 * Envía un formulario de React Hook Form a una Server Action y refleja
 * los errores del servidor en los campos. El servidor siempre vuelve a validar.
 */
export function useActionForm<TInput extends FieldValues, TOutput, TData = undefined>(
  form: UseFormReturn<TInput, unknown, TOutput>,
  action: (values: TOutput) => Promise<ActionResult<TData>>,
  options?: { onSuccess?: (result: Extract<ActionResult<TData>, { ok: true }>) => void },
) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<TData> | null>(null);

  const onSubmit = form.handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await action(values);
        if (!res) return; // la acción redirigió
        setResult(res);
        if (res.ok) {
          options?.onSuccess?.(res);
        } else if (res.fieldErrors) {
          for (const [name, message] of Object.entries(res.fieldErrors)) {
            form.setError(name as Path<TInput>, { type: "server", message });
          }
        }
      } catch (error) {
        // Las redirecciones de Next.js se propagan como errores especiales.
        if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        setResult({ ok: false, message: "Ocurrió un error inesperado. Inténtalo de nuevo." });
      }
    });
  });

  return { onSubmit, pending, result, setResult };
}
