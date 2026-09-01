# AGENTS.md

## What this repo is

Fetches GitHub releases for OpenRA and OpenHV mods, classifies each as stable or playtest, attaches each mod's homepage, description, and a base64-encoded logo, and writes the result to `dist/OpenRA-Mod-Database.json` as `{ "version": <int>, "mods": { <shortname>: {...}, ... } }`. The top-level `version` field lets consumers detect format changes (bump `VERSION` in `src/main.ts` whenever the per-mod shape changes). Written in TypeScript with [Effect](https://effect.website/) for typed functional programming and `@effect/platform` for HTTP.

### Source files

- `src/releases.schema.ts` — Release (includes `published_at`) / GitHubReleases / ModReleases schemas (Effect.Schema)
- `src/repo.schema.ts` — GitHubRepo schema (extracts `description` and `homepage` from the repo API)
- `src/classify-releases.ts` — classifyReleases helper
- `src/errors.schema.ts` — RateLimitError / RepoFetchError (Schema.TaggedError)
- `src/mods.ts` — Mods context tag and layer
- `src/mods-list.ts` — MODS constant (short name → GitHub repo + homepage + optional description + logo)
- `src/fetch.ts` — fetchModReleases effect
- `src/icons.ts` — attachIcons effect (reads committed logos, base64-encodes them)
- `src/main.ts` — program, entry point
- `src/utils.ts` — sortByKeys helper
- `src/test-helpers.ts` — shared mock layers (HTTP, FileSystem, mods)
- `src/classify-releases.test.ts` — classifyReleases tests
- `src/mods.test.ts` — Mods context test
- `src/fetch.test.ts` — fetchModReleases tests
- `src/icons.test.ts` — attachIcons tests
- `src/utils.test.ts` — sortByKeys tests
- `src/main.test.ts` — program tests

## Commands

```bash
npm start            # fetch releases from GitHub API, writes dist/OpenRA-Mod-Database.json
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (unit tests only, no network calls)
```

All three should pass. Tests use mock HTTP and filesystem layers so `npm run test` never hits the network or disk.

## Gotchas

- **`dist/OpenRA-Mod-Database.json` is a generated build artifact, not part of the repo.** The `dist/` folder is gitignored and never committed (the repo holds only the recipe/source). Regenerate locally with `npm start`, which creates `dist/` if needed; it's safe to delete at any time. The daily `Update database` workflow regenerates it in CI and publishes it as a GitHub Release asset at the stable URL `https://github.com/<owner>/<repo>/releases/latest/download/OpenRA-Mod-Database.json`, but only when the data has changed since the last published release.
- **`logos/` IS committed.** Unlike `dist/`, the logo PNGs under `logos/` are versioned source data (`.gitignore` ignores only `node_modules/` and `dist/`). Each mod's `logo` field in `MODS` names a file `logos/<name>.png`. At build time `attachIcons` (`src/icons.ts`) reads each PNG off disk (no network), base64-encodes it into the mod's `icon` field as `data:image/png;base64,...`, and embeds it in `dist/OpenRA-Mod-Database.json`. A missing logo file (or a mod with no `logo` field) yields `icon: null` and **never fails the run** — unlike release fetching, icons are not all-or-nothing.
- **All-or-nothing writes.** If any repo request fails, the whole run fails and `dist/OpenRA-Mod-Database.json` is **not** written. Errors are printed with a non-zero exit code. GitHub rate limits (HTTP 403 with `x-ratelimit-remaining: 0`, or HTTP 429) are detected and reported with the reset/retry time.
- **`GITHUB_TOKEN`** (optional) is read from the environment via `Config` and sent as a `Bearer` token, raising GitHub's limit.
- **`tsx`** is used to run TS directly (no build step). Requires Node 24 LTS (pinned via `.nvmrc` and `engines` in `package.json`).
- **ESM only.** `"type": "module"` in package.json. Use `.js` extension in relative imports (e.g. `from "./schema.js"`), not `.ts`.
- **`Mods` context tag in `src/mods.ts`** controls which GitHub repos are fetched. Add new mods by editing the `MODS` list in `src/mods-list.ts`.
- **Repo metadata.** Each mod's `description` and fallback `homepage` come from the GitHub repo API (`GET /repos/{owner}/{repo}`). A mod may override `description` with an optional `description` in `MODS` and may set `homepage` directly (see the `OpenRA/OpenRA`-sharing `cnc`/`ra`/`d2k`). When a mod has no `homepage`, the GitHub repo's `homepage` is used instead (empty GitHub homepage → `null`). The repo metadata request is skipped entirely when every mod sharing a repo already has both a `description` and a `homepage`.
