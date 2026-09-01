export type Mod = {
  readonly repo: string;
  readonly homepage: string | null;
  readonly title: string;
  readonly description?: string;
  /** Base name of the logo file under `logos/` (e.g. "ca"). Omit for no icon. */
  readonly logo?: string;
};

export const MODS: Record<string, Mod> = {
  ca: {
    repo: "Inq8/CAmod",
    homepage: "https://www.moddb.com/mods/command-conquer-combined-arms",
    title: "Combined Arms",
    logo: "ca",
    description:
      "Experience classic Command & Conquer and Red Alert action combined in one game! Always wondered who would win a fight between the Soviets & GDI? or Allies & NOD? Well wonder no longer!",
  },
  cameo: {
    repo: "Zeruel87/Cameo-mod",
    homepage: "https://www.moddb.com/mods/cameo",
    title: "Cameo",
    logo: "cameo",
    description:
      "Featuring over 110 Playable Factions (and counting), over 200 maps with up to 16 players on 12 different terrains with Full Multiplayer Support, Cameo is one of (if not) the worlds' biggest free RTS game.",
  },
  cnc: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Tiberian Dawn",
    logo: "cnc",
    description: "OpenRA reimplementation of Command & Conquer: Tiberian Dawn",
  },
  d2: {
    repo: "OpenRA/d2",
    homepage: null,
    title: "Dune 2",
    logo: "d2",

    description: "OpenRA reimplementation of Dune II: Battle for Arrakis",
  },
  d2k: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Dune 2000",
    logo: "d2k",
    description: "OpenRA reimplementation of Dune 2000",
  },
  dr: {
    repo: "drogoganor/OpenDR",
    homepage: null,
    title: "OpenDR",
    logo: "dr",
  },
  e2140: {
    repo: "OpenE2140/OpenE2140",
    homepage: "https://opene2140.net/",
    title: "OpenE2140",
    logo: "e2140",
    description:
      "OpenE2140 is remake of old game Earth 2140 created as mod for open-source OpenRA engine.",
  },
  fnw: {
    title: "Fractured Realms",
    repo: "Logue-Yne/Fractured-Realms",
    homepage: "https://www.moddb.com/mods/fractured-realms",
    logo: "fnw",
    description:
      "Fractured Realms is a mod for OpenRA, it is an RTS heavily inspired by the Command and Conquer serie.  3 Factions are Curently available, the Red Alliance, the Baneslayer Order and the Horizon Conclave. and the 4th, the Earth Federation is on its way !",
  },
  gen: {
    repo: "MustaphaTR/Generals-Alpha",
    homepage: "https://www.moddb.com/mods/generals-alpha",
    title: "Generals Alpha",
    logo: "gen",
    description:
      "Generals Alpha is an OpenRA mod that recreates Command & Conquer: Generals on OpenRA engine as much as possible but using Red Alert and Tiberian Dawn artworks.",
  },
  hv: { repo: "OpenHV/OpenHV", homepage: "https://www.openhv.net", title: "OpenHV", logo: "hv" },
  mtrsd2k2: {
    repo: "MustaphaTR/MustaphaTR-s-D2K-Mod",
    homepage: null,
    title: "MustaphaTR's D2K Mod",
    logo: "mtrsd2k2",
    description:
      "MustaphaTR's D2K mod is a small mod based on original D2K mod of OpenRA. It includes all 8 sides (Atreides, Fremen, Ixians, Harkonnen, Corrino, Ordos, Mercenaries, Smugglers) as playable and has special units and abilities for each.",
  },
  openkrush_gen1: {
    repo: "IceReaper/OpenKrush",
    homepage: null,
    title: "OpenKrush",
    logo: "openkrush_gen1",
  },
  openop2: {
    repo: "OpenOP2/OpenOP2",
    homepage: null,
    title: "OpenOP2",
    logo: "openop2",
  },
  ra: {
    repo: "OpenRA/OpenRA",
    homepage: "https://www.openra.net",
    title: "Red Alert",
    logo: "ra",
    description: "OpenRA reimplementation of Command & Conquer: Red Alert",
  },
  raclassic: {
    repo: "OpenRA/raclassic",
    homepage: null,
    title: "RA Classic",
    logo: "raclassic",
  },
  raplus: {
    repo: "MlemandPurrs/raplusmod",
    homepage: "https://www.moddb.com/mods/ra-plus-mod",
    title: "Red Alert Plus",
    logo: "raplus",
    description:
      "This is a sub-mod for OpenRA's Red Alert mod that technically depends on it, yet is offered as a Standalone release. The mod vastly expands the number of available countries per side, with its aim being to flesh out the subfactions mechanic found in the RA mod.",
  },
  rv: {
    repo: "MustaphaTR/Romanovs-Vengeance",
    homepage: "https://www.moddb.com/mods/romanovs-vengeance",
    title: "Romanov's Vengeance",
    logo: "rv",
    description:
      "OpenRA mod based on Command & Conquer: Red Alert 2, rebalancing and adding new logics to the Allies, Soviets and Yuri to make it more competitive.",
  },
  sa: {
    repo: "Dzierzan/OpenSA",
    homepage: "https://www.moddb.com/mods/opensa",
    title: "OpenSA",
    logo: "sa",
    description:
      "OpenSA (SA stands for Swarm Assault) is a real time strategy game that requires you to control huge swarms of ants, beetles, spiders, scorpions or wasps in a desperate attempt to control the landscape. No resources, no population cap, just build your army and smash the enemy!",
  },
  sp: {
    repo: "ABrandau/Shattered-Paradise-SDK",
    homepage: "http://www.moddb.com/mods/shattered-paradise",
    title: "Shattered Paradise",
    logo: "sp",
    description:
      "Shattered Paradise is an expansion for Tiberian Sun on OpenRA, its goal is to (im)balance the game by adding new factions (Mutants, C.A.B.A.L. and Scrin) and reworking the original sides, all of this to create a game a little more varied and balanced than TS. The mod puts a lot of emphasis on making the factions as asymmetric as possible.",
  },
  ss: {
    repo: "MustaphaTR/sole-survivor",
    homepage: null,
    title: "Sole Survivor",
    logo: "ss",
  },
  swp: {
    repo: "Pinkthoth/openra-swp",
    homepage: "https://www.moddb.com/mods/openra-schwerpunkt",
    title: "OpenRA - Schwerpunkt",
    logo: "swp",
    description:
      "Red Alert Schwerpunkt is an alternative history mod based on the original Red Alert, using the OpenRA engine. Scwerpunkt's timeline follows the Red Alert 1 Soviet campaign up till the 14th and last Soviet mission, Soviet Supremacy.",
  },
  ta: {
    repo: "EoralMilk/TiberianAurora",
    homepage: "https://www.moddb.com/mods/tiberian-aurora",
    title: "Tiberian Aurora",
    logo: "ta",
  },
  tda: {
    repo: "KOYK/OpenRA-Tiberian-Dawn-Apolyton",
    homepage: "https://www.moddb.com/mods/tiberian-dawn-apolyton",
    title: "Tiberian Dawn Apolyton",
    logo: "tda",
    description: "Tiberian Dawn Apolyton mod for OpenRA",
  },
};
