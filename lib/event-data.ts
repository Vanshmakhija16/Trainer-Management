import type { EventInput } from "@/lib/validation";

/**
 * Maps validated event input to a Prisma data object, deriving `profit`
 * (revenue - expenses) so it can be stored and aggregated directly. Single
 * source of truth for both the API route and the server action.
 */
export function toEventData(input: EventInput) {
  const { revenue, expenses, ...rest } = input;
  const profit =
    revenue !== null || expenses !== null
      ? (revenue ?? 0) - (expenses ?? 0)
      : null;

  return {
    ...rest,
    revenue,
    expenses,
    profit,
  };
}
