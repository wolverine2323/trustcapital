import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, isAppRole } from "@/lib/domain/roles";

const ROLE_TONE = { ADMIN: "navy", BROKER: "accent", INVESTOR: "info", BORROWER: "neutral" } as const;

export function RoleBadge({ role }: { role: string | null }) {
  if (!isAppRole(role)) return <Badge tone="warning">Sin rol</Badge>;
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>;
}

const BROKER_STATUS = {
  pending: { tone: "warning", label: "Pendiente" },
  approved: { tone: "success", label: "Aprobado" },
  suspended: { tone: "danger", label: "Suspendido" },
  rejected: { tone: "danger", label: "Rechazado" },
} as const;

export function BrokerStatusBadge({ status }: { status: keyof typeof BROKER_STATUS }) {
  const s = BROKER_STATUS[status] ?? BROKER_STATUS.pending;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
