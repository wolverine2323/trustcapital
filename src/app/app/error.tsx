"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
      <AlertTriangle className="size-8 text-warning" />
      <h1 className="mt-3 text-lg font-semibold text-primary">No pudimos cargar esta sección</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">Inténtalo de nuevo. Si el problema persiste, contacta a Trust Capital.</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">Referencia: {error.digest}</p>}
      <Button onClick={reset} className="mt-5">Reintentar</Button>
    </div>
  );
}
