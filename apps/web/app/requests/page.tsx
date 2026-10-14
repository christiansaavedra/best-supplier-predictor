import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { date, statusLabel } from "@/lib/format";
import type { RequestSummary } from "@/lib/types";

export default async function RequestsPage() {
  const requests = await api<RequestSummary[]>("/requests");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Purchase requests</h1>
        <Link href="/requests/new" className={buttonVariants()}>
          New request
        </Link>
      </div>

      <Card>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No requests yet.{" "}
              <Link href="/requests/new" className="underline">
                Create the first one
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Need by</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/requests/${r.id}`} className="font-medium underline-offset-4 hover:underline">
                          #{r.id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-80">
                        <Link
                          href={`/requests/${r.id}`}
                          className="block truncate text-muted-foreground hover:text-foreground"
                        >
                          {r.rawText}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {r.lineCount} {r.lineCount === 1 ? "line" : "lines"}
                        </span>
                      </TableCell>
                      <TableCell>{r.countryName}</TableCell>
                      <TableCell>{date(r.needBy)}</TableCell>
                      <TableCell>{r.createdByName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {statusLabel(r.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
