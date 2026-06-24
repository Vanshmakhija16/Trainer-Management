"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface TrainerFiltersProps {
  cities: string[];
  organizations: { id: string; name: string }[];
  trainerType?: string;
}

export function TrainerFilters({ cities, organizations, trainerType }: TrainerFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/trainers?${params.toString()}`);
      });
    },
    [router, sp],
  );

  const v = (key: string) => sp.get(key) ?? "";

  return (
    <div className="space-y-3">
      {trainerType && (
        <input type="hidden" name="trainerType" value={trainerType} />
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Search</label>
        <input
          type="text"
          value={v("search")}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Name, email, skills…"
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">City</label>
        <select
          value={v("city")}
          onChange={(e) => set("city", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
        <select
          value={v("status")}
          onChange={(e) => set("status", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Organization</label>
        <select
          value={v("organizationId")}
          onChange={(e) => set("organizationId", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All organizations</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Min Experience (yrs)</label>
        <select
          value={v("minExperience")}
          onChange={(e) => set("minExperience", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">Any experience</option>
          <option value="1">1+ years</option>
          <option value="3">3+ years</option>
          <option value="5">5+ years</option>
          <option value="10">10+ years</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Sort by</label>
        <select
          value={v("sort")}
          onChange={(e) => set("sort", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="recent">Most recent</option>
          <option value="name">Name (A–Z)</option>
          <option value="experience">Experience (high–low)</option>
        </select>
      </div>

      <div className="pt-1">
        <a
          href={trainerType ? `/trainers?trainerType=${trainerType}` : "/trainers"}
          className="block w-full rounded-md border border-zinc-200 py-2 text-center text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
        >
          Reset filters
        </a>
      </div>
    </div>
  );
}
