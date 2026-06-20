"use client";

import { useActionState } from "react";
import {
  eventStatusLabels,
  eventStatuses,
  eventTypeLabels,
  eventTypes,
} from "@/lib/status";
import { createEvent, type FormState } from "../actions";

const initialState: FormState = { message: "", success: false };

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

type Option = { id: string; name: string };

export function NewEventForm({
  organizations,
  defaultOrganizationId,
}: {
  organizations: Option[];
  defaultOrganizationId?: string;
}) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Title
        <input name="title" required className={inputClass} placeholder="e.g. International Yoga Day 2026" />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Organization
        <select
          name="organizationId"
          required
          defaultValue={defaultOrganizationId ?? ""}
          className={inputClass}
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
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Type
        <select name="eventType" defaultValue="WORKSHOP" className={inputClass}>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {eventTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Start Date
        <input
          type="date"
          name="eventDate"
          min="2000-01-01"
          max="2100-12-31"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        End Date
        {/* <span className="text-xs font-normal text-zinc-400">
          Leave blank for single-day events
        </span> */}
        <input
          type="date"
          name="endDate"
          min="2000-01-01"
          max="2100-12-31"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Start Time
        <input type="time" name="startTime" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        End Time
        <input type="time" name="endTime" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Status
        <select name="status" defaultValue="PLANNED" className={inputClass}>
          {eventStatuses.map((s) => (
            <option key={s} value={s}>
              {eventStatusLabels[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Venue
        <input name="venue" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Expected Participants
        <input type="number" min="0" name="expectedParticipants" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Actual Participants
        <input type="number" min="0" name="actualParticipants" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Revenue (₹)
        <input type="number" min="0" step="0.01" name="revenue" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Expenses (₹)
        <input type="number" min="0" step="0.01" name="expenses" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Host Name
        <input name="hostName" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Host Phone
        <input name="hostPhone" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Lead Source
        <input name="leadSource" className={inputClass} placeholder="e.g. Referral, LinkedIn" />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Lead Owner
        <input name="leadOwner" className={inputClass} placeholder="Who brought the lead" />
      </label>

      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Description
        <textarea name="description" rows={3} className={inputClass} />
      </label>

      <label className="sm:col-span-2 flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Internal Notes
        <textarea name="internalNotes" rows={2} className={inputClass} />
      </label>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Create Event"}
        </button>
        {state.message && !state.success ? (
          <p className="text-sm text-red-700">{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
