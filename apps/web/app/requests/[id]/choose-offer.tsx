"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { selectOffer } from "../actions";

export function ChooseOffer({
  requestId,
  lineId,
  offerId,
  recommended,
  supplierName,
}: {
  requestId: number;
  lineId: number;
  offerId: number;
  recommended: boolean;
  supplierName: string;
}) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (overrideReason: string | null) =>
    startTransition(async () => {
      const result = await selectOffer(requestId, lineId, offerId, overrideReason);
      if (result.ok) setAsking(false);
      else setError(result.error);
    });

  if (!asking) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => (recommended ? save(null) : setAsking(true))}
      >
        {pending ? "Saving…" : `Choose ${recommended ? "the recommended supplier" : "this supplier"}`}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`reason-${offerId}`} className="text-sm font-medium">
        Why {supplierName} instead of the recommended supplier?
      </label>
      <Textarea
        id={`reason-${offerId}`}
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. The customer asked for a local supplier."
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={pending || reason.trim() === ""} onClick={() => save(reason.trim())}>
          {pending ? "Saving…" : "Choose with this reason"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setAsking(false)}>
          Cancel
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
