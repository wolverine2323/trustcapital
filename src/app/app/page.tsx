import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/lib/domain/roles";
import { requireSession } from "@/server/session";

export default async function AppIndex() {
  const session = await requireSession();
  redirect(session.activeRole ? ROLE_HOME[session.activeRole] : "/login");
}
