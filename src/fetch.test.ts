import { describe, it, expect } from "vitest";
import { ConfigProvider, Effect, Layer, Option } from "effect";
import { HttpClient, Headers, HttpClientResponse } from "effect/unstable/http";
import { fetchModReleases } from "./fetch.js";
import {
  mockReleases,
  mockRepoDescriptions,
  makeMockHttpClient,
  makeMockUrls,
  testModsLayer,
  makeMockConsole,
} from "./test-helpers.js";
import { RateLimitError } from "./errors.schema.js";

describe("fetchModReleases", () => {
  const mockUrls = makeMockUrls();

  it("fetches and classifies releases for all mods", async () => {
    const console = makeMockConsole();
    const results = await Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(makeMockHttpClient(mockUrls)),
        Effect.provide(console.layer),
      ),
    );

    expect(Object.keys(results)).toEqual(["ra", "cnc", "d2k", "hv"]);

    expect(results["cnc"].stable?.tag_name).toBe("release-20250330");
    expect(results["cnc"].playtest?.tag_name).toBe("playtest-20250401");
    expect(results["d2k"].stable?.tag_name).toBe("release-20250330");
    expect(results["ra"].stable?.tag_name).toBe("release-20250330");
    expect(results["hv"].stable?.tag_name).toBe("20250725");
    expect(results["hv"].playtest?.tag_name).toBe("20250209");

    expect(results["cnc"].homepage).toBe("https://www.openra.net");
    expect(results["d2k"].homepage).toBe("https://www.openra.net");
    expect(results["ra"].homepage).toBe("https://www.openra.net");
    expect(results["hv"].homepage).toBe("https://www.openhv.net");

    expect(results["cnc"].repo_url).toBe("https://github.com/OpenRA/OpenRA");
    expect(results["d2k"].repo_url).toBe("https://github.com/OpenRA/OpenRA");
    expect(results["ra"].repo_url).toBe("https://github.com/OpenRA/OpenRA");
    expect(results["hv"].repo_url).toBe("https://github.com/OpenHV/OpenHV");

    expect(results["cnc"].title).toBe("Tiberian Dawn");
    expect(results["d2k"].title).toBe("Dune 2000");
    expect(results["ra"].title).toBe("Red Alert");
    expect(results["hv"].title).toBe("OpenHV");

    expect(results["cnc"].description).toBe("OpenRA reimplementation of Tiberian Dawn");
    expect(results["d2k"].description).toBe("OpenRA reimplementation of Dune 2000");
    expect(results["ra"].description).toBe("OpenRA reimplementation of Red Alert");
    expect(results["hv"].description).toBe(mockRepoDescriptions["OpenHV/OpenHV"]);
  });

  it("fetches a shared repo once but reports each mod", async () => {
    let openraCalls = 0;
    const counting = Layer.succeed(
      HttpClient.HttpClient,
      HttpClient.make((request, _url, _signal, _fiber) => {
        const url = request.url;
        if (url.includes("OpenRA/OpenRA") && url.includes("/releases")) openraCalls += 1;
        const body = mockUrls[url] ?? [];
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          ),
        );
      }),
    );
    const console = makeMockConsole();

    const results = await Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(counting),
        Effect.provide(console.layer),
      ),
    );

    expect(openraCalls).toBe(1);
    ["ra", "cnc", "d2k"].forEach((mod) => {
      expect(results[mod].stable?.tag_name).toBe("release-20250330");
    });
  });

  it("handles missing stable release", async () => {
    const console = makeMockConsole();
    const results = await Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(
          makeMockHttpClient({
            "https://api.github.com/repos/OpenRA/OpenRA/releases?per_page=30": [
              {
                id: 1,
                name: "playtest",
                body: "OpenRA playtest-20250401",
                tag_name: "playtest-20250401",
                prerelease: true,
                html_url: "https://github.com/OpenRA/OpenRA/releases/tag/playtest-20250401",
                published_at: "2025-04-01T00:00:00Z",
                assets: [],
              },
            ],
            "https://api.github.com/repos/OpenHV/OpenHV/releases?per_page=30":
              mockReleases["OpenHV/OpenHV"],
          }),
        ),
        Effect.provide(console.layer),
      ),
    );

    expect(results["ra"].stable).toBeNull();
    expect(results["ra"].playtest?.tag_name).toBe("playtest-20250401");
  });

  it("fails the whole fetch when a repo is rate limited", async () => {
    const console = makeMockConsole();
    const promise = Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(
          makeMockHttpClient({
            "https://api.github.com/repos/OpenRA/OpenRA/releases?per_page=30": {
              status: 403,
              headers: {
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": "2000000000",
                "retry-after": "120",
              },
              body: { message: "API rate limit exceeded" },
            },
            "https://api.github.com/repos/OpenHV/OpenHV/releases?per_page=30":
              mockReleases["OpenHV/OpenHV"],
          }),
        ),
        Effect.provide(console.layer),
      ),
    );

    await expect(promise).rejects.toMatchObject({
      _tag: "RateLimitError",
      repo: "OpenRA/OpenRA",
    });

    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    const rateError = error as RateLimitError;
    expect(Option.getOrElse(rateError.resetAt, () => 0)).toBe(2000000000);
    expect(Option.getOrElse(rateError.retryAfter, () => 0)).toBe(120);
  });

  it("fails the whole fetch on a non-2xx response", async () => {
    const console = makeMockConsole();
    const promise = Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(
          makeMockHttpClient({
            "https://api.github.com/repos/OpenRA/OpenRA/releases?per_page=30": {
              status: 404,
              body: { message: "Not Found" },
            },
            "https://api.github.com/repos/OpenHV/OpenHV/releases?per_page=30":
              mockReleases["OpenHV/OpenHV"],
          }),
        ),
        Effect.provide(console.layer),
      ),
    );

    await expect(promise).rejects.toMatchObject({
      _tag: "RepoFetchError",
      repo: "OpenRA/OpenRA",
      status: 404,
      bodySnippet: expect.stringContaining("Not Found") as string,
    });
  });

  it("sends an Authorization header when GITHUB_TOKEN is set", async () => {
    let authorization: Option.Option<string> = Option.none();
    const capturing = Layer.succeed(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        authorization = Headers.get(request.headers, "authorization");
        const body = mockUrls[request.url] ?? [];
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          ),
        );
      }),
    );

    const console = makeMockConsole();
    await Effect.runPromise(
      fetchModReleases.pipe(
        Effect.provide(testModsLayer),
        Effect.provide(capturing),
        Effect.provide(console.layer),
        Effect.provide(
          ConfigProvider.layer(ConfigProvider.fromUnknown({ GITHUB_TOKEN: "test-token" })),
        ),
      ),
    );

    expect(authorization).toEqual(Option.some("Bearer test-token"));
  });
});
