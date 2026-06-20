"use client";

import { useActionState } from "react";
import { organizationTypeLabels, organizationTypes } from "@/lib/status";
import { createOrganization, type FormState } from "../actions";

const initialState: FormState = { message: "", success: false };

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function NewOrganizationForm() {
  const [state, formAction, pending] = useActionState(
    createOrganization,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Name
        <input name="name" required className={inputClass} placeholder="e.g. JKLU" />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Type
        <select name="type" defaultValue="UNIVERSITY" className={inputClass}>
          {organizationTypes.map((t) => (
            <option key={t} value={t}>
              {organizationTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Industry
        <input name="industry" className={inputClass} placeholder="e.g. Education" />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Website
        <input name="website" className={inputClass} placeholder="https://" />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        City
        <input name="city" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        State
        <input name="state" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Country
        <input name="country" className={inputClass} defaultValue="India" />
      </label>

      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Address
        <input name="address" className={inputClass} />
      </label>

      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Notes
        <textarea name="notes" rows={3} className={inputClass} />
      </label>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Create Organization"}
        </button>
        {state.message && !state.success ? (
          <p className="text-sm text-red-700">{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
