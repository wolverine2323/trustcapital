import { Alert } from "@/components/ui/alert";
import type { ActionResult } from "@/server/actions/types";

export function FormStatus({ result, hideSuccess }: { result: ActionResult<unknown> | null; hideSuccess?: boolean }) {
  if (!result) return null;
  if (result.ok) {
    if (hideSuccess || !result.message) return null;
    return <Alert tone="success">{result.message}</Alert>;
  }
  return <Alert tone="danger">{result.message}</Alert>;
}
