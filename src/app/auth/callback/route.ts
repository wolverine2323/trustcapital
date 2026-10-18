import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

/** Intercambia el código PKCE de los enlaces de correo (confirmación y recuperación) por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const errorDescription = searchParams.get("error_code") ?? "link_invalid";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
}
