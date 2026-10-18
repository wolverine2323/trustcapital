"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/account";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={disabled} loading={pending} onClick={() => start(async () => void (await markAllNotificationsReadAction()))}>
      <CheckCheck /> Marcar todo como leído
    </Button>
  );
}

export function MarkReadButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" loading={pending} onClick={() => start(async () => void (await markNotificationReadAction(id)))}>
      Marcar como leída
    </Button>
  );
}
