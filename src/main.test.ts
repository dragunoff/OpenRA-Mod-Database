import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { program, VERSION } from "./main.js";
import { makeModsLayer } from "./mods.js";
import {
  makeMockHttpClient,
  testModsLayer,
  makeMockUrls,
  makeMockFileSystem,
  makeMockConsole,
  mockReleases,
  mockRepoDescriptions,
} from "./test-helpers.js";
import type { Mod } from "./mods-list.js";

const runProgramWith = async (mods: Record<string, Mod>, responses: Record<string, unknown>) => {
  const fs = makeMockFileSystem();
  const http = makeMockHttpClient(responses);
  const console = makeMockConsole();
  await Effect.runPromise(
    program.pipe(
      Effect.provide(makeModsLayer(mods)),
      Effect.provide(http),
      Effect.provide(fs.layer),
      Effect.provide(console.layer),
    ),
  );
  const parsed = JSON.parse(fs.written().content!);
  expect(parsed.version).toBe(VERSION);
  return parsed.mods;
};

describe("program", () => {
  const mockUrls = makeMockUrls();

  it("writes correctly sorted JSON to OpenRA-Mod-Database.json", async () => {
    const fs = makeMockFileSystem();
    const http = makeMockHttpClient(mockUrls);

    const console = makeMockConsole();
    await Effect.runPromise(
      program.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(http),
        Effect.provide(fs.layer),
        Effect.provide(console.layer),
      ),
    );

    const { path, content } = fs.written();
    expect(path).toBe("dist/OpenRA-Mod-Database.json");

    const parsed = JSON.parse(content!);
    expect(parsed.version).toBe(VERSION);
    expect(Object.keys(parsed.mods)).toEqual(["cnc", "d2k", "hv", "ra"]);

    const openraReleases = {
      stable: {
        id: 1,
        name: "",
        tag_name: "release-20250330",
        prerelease: false,
        html_url: "https://github.com/OpenRA/OpenRA/releases/tag/release-20250330",
        published_at: "2025-03-30T00:00:00Z",
        body: "OpenRA release-20250330",
        assets: [],
      },
      playtest: {
        id: 2,
        name: "playtest",
        tag_name: "playtest-20250401",
        prerelease: true,
        html_url: "https://github.com/OpenRA/OpenRA/releases/tag/playtest-20250401",
        published_at: "2025-04-01T00:00:00Z",
        body: "OpenRA playtest-20250401",
        assets: [],
      },
    };
    expect(parsed.mods["cnc"]).toEqual({
      ...openraReleases,
      repo_url: "https://github.com/OpenRA/OpenRA",
      homepage: "https://www.openra.net",
      title: "Tiberian Dawn",
      description: "OpenRA reimplementation of Tiberian Dawn",
      icon: "data:image/png;base64,iVBORw==",
    });
    expect(parsed.mods["d2k"]).toEqual({
      ...openraReleases,
      repo_url: "https://github.com/OpenRA/OpenRA",
      homepage: "https://www.openra.net",
      title: "Dune 2000",
      description: "OpenRA reimplementation of Dune 2000",
      icon: null,
    });
    expect(parsed.mods["ra"]).toEqual({
      ...openraReleases,
      repo_url: "https://github.com/OpenRA/OpenRA",
      homepage: "https://www.openra.net",
      title: "Red Alert",
      description: "OpenRA reimplementation of Red Alert",
      icon: "data:image/png;base64,AQIDBA==",
    });

    expect(parsed.mods["hv"].stable).toEqual({
      id: 3,
      name: "",
      tag_name: "20250725",
      prerelease: false,
      html_url: "https://github.com/OpenHV/OpenHV/releases/tag/20250725",
      published_at: "2025-07-25T15:49:24Z",
      body: "OpenHV release 20250725",
      assets: [],
    });
    expect(parsed.mods["hv"].playtest).toEqual({
      id: 4,
      name: "20250209",
      tag_name: "20250209",
      prerelease: true,
      html_url: "https://github.com/OpenHV/OpenHV/releases/tag/20250209",
      published_at: "2025-02-09T00:00:00Z",
      body: "OpenHV playtest 20250209",
      assets: [],
    });
    expect(parsed.mods["hv"].homepage).toBe("https://www.openhv.net");
    expect(parsed.mods["hv"].repo_url).toBe("https://github.com/OpenHV/OpenHV");
    expect(parsed.mods["hv"].title).toBe("OpenHV");
    expect(parsed.mods["hv"].description).toBe(mockRepoDescriptions["OpenHV/OpenHV"]);
    expect(parsed.mods["hv"].icon).toBeNull();
  });

  it("writes only the 7 top-level fields per entry", async () => {
    const fs = makeMockFileSystem();
    const http = makeMockHttpClient(mockUrls);

    const console = makeMockConsole();
    await Effect.runPromise(
      program.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(http),
        Effect.provide(fs.layer),
        Effect.provide(console.layer),
      ),
    );

    const parsed = JSON.parse(fs.written().content!);
    expect(parsed.version).toBe(VERSION);
    (Object.values(parsed.mods) as Record<string, unknown>[]).forEach((mod) => {
      expect(Object.keys(mod).toSorted()).toEqual([
        "description",
        "homepage",
        "icon",
        "playtest",
        "repo_url",
        "stable",
        "title",
      ]);
    });
    (Object.values(parsed.mods) as Record<string, unknown>[])
      .flatMap((mod) => [mod.stable, mod.playtest])
      .filter((entry): entry is Record<string, unknown> => !!entry)
      .forEach((entry) => {
        expect(Object.keys(entry).toSorted()).toEqual([
          "assets",
          "body",
          "html_url",
          "id",
          "name",
          "prerelease",
          "published_at",
          "tag_name",
        ]);
      });
  });

  it("writes a release with a playtest when both exist", async () => {
    const repo = "ExampleOrg/Example";
    const parsed = await runProgramWith(
      { example: { repo, homepage: "https://example.example.com", title: "Example" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [
          {
            id: 1,
            name: "Stable",
            tag_name: "v1.0",
            prerelease: false,
            html_url: `https://github.com/${repo}/releases/tag/v1.0`,
            published_at: "2024-01-15T12:00:00Z",
            body: "",
            assets: [],
          },
          {
            id: 2,
            name: "RC",
            tag_name: "v2.0-rc1",
            prerelease: true,
            html_url: `https://github.com/${repo}/releases/tag/v2.0-rc1`,
            published_at: "2024-02-01T12:00:00Z",
            body: "",
            assets: [],
          },
        ],
      },
    );

    expect(parsed).toEqual({
      example: {
        stable: {
          id: 1,
          name: "Stable",
          tag_name: "v1.0",
          prerelease: false,
          html_url: `https://github.com/${repo}/releases/tag/v1.0`,
          published_at: "2024-01-15T12:00:00Z",
          body: "",
          assets: [],
        },
        playtest: {
          id: 2,
          name: "RC",
          tag_name: "v2.0-rc1",
          prerelease: true,
          html_url: `https://github.com/${repo}/releases/tag/v2.0-rc1`,
          published_at: "2024-02-01T12:00:00Z",
          body: "",
          assets: [],
        },
        repo_url: `https://github.com/${repo}`,
        homepage: "https://example.example.com",
        title: "Example",
        description: null,
        icon: null,
      },
    });
  });

  it("writes a release with no playtest when only a stable exists", async () => {
    const repo = "ExampleOrg/Example";
    const parsed = await runProgramWith(
      { example: { repo, homepage: "https://example.example.com", title: "Example" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [
          {
            id: 1,
            name: "",
            tag_name: "v1.0",
            prerelease: false,
            html_url: `https://github.com/${repo}/releases/tag/v1.0`,
            published_at: "2024-01-15T12:00:00Z",
            body: "",
            assets: [],
          },
          {
            id: 2,
            name: "",
            tag_name: "v1.1",
            prerelease: false,
            html_url: `https://github.com/${repo}/releases/tag/v1.1`,
            published_at: "2024-03-01T12:00:00Z",
            body: "",
            assets: [],
          },
        ],
      },
    );

    expect(parsed).toEqual({
      example: {
        stable: {
          id: 1,
          name: "",
          tag_name: "v1.0",
          prerelease: false,
          html_url: `https://github.com/${repo}/releases/tag/v1.0`,
          published_at: "2024-01-15T12:00:00Z",
          body: "",
          assets: [],
        },
        playtest: null,
        repo_url: `https://github.com/${repo}`,
        homepage: "https://example.example.com",
        title: "Example",
        description: null,
        icon: null,
      },
    });
  });

  it("writes a playtest with no stable when only prereleases exist", async () => {
    const repo = "ExampleOrg/Beta";
    const parsed = await runProgramWith(
      { beta: { repo, homepage: "https://beta.example.com", title: "Beta" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [
          {
            id: 1,
            name: "",
            tag_name: "v0.1-beta",
            prerelease: true,
            html_url: `https://github.com/${repo}/releases/tag/v0.1-beta`,
            published_at: "2024-01-20T12:00:00Z",
            body: "",
            assets: [],
          },
        ],
      },
    );

    expect(parsed).toEqual({
      beta: {
        stable: null,
        playtest: {
          id: 1,
          name: "",
          tag_name: "v0.1-beta",
          prerelease: true,
          html_url: `https://github.com/${repo}/releases/tag/v0.1-beta`,
          published_at: "2024-01-20T12:00:00Z",
          body: "",
          assets: [],
        },
        repo_url: `https://github.com/${repo}`,
        homepage: "https://beta.example.com",
        title: "Beta",
        description: null,
        icon: null,
      },
    });
  });

  it("writes neither release nor playtest when there are none", async () => {
    const repo = "ExampleOrg/Wip";
    const parsed = await runProgramWith(
      { wip: { repo, homepage: "https://wip.example.com", title: "Wip" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [],
      },
    );

    expect(parsed).toEqual({
      wip: {
        stable: null,
        playtest: null,
        repo_url: `https://github.com/${repo}`,
        homepage: "https://wip.example.com",
        title: "Wip",
        description: null,
        icon: null,
      },
    });
  });

  it("fills homepage from the GitHub repo when a mod has none", async () => {
    const repo = "ExampleOrg/NoHomepage";
    const parsed = await runProgramWith(
      { x: { repo, homepage: null, title: "X" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [],
        [`https://api.github.com/repos/${repo}`]: {
          description: "Example mod description",
          homepage: "https://example.example.com",
        },
      },
    );

    expect(parsed).toEqual({
      x: {
        stable: null,
        playtest: null,
        repo_url: `https://github.com/${repo}`,
        homepage: "https://example.example.com",
        title: "X",
        description: "Example mod description",
        icon: null,
      },
    });
  });

  it("keeps homepage null when the GitHub homepage is empty", async () => {
    const repo = "ExampleOrg/EmptyHomepage";
    const parsed = await runProgramWith(
      { x: { repo, homepage: null, title: "X" } },
      {
        [`https://api.github.com/repos/${repo}/releases?per_page=30`]: [],
        [`https://api.github.com/repos/${repo}`]: { description: null, homepage: "" },
      },
    );

    expect(parsed).toEqual({
      x: {
        stable: null,
        playtest: null,
        repo_url: `https://github.com/${repo}`,
        homepage: null,
        title: "X",
        description: null,
        icon: null,
      },
    });
  });

  it("does not write OpenRA-Mod-Database.json when a repo is rate limited", async () => {
    const fs = makeMockFileSystem();
    const http = makeMockHttpClient({
      "https://api.github.com/repos/OpenRA/OpenRA/releases?per_page=30": {
        status: 403,
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "2000000000" },
        body: { message: "API rate limit exceeded" },
      },
      "https://api.github.com/repos/OpenHV/OpenHV/releases?per_page=30":
        mockReleases["OpenHV/OpenHV"],
    });
    const console = makeMockConsole();

    const promise = Effect.runPromise(
      program.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(http),
        Effect.provide(fs.layer),
        Effect.provide(console.layer),
      ),
    );

    await expect(promise).rejects.toMatchObject({
      _tag: "RateLimitError",
      repo: "OpenRA/OpenRA",
    });
    expect(fs.written()).toEqual({ path: undefined, content: undefined });

    const logged = console.lines().join("\n");
    expect(logged).toContain("rate limit");
    expect(logged).toContain("OpenRA/OpenRA");
    expect(logged).toContain("No OpenRA-Mod-Database.json was written");
  });

  it("does not write OpenRA-Mod-Database.json when a repo returns a non-2xx response", async () => {
    const fs = makeMockFileSystem();
    const http = makeMockHttpClient({
      "https://api.github.com/repos/OpenRA/OpenRA/releases?per_page=30": {
        status: 404,
        body: { message: "Not Found" },
      },
      "https://api.github.com/repos/OpenHV/OpenHV/releases?per_page=30":
        mockReleases["OpenHV/OpenHV"],
    });
    const console = makeMockConsole();

    const promise = Effect.runPromise(
      program.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(http),
        Effect.provide(fs.layer),
        Effect.provide(console.layer),
      ),
    );

    await expect(promise).rejects.toMatchObject({
      _tag: "RepoFetchError",
      repo: "OpenRA/OpenRA",
      status: 404,
    });
    expect(fs.written()).toEqual({ path: undefined, content: undefined });
    expect(console.lines().join("\n")).toContain("Failed to fetch OpenRA/OpenRA");
  });
});
