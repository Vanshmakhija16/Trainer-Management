import { AssignmentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { assignmentStatuses, statusBadgeClasses, statusLabels } from "@/lib/status";
import { NewAssignmentForm } from "./new-assignment-form";
import { deleteAssignment, updateAssignment } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDateInput(date: Date | null) {
  // Guard against null and invalid Date values (toISOString throws on those).
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const trainerId = one(sp.trainerId) || undefined;
  const organizationId =
    one(sp.organizationId) || one(sp.universityId) || undefined;
  const statusFilter = one(sp.status) as AssignmentStatus | undefined;

  const [trainers, organizations, assignments] = await Promise.all([
    prisma.trainer.findMany({ orderBy: { name: "asc" } }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.assignment.findMany({
      where: {
        trainerId,
        organizationId,
        status: statusFilter,
      },
      orderBy: { createdAt: "desc" },
      include: { trainer: true, organization: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Assignments</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Assignment Management
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Assign trainers to organizations, update pipeline status, schedule
          interviews, and add remarks.
        </p>
      </div>

      <NewAssignmentForm
        trainers={trainers.map((t) => ({ id: t.id, name: t.name }))}
        organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
        defaultTrainerId={trainerId}
        defaultOrganizationId={organizationId}
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Interview</th>
              <th className="px-4 py-3">Remarks</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {assignments.length ? (
              assignments.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    {a.trainer.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{a.organization.name}</td>
                  <td className="px-4 py-3" colSpan={3}>
                    <form
                      action={updateAssignment}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <select
                        name="status"
                        defaultValue={a.status}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusBadgeClasses[a.status]}`}
                      >
                        {assignmentStatuses.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        name="interviewDate"
                        min="2000-01-01"
                        max="2100-12-31"
                        defaultValue={toDateInput(a.interviewDate)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <input
                        name="remarks"
                        defaultValue={a.remarks ?? ""}
                        placeholder="Remarks"
                        className="min-w-40 flex-1 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-950 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteAssignment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                  No assignments yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
