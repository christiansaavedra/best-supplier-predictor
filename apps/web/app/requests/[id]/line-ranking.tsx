import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { date, money } from "@/lib/format";
import type { Flag, Recommendation, RequestLine } from "@/lib/types";
import { ChooseOffer } from "./choose-offer";

const FLAGS: Record<Flag, { label: string; className: string }> = {
  late: { label: "Late", className: "bg-red-100 text-red-800" },
  price_outdated: { label: "Price may be outdated", className: "bg-amber-100 text-amber-800" },
  new_supplier: { label: "New supplier", className: "bg-sky-100 text-sky-800" },
};

const FACTORS = [
  { key: "price", label: "Price", weight: "45%" },
  { key: "track", label: "Delivery record", weight: "30%" },
  { key: "lead", label: "Lead time", weight: "15%" },
  { key: "risk", label: "Route risk", weight: "10%" },
] as const;

export function LineRanking({
  line,
  requestId,
  countryName,
  needBy,
  editable,
}: {
  line: RequestLine;
  requestId: number;
  countryName: string;
  needBy: string;
  editable: boolean;
}) {
  const mock = line.recommendations.some((r) => r.model === "mock");
  const explanationMissing =
    line.recommendations.length > 0 && line.recommendations.every((r) => r.explanation === null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {line.productLabel ?? line.description}
          <span className="font-normal text-muted-foreground">× {line.quantity}</span>
          {line.sku && <span className="font-mono text-xs font-normal text-muted-foreground">{line.sku}</span>}
          {mock && <Badge variant="outline">Mock AI</Badge>}
        </CardTitle>
        {line.productLabel && line.description !== line.productLabel && (
          <p className="text-sm text-muted-foreground">Requested as “{line.description}”</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {line.productLabel === null && (
          <p className="text-sm text-muted-foreground">Not in the catalog. Saved to track unmet demand; not ranked.</p>
        )}
        {line.productLabel !== null && line.rankingStatus === null && (
          <p className="text-sm text-muted-foreground">Not ranked yet.</p>
        )}
        {line.rankingStatus === "no_offers" && (
          <Alert>
            <AlertDescription>No supplier offers this product for delivery to {countryName}.</AlertDescription>
          </Alert>
        )}
        {line.rankingStatus === "late" && (
          <Alert>
            <AlertDescription>
              No supplier can deliver by {date(needBy)}. Showing the fastest offers instead; consider asking the
              customer for more time.
            </AlertDescription>
          </Alert>
        )}
        {explanationMissing && (
          <p className="text-sm text-muted-foreground">
            Explanation unavailable: the AI service did not respond. Scores are still valid.
          </p>
        )}

        <ol className="space-y-3">
          {line.recommendations.map((rec) => (
            <OfferRow key={rec.offerId} rec={rec} line={line} requestId={requestId} editable={editable} />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function OfferRow({
  rec,
  line,
  requestId,
  editable,
}: {
  rec: Recommendation;
  line: RequestLine;
  requestId: number;
  editable: boolean;
}) {
  const { offer } = rec;
  const { quantity } = line;
  const top = rec.rank === 1;
  const selected = line.selectedOfferId === rec.offerId;
  return (
    <li className={`rounded-lg border p-4 ${selected ? "border-primary bg-primary/5 ring-1 ring-primary/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">#{rec.rank}</span>
            <span className="font-medium">{offer.supplierName}</span>
            <span className="text-xs text-muted-foreground">ships from {offer.supplierCountry}</span>
            {top && <Badge variant={selected ? "default" : "outline"}>Recommended</Badge>}
            {selected && <Badge className="bg-foreground text-background">Selected</Badge>}
            {rec.flags.map((f) => (
              <Badge key={f} className={FLAGS[f].className}>
                {FLAGS[f].label}
              </Badge>
            ))}
          </div>
          <p className="text-sm">
            {money(offer.unitPrice * quantity, offer.currency)}
            {offer.currency !== "USD" && (
              <span className="text-muted-foreground"> ≈ {money(offer.totalUsd, "USD")}</span>
            )}
            <span className="text-muted-foreground">
              {" "}
              · arrives {date(offer.arrivesOn)} ({offer.leadTimeDays} days) ·{" "}
              {offer.pastDeliveries === 0
                ? "no past deliveries to this country"
                : offer.pastOnTime === undefined
                  ? `${Math.round(offer.onTimeRate * 100)}% on time`
                  : `${offer.pastOnTime} of ${offer.pastDeliveries} past deliveries on time`}
            </span>
          </p>
        </div>
        {rec.score !== null && (
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">{Math.round(rec.score * 100)}</div>
            <div className="text-xs text-muted-foreground">score</div>
          </div>
        )}
      </div>

      {rec.breakdown && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {FACTORS.map((f) => (
            <div key={f.key}>
              <dt className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {f.label} <span className="opacity-70">({f.weight})</span>
                </span>
                <span className="tabular-nums">{Math.round(rec.breakdown![f.key] * 100)}</span>
              </dt>
              <dd className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.round(rec.breakdown![f.key] * 100)}%` }}
                />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {rec.explanation && <p className="mt-3 text-sm">{rec.explanation}</p>}

      {selected && line.overrideReason && (
        <p className="mt-3 border-l-2 border-primary pl-3 text-sm">
          <span className="font-medium">Chosen over the recommendation:</span> {line.overrideReason}
        </p>
      )}
      {editable && !selected && (
        <div className="mt-3">
          <ChooseOffer
            requestId={requestId}
            lineId={line.id}
            offerId={rec.offerId}
            recommended={top}
            supplierName={offer.supplierName}
          />
        </div>
      )}
    </li>
  );
}
