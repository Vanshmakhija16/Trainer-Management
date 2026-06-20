import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Prisma returns DECIMAL columns as Decimal objects (or null). These helpers
 * normalise them to plain JS numbers for aggregation and to formatted strings
 * for display. Revenue is stored as Decimal to keep arithmetic exact; we only
 * convert to Number at the edges (sums, charts, UI).
 */
export type DecimalLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  // Decimal and string both stringify safely.
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats a money value (Decimal/number/null) as INR, e.g. "₹1,20,000". */
export function formatCurrency(value: DecimalLike): string {
  return inrFormatter.format(toNumber(value));
}
