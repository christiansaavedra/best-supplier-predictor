import { api } from "@/lib/api";
import type { Catalog, User } from "@/lib/types";
import { IntakeForm } from "./intake-form";

export default async function NewRequestPage() {
  const me = await api<User>("/me");
  if (me.role !== "analyst" && me.role !== "manager") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">New purchase request</h1>
        <p className="text-muted-foreground">
          Only analysts and managers can create requests. Switch user in the header to try it.
        </p>
      </div>
    );
  }

  const catalog = await api<Catalog>("/catalog");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New purchase request</h1>
        <p className="mt-1 text-muted-foreground">
          Paste the customer&apos;s request. Products are matched to the catalog; review them before creating the
          request.
        </p>
      </div>
      <IntakeForm catalog={catalog} />
    </div>
  );
}
