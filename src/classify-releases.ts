import { ModReleases, Release } from "./releases.schema.js";

export const classifyReleases = (releases: ReadonlyArray<Release>): ModReleases => {
  const stable = releases.find((r) => r.prerelease === false) ?? null;
  const playtest = releases.find((r) => r.prerelease === true) ?? null;
  return { stable, playtest };
};
