import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewEventForm } from "./new-event-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const defaultOrganizationId = one(sp.organizationId) || undefined;

  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="text-sm font-semibold text-teal-700">
          ← Back to events
        </Link>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Log Event
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Capture the institutional memory: who, where, revenue, and outcome.
        </p>
      </div>

      {organizations.length ? (
        <NewEventForm
          organizations={organizations}
          defaultOrganizationId={defaultOrganizationId}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Add an organization first —{" "}
          <Link href="/organizations/new" className="font-semibold text-teal-700">
            create one
          </Link>
          .
        </div>
      )}
    </div>
  );
}
