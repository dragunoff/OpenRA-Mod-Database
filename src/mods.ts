import { Context, Layer } from "effect";
import type { Mod } from "./mods-list.js";

export class Mods extends Context.Service<Mods, Record<string, Mod>>()("Mods") {}

export const makeModsLayer = (mods: Record<string, Mod>): Layer.Layer<Mods> =>
  Layer.succeed(Mods, mods);
