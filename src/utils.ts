export const sortByKeys = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).toSorted(([a], [b]) => a.localeCompare(b)));
