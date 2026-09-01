import { Effect } from "effect";
import { FileSystem } from "effect/FileSystem";
import type { Mod } from "./mods-list.js";

const dataUri = (bytes: Uint8Array<ArrayBufferLike>): string =>
  `data:image/png;base64,${globalThis.Buffer.from(bytes).toString("base64")}`;

const readLogo = (fs: FileSystem, logo: string | undefined): Effect.Effect<string | null> =>
  logo == null
    ? Effect.succeed(null)
    : fs.readFile(`logos/${logo}.png`).pipe(
        Effect.map(dataUri),
        Effect.catch(() => Effect.succeed(null)),
      );

export const attachIcons = (
  data: Record<string, Record<string, unknown>>,
  mods: Record<string, Mod>,
): Effect.Effect<Record<string, unknown>, never, FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    const icons = yield* Effect.forEach(Object.entries(mods), ([key, mod]) =>
      readLogo(fs, mod.logo).pipe(Effect.map((icon) => [key, icon] as const)),
    );
    const iconByName = new Map(icons);
    return Object.fromEntries(
      Object.entries(data).map(([key, entry]) => [
        key,
        { ...entry, icon: iconByName.get(key) ?? null },
      ]),
    );
  });
