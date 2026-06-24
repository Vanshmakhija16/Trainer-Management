import type { EventInput } from "@/lib/validation";

export function toEventData(input: EventInput) {
  const { revenue, expenses, noOfSessions, sessionCharges, ...rest } = input;

  // Auto-derive profit from revenue - expenses
  const profit =
    revenue !== null || expenses !== null
      ? (revenue ?? 0) - (expenses ?? 0)
      : null;

  // Auto-derive total revenue from noOfSessions * sessionCharges if revenue not set
  const derivedRevenue =
    revenue !== null
      ? revenue
      : noOfSessions !== null && sessionCharges !== null
      ? (noOfSessions ?? 0) * (sessionCharges ?? 0)
      : null;

  return {
    ...rest,
    noOfSessions,
    sessionCharges,
    revenue: derivedRevenue,
    expenses,
    profit:
      derivedRevenue !== null || expenses !== null
        ? (derivedRevenue ?? 0) - (expenses ?? 0)
        : profit,
  };
}
