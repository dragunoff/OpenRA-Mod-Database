import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { Mods, makeModsLayer } from "./mods.js";

describe("Mods", () => {
  it("provides the mod list via context", async () => {
    const mods = await Effect.runPromise(
      Mods.pipe(
        Effect.provide(
          makeModsLayer({
            a: { repo: "Org/A", homepage: "https://a.example.com", title: "Mod A" },
            c: { repo: "Org/C", homepage: "https://c.example.com", title: "Mod C" },
          }),
        ),
      ),
    );
    expect(mods).toEqual({
      a: { repo: "Org/A", homepage: "https://a.example.com", title: "Mod A" },
      c: { repo: "Org/C", homepage: "https://c.example.com", title: "Mod C" },
    });
  });
});
