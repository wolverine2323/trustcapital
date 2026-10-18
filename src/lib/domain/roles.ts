export const APP_ROLES = ["ADMIN", "BROKER", "INVESTOR", "BORROWER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Roles que una persona puede elegir al registrarse. ADMIN nunca es autoasignable. */
export const SELF_SERVICE_ROLES = ["BORROWER", "BROKER", "INVESTOR"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrador",
  BROKER: "Broker",
  INVESTOR: "Inversionista",
  BORROWER: "Solicitante",
};

/** Segmento de URL bajo /app para cada rol. */
export const ROLE_SEGMENT: Record<AppRole, string> = {
  ADMIN: "admin",
  BROKER: "broker",
  INVESTOR: "inversionista",
  BORROWER: "solicitante",
};

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: "/app/admin",
  BROKER: "/app/broker",
  INVESTOR: "/app/inversionista",
  BORROWER: "/app/solicitante",
};

/** Parámetro ?tipo= de /registro ↔ rol. */
export const REGISTRATION_TYPES: Record<string, SelfServiceRole> = {
  solicitante: "BORROWER",
  broker: "BROKER",
  inversionista: "INVESTOR",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function resolveActiveRole(primaryRole: string | null | undefined, roles: string[]): AppRole | null {
  if (isAppRole(primaryRole) && roles.includes(primaryRole)) return primaryRole;
  const order: AppRole[] = ["ADMIN", "BROKER", "INVESTOR", "BORROWER"];
  return order.find((r) => roles.includes(r)) ?? null;
}
