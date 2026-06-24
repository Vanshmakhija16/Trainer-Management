"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface YogaFiltersProps {
  cities: string[];
  styles: string[];
  certifications: string[];
  years: number[];
}

export function YogaFilters({ cities, styles, certifications, years }: YogaFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/trainers?${params.toString()}`);
    },
    [router, sp],
  );

  const v = (key: string) => sp.get(key) ?? "";

  return (
    <div className="space-y-3">

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Search</label>
        <input
          type="text"
          value={v("search")}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Name, email…"
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
        <label className="mb-1 block text-xs font-medium text-zinc-500">Yoga Style</label>
        <select
          value={v("yogaStyle")}
          onChange={(e) => set("yogaStyle", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All styles</option>
          {styles.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Certification</label>
        <select
          value={v("certification")}
          onChange={(e) => set("certification", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All certifications</option>
          {certifications.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Onboarded Year</label>
        <select
          value={v("onboardedYear")}
          onChange={(e) => set("onboardedYear", e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
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
        <label className="mb-1 block text-xs font-medium text-zinc-500">Charges / Day</label>
        <select
          value={`${v("minCharges")}_${v("maxCharges")}`}
          onChange={(e) => {
            const [min, max] = e.target.value.split("_");
            const params = new URLSearchParams(sp.toString());
            if (min) params.set("minCharges", min); else params.delete("minCharges");
            if (max) params.set("maxCharges", max); else params.delete("maxCharges");
            params.delete("page");
            router.push(`/trainers?${params.toString()}`);
          }}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
        >
          <option value="_">Any charges</option>
          <option value="_5000">Up to ₹5,000</option>
          <option value="5000_10000">₹5,000 – ₹10,000</option>
          <option value="10000_20000">₹10,000 – ₹20,000</option>
          <option value="20000_">₹20,000+</option>
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
          <option value="charges_asc">Charges (low–high)</option>
          <option value="charges_desc">Charges (high–low)</option>
        </select>
      </div>

      <div className="pt-1">
        <a
          href="/trainers?trainerType=YOGA"
          className="block w-full rounded-md border border-zinc-200 py-2 text-center text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
        >
          Reset filters
        </a>
      </div>

    </div>
  );
}
