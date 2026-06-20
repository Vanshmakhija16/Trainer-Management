import { City, State } from "country-state-city";

/**
 * Complete list of Indian cities formatted as "City, State", derived live from
 * the `country-state-city` package (no hand-maintained file). The Location
 * combobox filters this client-side; free-text entries are still allowed.
 *
 * To cover the whole world instead of just India, swap to
 * `City.getAllCities()` — but that returns ~150k entries, so keep the combobox
 * search-driven if you do.
 */
function buildIndiaCityStates(): string[] {
  const stateNameByCode = new Map(
    State.getStatesOfCountry("IN").map((state) => [state.isoCode, state.name]),
  );

  const seen = new Set<string>();
  const result: string[] = [];

  for (const city of City.getCitiesOfCountry("IN") ?? []) {
    const stateName = stateNameByCode.get(city.stateCode) ?? "";
    const label = stateName ? `${city.name}, ${stateName}` : city.name;
    if (seen.has(label)) continue;
    seen.add(label);
    result.push(label);
  }

  return result.sort((a, b) => a.localeCompare(b));
}

export const indiaCityStates: string[] = buildIndiaCityStates();
