import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "@/components/forms/new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link_invalid");
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-primary">Crea una nueva contraseña</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Para la cuenta {user.email}.</p>
      <div className="mt-8">
        <NewPasswordForm onDoneHref="/app" />
      </div>
    </div>
  );
}
