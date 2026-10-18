import { requireRole } from "@/server/session";

export default async function RoleLayout({ children }: { children: React.ReactNode }) {
  await requireRole("BORROWER");
  return children;
}
