"use client";

import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveRequest, rejectRequest, submitRequest } from "../actions";

type Props = {
  requestId: number;
  canSubmit: boolean;
  submitBlocked: string | null;
  canDecide: boolean;
  isOwnRequest: boolean;
};

export function RequestActions({ requestId, canSubmit, submitBlocked, canDecide, isOwnRequest }: Props) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setError(result.ok ? null : (result.error ?? "Something went wrong."));
    });

  if (!canSubmit && !canDecide) return null;

  return (
    <Card>
      <CardContent className="space-y-4">
        {canSubmit && (
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={pending || submitBlocked !== null} onClick={() => run(() => submitRequest(requestId))}>
              {pending ? "Submitting…" : "Submit for approval"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {submitBlocked ?? "A manager will review your supplier choices."}
            </p>
          </div>
        )}

        {canDecide && (
          <div className="space-y-4">
            {isOwnRequest && (
              <Alert>
                <AlertDescription>
                  You created this request. Approving it will be recorded as a self-approval in the audit trail.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={pending} onClick={() => run(() => approveRequest(requestId))}>
                Approve
              </Button>
              <span className="text-sm text-muted-foreground">or send it back with a comment:</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-comment">Comment for the analyst</Label>
              <Textarea
                id="reject-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Use the recommended supplier for the docks."
              />
              <Button
                variant="outline"
                disabled={pending || comment.trim() === ""}
                onClick={() => run(() => rejectRequest(requestId, comment.trim()))}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
