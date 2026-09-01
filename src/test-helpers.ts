import { Console, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { FileSystem } from "effect/FileSystem";
import { makeModsLayer } from "./mods.js";
import type { Mod } from "./mods-list.js";
import type { Release } from "./releases.schema.js";

export const testMods: Record<string, Mod> = {
  ra: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Red Alert",
    description: "OpenRA reimplementation of Red Alert",
    logo: "ra",
  },
  cnc: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Tiberian Dawn",
    description: "OpenRA reimplementation of Tiberian Dawn",
    logo: "cnc",
  },
  d2k: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Dune 2000",
    description: "OpenRA reimplementation of Dune 2000",
  },
  hv: { repo: "OpenHV/OpenHV", homepage: "https://www.openhv.net", title: "OpenHV" },
};

export const testLogoBytes: Record<string, Uint8Array> = {
  ra: new Uint8Array([1, 2, 3, 4]),
  cnc: new Uint8Array([137, 80, 78, 71]),
};

export const mockReleases: Record<string, Array<Release>> = {
  "OpenRA/OpenRA": [
    {
      id: 1,
      name: "",
      body: "OpenRA release-20250330",
      tag_name: "release-20250330",
      prerelease: false,
      html_url: "https://github.com/OpenRA/OpenRA/releases/tag/release-20250330",
      published_at: "2025-03-30T00:00:00Z",
      assets: [],
    },
    {
      id: 2,
      name: "playtest",
      body: "OpenRA playtest-20250401",
      tag_name: "playtest-20250401",
      prerelease: true,
      html_url: "https://github.com/OpenRA/OpenRA/releases/tag/playtest-20250401",
      published_at: "2025-04-01T00:00:00Z",
      assets: [],
    },
  ],
  "OpenHV/OpenHV": [
    {
      id: 3,
      name: "",
      body: "OpenHV release 20250725",
      tag_name: "20250725",
      prerelease: false,
      html_url: "https://github.com/OpenHV/OpenHV/releases/tag/20250725",
      published_at: "2025-07-25T15:49:24Z",
      assets: [],
    },
    {
      id: 4,
      name: "20250209",
      body: "OpenHV playtest 20250209",
      tag_name: "20250209",
      prerelease: true,
      html_url: "https://github.com/OpenHV/OpenHV/releases/tag/20250209",
      published_at: "2025-02-09T00:00:00Z",
      assets: [],
    },
  ],
};

export const mockRepoDescriptions: Record<string, string | null> = {
  "OpenRA/OpenRA": "OpenRAs classic Command & Conquer reimplementations",
  "OpenHV/OpenHV": "Open-source reimagining of Hard Vacuum",
};

export const mockRepoHomepages: Record<string, string | null> = {
  "OpenRA/OpenRA": null,
  "OpenHV/OpenHV": null,
};

export type MockResponseOptions = {
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
};

const isMockResponseOptions = (value: unknown): value is MockResponseOptions =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  ("status" in value || "headers" in value || "body" in value);

export const makeMockHttpClient = (responses: Record<string, unknown>) =>
  Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((request, _url, _signal, _fiber) => {
      const url = request.url;
      const entry =
        responses[url] ?? (url.includes("/releases") ? [] : { description: null, homepage: null });
      const status = isMockResponseOptions(entry) ? (entry.status ?? 200) : 200;
      const headers = isMockResponseOptions(entry) ? (entry.headers ?? {}) : {};
      const body = isMockResponseOptions(entry) ? (entry.body ?? []) : entry;
      return Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json", ...headers },
          }),
        ),
      );
    }),
  );

export const testModsLayer = makeModsLayer(testMods);

export const makeMockConsole = () => {
  const lines: Array<string> = [];

  const layer = Layer.succeed(
    Console.Console,
    Object.assign(Object.create(globalThis.console), {
      log: (...args: ReadonlyArray<unknown>) => lines.push(args.map(String).join(" ")),
      error: (...args: ReadonlyArray<unknown>) => lines.push(args.map(String).join(" ")),
      warn: (...args: ReadonlyArray<unknown>) => lines.push(args.map(String).join(" ")),
      info: (...args: ReadonlyArray<unknown>) => lines.push(args.map(String).join(" ")),
      debug: (...args: ReadonlyArray<unknown>) => lines.push(args.map(String).join(" ")),
    }) as Console.Console,
  );

  return {
    layer,
    lines: () => lines,
  };
};

export const makeMockUrls = () =>
  Object.fromEntries(
    [...new Set(Object.values(testMods).map(({ repo }) => repo))].flatMap((repo) => [
      [`https://api.github.com/repos/${repo}/releases?per_page=30`, mockReleases[repo]],
      [
        `https://api.github.com/repos/${repo}`,
        {
          description: mockRepoDescriptions[repo] ?? null,
          homepage: mockRepoHomepages[repo] ?? null,
        },
      ],
    ]),
  );

export const makeMockFileSystem = () => {
  let writtenPath: string | undefined;
  let writtenContent: string | undefined;

  const layer = Layer.succeed(FileSystem, {
    makeDirectory: () => Effect.succeed(undefined),
    writeFileString: (path: string, content: string) =>
      Effect.sync(() => {
        writtenPath = path;
        writtenContent = content;
      }),
    readFile: (path: string) => {
      const match = /^logos\/([^.]+)\.png$/.exec(path);
      const bytes = match ? testLogoBytes[match[1]] : undefined;
      return bytes ? Effect.succeed(bytes) : Effect.fail(new Error(`mock: no such file ${path}`));
    },
  } as unknown as typeof FileSystem.Service);

  return {
    layer,
    written: () => ({ path: writtenPath, content: writtenContent }),
  };
};
