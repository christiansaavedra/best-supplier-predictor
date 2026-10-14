"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rankRequest } from "../actions";

export function RankButton({ requestId, label }: { requestId: number; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await rankRequest(requestId);
            setError(result.ok ? null : result.error);
          })
        }
      >
        {pending ? "Ranking…" : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
