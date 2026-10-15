import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { date, statusLabel } from "@/lib/format";
import type { RequestDetail, User } from "@/lib/types";
import { AuditTrail } from "./audit-trail";
import { LineRanking } from "./line-ranking";
import { RankButton } from "./rank-button";
import { RequestActions } from "./request-actions";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let request: RequestDetail;
  try {
    request = await api<RequestDetail>(`/requests/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const me = await api<User>("/me");
  const canWrite = me.role === "analyst" || me.role === "manager";
  const editable = canWrite && (request.status === "draft" || request.status === "rejected");
  const canDecide = me.role === "manager" && request.status === "pending_approval";

  // Ranking runs when the request is created. This button only covers a failed first run.
  const unranked =
    request.status === "draft" && request.lines.some((l) => l.productLabel !== null && l.rankingStatus === null);

  const orderable = request.lines.filter((l) => l.rankingStatus === "ranked" || l.rankingStatus === "late");
  const submitBlocked =
    orderable.length === 0
      ? "No line has a supplier to order from."
      : orderable.some((l) => l.selectedOfferId === null)
        ? "Choose a supplier for every line first."
        : null;

  const lastRejection =
    request.status === "rejected" ? request.events.findLast((e) => e.action === "rejected") : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Request #{request.id}</h1>
          <Badge variant="secondary" className="capitalize">
            {statusLabel(request.status)}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          To {request.countryName} · need by {date(request.needBy)} · created by {request.createdByName}
        </p>
        {request.rawText ? (
          <blockquote className="border-l-2 pl-4 text-sm text-muted-foreground italic">{request.rawText}</blockquote>
        ) : (
          <p className="text-sm text-muted-foreground italic">Entered by hand.</p>
        )}
      </div>

      {lastRejection && (
        <Alert>
          <AlertDescription>
            <span className="font-medium">{lastRejection.userName} sent this back:</span> “{lastRejection.comment}”
            Change the supplier choices below and submit again.
          </AlertDescription>
        </Alert>
      )}

      {unranked && canWrite && <RankButton requestId={request.id} label="Rank suppliers" />}

      <div className="space-y-4">
        {request.lines.map((line) => (
          <LineRanking
            key={line.id}
            line={line}
            requestId={request.id}
            countryName={request.countryName}
            needBy={request.needBy}
            editable={editable}
          />
        ))}
      </div>

      <RequestActions
        requestId={request.id}
        canSubmit={editable}
        submitBlocked={submitBlocked}
        canDecide={canDecide}
        isOwnRequest={request.createdBy === me.id}
      />

      <AuditTrail createdByName={request.createdByName} createdAt={request.createdAt} events={request.events} />
    </div>
  );
}
