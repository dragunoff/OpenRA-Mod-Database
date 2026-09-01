import { Console, Effect } from "effect";
import { FileSystem } from "effect/FileSystem";
import { FetchHttpClient } from "effect/unstable/http";
import { layer as NodeFileSystemLayer } from "@effect/platform-node/NodeFileSystem";
import { makeModsLayer, Mods } from "./mods.js";
import { fetchModReleases } from "./fetch.js";
import { attachIcons } from "./icons.js";
import { sortByKeys } from "./utils.js";
import { MODS } from "./mods-list.js";
import { formatError } from "./format-error.js";
import { RateLimitError, RepoFetchError } from "./errors.schema.js";

export const VERSION = 2;

export const program = Effect.gen(function* () {
  const mods = yield* Mods;
  const data = yield* fetchModReleases;
  const withIcons = yield* attachIcons(data, mods);
  const sorted = sortByKeys(withIcons);
  const json = JSON.stringify({ version: VERSION, mods: sorted }, null, 2) + "\n";

  const fs = yield* FileSystem;
  yield* fs.makeDirectory("dist", { recursive: true });
  yield* fs.writeFileString("dist/OpenRA-Mod-Database.json", json);
  yield* Console.log("Wrote OpenRA-Mod-Database.json");
}).pipe(
  Effect.catchIf(
    () => true,
    (error) =>
      Effect.gen(function* () {
        yield* Console.error(formatError(error));
        yield* Console.error("No OpenRA-Mod-Database.json was written.");
        return yield* Effect.fail(error);
      }),
  ),
);

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  Effect.runPromise(
    program.pipe(
      Effect.provide(makeModsLayer(MODS)),
      Effect.provide(FetchHttpClient.layer),
      Effect.provide(NodeFileSystemLayer),
    ),
  ).catch((error) => {
    if (error instanceof RateLimitError || error instanceof RepoFetchError) {
      process.exitCode = 1;
      return;
    }
    console.error(error);
    process.exitCode = 1;
  });
}
