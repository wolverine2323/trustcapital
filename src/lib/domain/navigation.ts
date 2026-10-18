import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  FileText,
  FolderOpen,
  Gauge,
  Handshake,
  Heart,
  Landmark,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  PlusCircle,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "./roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Fase en la que el módulo queda disponible. Si es posterior a la actual se muestra deshabilitado. */
  phase?: number;
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/** Fase actualmente desplegada. */
export const CURRENT_PHASE = 1;

export const ROLE_NAVIGATION: Record<AppRole, NavSection[]> = {
  BROKER: [
    {
      items: [
        { label: "Dashboard", href: "/app/broker", icon: LayoutDashboard, exact: true },
        { label: "Mis casos", href: "/app/broker/casos", icon: Briefcase, phase: 2 },
        { label: "Nuevo caso", href: "/app/broker/casos/nuevo", icon: PlusCircle, phase: 2 },
        { label: "Comisiones", href: "/app/broker/comisiones", icon: Wallet, phase: 4 },
        { label: "Acuerdos", href: "/app/broker/acuerdos", icon: Handshake, phase: 2 },
      ],
    },
  ],
  BORROWER: [
    {
      items: [
        { label: "Inicio", href: "/app/solicitante", icon: LayoutDashboard, exact: true },
        { label: "Mis solicitudes", href: "/app/solicitante/solicitudes", icon: FileText, phase: 2 },
        { label: "Nueva solicitud", href: "/app/solicitante/nueva", icon: PlusCircle, phase: 2 },
        { label: "Documentos", href: "/app/solicitante/documentos", icon: FolderOpen, phase: 2 },
      ],
    },
  ],
  INVESTOR: [
    {
      items: [
        { label: "Inicio", href: "/app/inversionista", icon: LayoutDashboard, exact: true },
        { label: "Oportunidades", href: "/app/inversionista/oportunidades", icon: Store, phase: 3 },
        { label: "Favoritos", href: "/app/inversionista/favoritos", icon: Heart, phase: 3 },
        { label: "Intereses", href: "/app/inversionista/intereses", icon: Search, phase: 3 },
        { label: "Inversiones", href: "/app/inversionista/inversiones", icon: PiggyBank, phase: 4 },
        { label: "Preferencias", href: "/app/inversionista/preferencias", icon: SlidersHorizontal },
      ],
    },
  ],
  ADMIN: [
    {
      items: [{ label: "Dashboard", href: "/app/admin", icon: Gauge, exact: true }],
    },
    {
      title: "Originación",
      items: [
        { label: "Casos", href: "/app/admin/casos", icon: Briefcase, phase: 2 },
        { label: "Solicitudes", href: "/app/admin/solicitudes", icon: ListChecks, phase: 2 },
        { label: "Documentos", href: "/app/admin/documentos", icon: FolderOpen, phase: 2 },
      ],
    },
    {
      title: "Marketplace",
      items: [
        { label: "Oportunidades", href: "/app/admin/oportunidades", icon: Store, phase: 3 },
        { label: "Operaciones", href: "/app/admin/operaciones", icon: Landmark, phase: 4 },
        { label: "Comisiones", href: "/app/admin/comisiones", icon: Wallet, phase: 4 },
        { label: "Reportes", href: "/app/admin/reportes", icon: BarChart3, phase: 4 },
      ],
    },
    {
      title: "Personas",
      items: [
        { label: "Usuarios", href: "/app/admin/usuarios", icon: Users },
        { label: "Brokers", href: "/app/admin/brokers", icon: Building2, phase: 2 },
        { label: "Inversionistas", href: "/app/admin/inversionistas", icon: PiggyBank, phase: 3 },
        { label: "Solicitantes", href: "/app/admin/solicitantes", icon: User, phase: 2 },
      ],
    },
    {
      title: "Sistema",
      items: [
        { label: "Configuración", href: "/app/admin/configuracion", icon: Settings },
        { label: "Auditoría", href: "/app/admin/auditoria", icon: ScrollText },
      ],
    },
  ],
};

export const ACCOUNT_NAVIGATION: NavItem[] = [
  { label: "Notificaciones", href: "/app/notificaciones", icon: Bell },
  { label: "Mi perfil", href: "/app/perfil", icon: User },
  { label: "Seguridad", href: "/app/seguridad", icon: ShieldCheck },
];
