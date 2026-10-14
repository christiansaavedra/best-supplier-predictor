"use client";

import { DEMO_SCENARIOS, type MatchStatus, type ParseResult, type ProductOption } from "@copilot/shared";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Catalog } from "@/lib/types";
import { createRequest, parseText } from "../actions";

type Line = {
  key: number;
  description: string;
  quantity: number;
  productId: number | null;
  matchStatus: MatchStatus;
  candidates: ProductOption[];
};

type Draft = { countryCode: string; needBy: string; lines: Line[]; mockAi: boolean; warning: string | null };

const NOT_IN_CATALOG = "none";
const selectClass = "h-8 w-full rounded-md border bg-background px-2 text-sm";

let nextKey = 0;

function toDraft(result: ParseResult): Draft {
  return {
    countryCode: result.countryCode ?? "",
    needBy: result.needBy ?? "",
    mockAi: result.mockAi,
    warning: result.warning,
    lines: result.lines.map((l) => ({ ...l, key: nextKey++ })),
  };
}

export function IntakeForm({ catalog }: { catalog: Catalog }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, startParsing] = useTransition();
  const [creating, startCreating] = useTransition();

  const read = (value: string) => {
    setError(null);
    startParsing(async () => {
      const result = await parseText(value);
      if (result.ok) setDraft(toDraft(result.data));
      else setError(result.error);
    });
  };

  const updateLine = (key: number, patch: Partial<Line>) =>
    setDraft((d) => d && { ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });

  const problems = draft ? validate(draft) : [];

  const submit = () => {
    if (!draft || problems.length > 0) return;
    setError(null);
    startCreating(async () => {
      const result = await createRequest({
        rawText: text,
        countryCode: draft.countryCode,
        needBy: draft.needBy,
        lines: draft.lines.map((l) =>
          l.productId === null
            ? { matchStatus: "not_found", description: l.description, quantity: l.quantity, productId: null }
            : { matchStatus: "matched", description: l.description, quantity: l.quantity, productId: l.productId },
        ),
      });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="space-y-6">
      <DemoPanel
        onTry={(t) => {
          setText(t);
          read(t);
        }}
        disabled={parsing}
      />

      <Card>
        <CardContent className="space-y-3">
          <Label htmlFor="request-text">Request</Label>
          <Textarea
            id="request-text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Customer needs 30 HP EliteBook laptops delivered to Monterrey by December 1."
          />
          <div className="flex items-center gap-3">
            <Button onClick={() => read(text)} disabled={parsing || text.trim() === ""}>
              {parsing ? "Reading…" : "Read request"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDraft({ countryCode: "", needBy: "", mockAi: false, warning: null, lines: [] })}
              disabled={parsing}
            >
              Fill in by hand
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {draft && (
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Review</h2>
              {draft.mockAi && <Badge variant="outline">Mock AI</Badge>}
            </div>

            {draft.warning && (
              <Alert>
                <AlertDescription>{draft.warning}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="country">Destination country</Label>
                <select
                  id="country"
                  className={selectClass}
                  value={draft.countryCode}
                  onChange={(e) => setDraft({ ...draft, countryCode: e.target.value })}
                >
                  <option value="">Choose a country…</option>
                  {catalog.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="need-by">Need by</Label>
                <Input
                  id="need-by"
                  type="date"
                  value={draft.needBy}
                  onChange={(e) => setDraft({ ...draft, needBy: e.target.value })}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>As requested</TableHead>
                    <TableHead className="min-w-56">Product</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.lines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell>
                        <Input
                          aria-label="Description"
                          value={line.description}
                          onChange={(e) => updateLine(line.key, { description: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductSelect
                          line={line}
                          products={catalog.products}
                          onChange={(patch) => updateLine(line.key, patch)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label="Quantity"
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={line.matchStatus} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {catalog.products.find((p) => p.id === line.productId)?.sku ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDraft({ ...draft, lines: draft.lines.filter((l) => l.key !== line.key) })}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  lines: [
                    ...draft.lines,
                    {
                      key: nextKey++,
                      description: "",
                      quantity: 1,
                      productId: null,
                      matchStatus: "ambiguous",
                      candidates: [],
                    },
                  ],
                })
              }
            >
              Add line
            </Button>

            {draft.lines.some((l) => l.matchStatus === "not_found") && (
              <p className="text-sm text-muted-foreground">
                Lines not in the catalog are saved with the request to track unmet demand, but they are not ranked.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button onClick={submit} disabled={creating || problems.length > 0}>
                {creating ? "Creating and ranking suppliers…" : "Create request"}
              </Button>
              {problems.length > 0 && <p className="text-sm text-muted-foreground">{problems.join(" · ")}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function validate(draft: Draft): string[] {
  const problems: string[] = [];
  if (!draft.countryCode) problems.push("Choose a country");
  if (!draft.needBy) problems.push("Set a need-by date");
  if (draft.lines.length === 0) problems.push("Add at least one line");
  if (draft.lines.some((l) => l.matchStatus === "ambiguous")) problems.push("Pick a product for every line");
  if (!draft.lines.some((l) => l.matchStatus === "matched") && draft.lines.length > 0)
    problems.push("At least one line must be in the catalog");
  return problems;
}

function ProductSelect({
  line,
  products,
  onChange,
}: {
  line: Line;
  products: ProductOption[];
  onChange: (patch: Partial<Line>) => void;
}) {
  const value = line.productId?.toString() ?? (line.matchStatus === "not_found" ? NOT_IN_CATALOG : "");
  return (
    <select
      aria-label="Product"
      className={selectClass}
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value === NOT_IN_CATALOG
            ? { productId: null, matchStatus: "not_found" }
            : { productId: Number(e.target.value), matchStatus: "matched" },
        )
      }
    >
      {value === "" && (
        <option value="" disabled>
          Choose a product…
        </option>
      )}
      <option value={NOT_IN_CATALOG}>Not in catalog</option>
      {line.candidates.length > 0 && (
        <optgroup label="Search results">
          {line.candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="All products">
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

const STATUS: Record<MatchStatus, { label: string; className: string }> = {
  matched: { label: "Matched", className: "bg-emerald-100 text-emerald-800" },
  ambiguous: { label: "Pick a product", className: "bg-amber-100 text-amber-800" },
  not_found: { label: "Not in catalog", className: "bg-zinc-200 text-zinc-700" },
};

function StatusBadge({ status }: { status: MatchStatus }) {
  return <Badge className={STATUS[status].className}>{STATUS[status].label}</Badge>;
}

function DemoPanel({ onTry, disabled }: { onTry: (text: string) => void; disabled: boolean }) {
  return (
    <details open className="rounded-xl border border-dashed bg-background p-4">
      <summary className="cursor-pointer font-medium">
        Demo scenarios <span className="font-normal text-muted-foreground">· prepared requests for reviewers</span>
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {DEMO_SCENARIOS.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="font-medium">{s.title}</p>
            <p className="text-sm text-muted-foreground italic">“{s.text}”</p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {s.lookFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="mt-auto self-start"
              onClick={() => onTry(s.text)}
              disabled={disabled}
            >
              Try it
            </Button>
          </div>
        ))}
      </div>
    </details>
  );
}
