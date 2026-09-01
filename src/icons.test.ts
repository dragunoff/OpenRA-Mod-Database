import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { attachIcons } from "./icons.js";
import { makeMockFileSystem } from "./test-helpers.js";
import type { Mod } from "./mods-list.js";

describe("attachIcons", () => {
  it("base64-encodes a present logo into a data URI", async () => {
    const fs = makeMockFileSystem();
    const mods: Record<string, Mod> = {
      ra: { repo: "OpenRA/OpenRA", homepage: null, title: "Red Alert", logo: "ra" },
    };
    const result = await Effect.runPromise(
      attachIcons({ ra: { title: "Red Alert" } }, mods).pipe(Effect.provide(fs.layer)),
    );

    expect((result["ra"] as { icon: string | null }).icon).toBe("data:image/png;base64,AQIDBA==");
  });

  it("keeps other fields intact when attaching the icon", async () => {
    const fs = makeMockFileSystem();
    const mods: Record<string, Mod> = {
      cnc: { repo: "OpenRA/OpenRA", homepage: null, title: "Tiberian Dawn", logo: "cnc" },
    };
    const result = await Effect.runPromise(
      attachIcons({ cnc: { stable: null, title: "Tiberian Dawn" } }, mods).pipe(
        Effect.provide(fs.layer),
      ),
    );

    expect(result["cnc"]).toEqual({
      stable: null,
      title: "Tiberian Dawn",
      icon: "data:image/png;base64,iVBORw==",
    });
  });

  it("emits null when the mod has no logo", async () => {
    const fs = makeMockFileSystem();
    const mods: Record<string, Mod> = {
      d2k: { repo: "OpenRA/OpenRA", homepage: null, title: "Dune 2000" },
    };
    const result = await Effect.runPromise(
      attachIcons({ d2k: { title: "Dune 2000" } }, mods).pipe(Effect.provide(fs.layer)),
    );

    expect((result["d2k"] as { icon: string | null }).icon).toBeNull();
  });

  it("emits null and does not fail when the logo file is missing", async () => {
    const fs = makeMockFileSystem();
    const mods: Record<string, Mod> = {
      missing: { repo: "Owner/Repo", homepage: null, title: "Missing", logo: "missing" },
    };
    const result = await Effect.runPromise(
      attachIcons({ missing: { title: "Missing" } }, mods).pipe(Effect.provide(fs.layer)),
    );

    expect((result["missing"] as { icon: string | null }).icon).toBeNull();
  });
});
