import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateTime } from "@/lib/format";
import type { ApprovalEvent } from "@/lib/types";

const VERB: Record<ApprovalEvent["action"], string> = {
  submitted: "submitted it for approval",
  approved: "approved it",
  rejected: "sent it back",
};

export function AuditTrail({
  createdByName,
  createdAt,
  events,
}: {
  createdByName: string;
  createdAt: string;
  events: ApprovalEvent[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          <li>
            <span className="text-muted-foreground">{dateTime(createdAt)}</span> · {createdByName} created the request
          </li>
          {events.map((e) => (
            <li key={e.id}>
              <span className="text-muted-foreground">{dateTime(e.createdAt)}</span> · {e.userName} {VERB[e.action]}
              {e.selfApproval && (
                <Badge variant="outline" className="ml-2">
                  Self-approval
                </Badge>
              )}
              {e.comment && <p className="mt-1 border-l-2 pl-3 text-muted-foreground">“{e.comment}”</p>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
