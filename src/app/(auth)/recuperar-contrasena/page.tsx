import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a ingresar
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary">Recuperar contraseña</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Te enviaremos un enlace para crear una nueva contraseña.</p>
      <div className="mt-8">
        <RecoverForm />
      </div>
    </div>
  );
}
