import { Config, Console, Effect, Option, Result, Schema } from "effect";
import { HttpClient, Headers } from "effect/unstable/http";
import type { HttpClientResponse } from "effect/unstable/http";
import { Mods } from "./mods.js";
import { classifyReleases } from "./classify-releases.js";
import { RateLimitError, RepoFetchError } from "./errors.schema.js";
import { GitHubReleases } from "./releases.schema.js";
import { GitHubRepo } from "./repo.schema.js";

type RepoMod = {
  readonly name: string;
  readonly repo: string;
  readonly homepage: string | null;
  readonly title: string;
  readonly description?: string;
};

const linkHeader = (
  response: HttpClientResponse.HttpClientResponse,
  name: string,
): Option.Option<number> =>
  Option.flatMap(Headers.get(response.headers, name), (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Option.some(n) : Option.none();
  });

const checkResponse = (
  repo: string,
  response: HttpClientResponse.HttpClientResponse,
): Effect.Effect<HttpClientResponse.HttpClientResponse, RateLimitError | RepoFetchError, never> => {
  const isRateLimited =
    response.status === 429 ||
    (response.status === 403 &&
      Option.contains(Headers.get(response.headers, "x-ratelimit-remaining"), "0"));

  if (isRateLimited) {
    return Effect.fail(
      new RateLimitError({
        repo,
        resetAt: linkHeader(response, "x-ratelimit-reset"),
        retryAfter: linkHeader(response, "retry-after"),
      }),
    );
  }

  if (response.status < 200 || response.status >= 300) {
    return Effect.result(response.text).pipe(
      Effect.map(
        (result) =>
          new RepoFetchError({
            repo,
            status: response.status,
            bodySnippet: Result.isSuccess(result) ? result.success.slice(0, 200) : "",
          }),
      ),
      Effect.flatMap(Effect.fail),
    );
  }

  return Effect.succeed(response);
};

export const fetchModReleases = Effect.gen(function* () {
  const mods = yield* Mods;
  const token = yield* Config.option(Config.string("GITHUB_TOKEN"));
  const headers = Option.isSome(token) ? { authorization: `Bearer ${token.value}` } : undefined;

  const modsByRepo = Object.groupBy(
    Object.entries(mods).map(([name, mod]) => ({ name, ...mod })),
    (x) => x.repo,
  ) as Record<string, Array<RepoMod>>;

  const perRepo = yield* Effect.forEach(Object.entries(modsByRepo), ([repo, repoMods]) => {
    const releasesUrl = `https://api.github.com/repos/${repo}/releases?per_page=30`;
    const repoUrl = `https://api.github.com/repos/${repo}`;
    const needsRepoInfo = repoMods.some((mod) => mod.description == null || mod.homepage == null);

    const getJson = (url: string) =>
      HttpClient.get(url, headers ? { headers } : undefined).pipe(
        Effect.flatMap((response) => checkResponse(repo, response)),
        Effect.flatMap((response) => response.json),
      );

    const releases = getJson(releasesUrl).pipe(
      Effect.flatMap((json) => Schema.decodeUnknownEffect(GitHubReleases)(json)),
      Effect.map(classifyReleases),
    );

    const repoMetadata = needsRepoInfo
      ? getJson(repoUrl).pipe(
          Effect.flatMap((json) => Schema.decodeUnknownEffect(GitHubRepo)(json)),
          Effect.map((repoInfo) => ({
            description: repoInfo.description,
            homepage: repoInfo.homepage || null,
          })),
        )
      : Effect.succeed({ description: null, homepage: null });

    return Effect.all([releases, repoMetadata]).pipe(
      Effect.tap(([classified]) =>
        Console.log(
          `Fetched ${repo}: stable=${classified.stable?.tag_name ?? "none"}, pre=${classified.playtest?.tag_name ?? "none"}`,
        ),
      ),
      Effect.map(([classified, metadata]) =>
        Object.fromEntries(
          repoMods.map(({ name: modName, repo: modRepo, homepage, title, description }) => [
            modName,
            {
              ...classified,
              repo_url: `https://github.com/${modRepo}`,
              homepage: homepage ?? metadata.homepage,
              title,
              description: description ?? metadata.description,
            },
          ]),
        ),
      ),
    );
  });

  return Object.assign({}, ...perRepo);
});
