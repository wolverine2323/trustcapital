import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <p className="tabular text-sm font-semibold text-accent-strong">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">La página que buscas no existe o aún no está disponible.</p>
      <Button asChild className="mt-6">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
