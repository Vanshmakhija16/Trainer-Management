"use client";

import { useActionState } from "react";
import { assignmentStatuses, statusLabels } from "@/lib/status";
import {
  createAssignment,
  type AssignmentFormState,
} from "./actions";

const initialState: AssignmentFormState = { message: "", success: false };

type Option = { id: string; name: string };

export function NewAssignmentForm({
  trainers,
  organizations,
  defaultTrainerId,
  defaultOrganizationId,
}: {
  trainers: Option[];
  organizations: Option[];
  defaultTrainerId?: string;
  defaultOrganizationId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createAssignment,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-6"
    >
      <select
        name="trainerId"
        defaultValue={defaultTrainerId ?? ""}
        required
        className="md:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Select trainer
        </option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        name="organizationId"
        defaultValue={defaultOrganizationId ?? ""}
        required
        className="md:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Select organization
        </option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <select
        name="status"
        defaultValue={assignmentStatuses[0]}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />

      <input
        name="remarks"
        placeholder="Remarks (optional)"
        className="md:col-span-4 rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={pending}
        className="md:col-span-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400"
      >
        {pending ? "Assigning…" : "Assign Trainer"}
      </button>

      {state.message ? (
        <p
          className={`md:col-span-6 rounded-md px-3 py-2 text-sm ${
            state.success
              ? "bg-teal-50 text-teal-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
