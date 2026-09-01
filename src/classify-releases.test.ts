import { describe, it, expect } from "vitest";
import { classifyReleases } from "./classify-releases.js";

describe("classifyReleases", () => {
  it("returns both stable and playtest when present", () => {
    const releases = [
      {
        id: 1,
        name: "",
        tag_name: "v1.0",
        prerelease: false,
        html_url: "https://github.com/example/releases/tag/v1.0",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
      {
        id: 2,
        name: "",
        tag_name: "v2.0-rc1",
        prerelease: true,
        html_url: "https://github.com/example/releases/tag/v2.0-rc1",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
    ];
    const result = classifyReleases(releases);
    expect(result.stable?.tag_name).toBe("v1.0");
    expect(result.playtest?.tag_name).toBe("v2.0-rc1");
  });

  it("returns stable only", () => {
    const releases = [
      {
        id: 1,
        name: "",
        tag_name: "v1.0",
        prerelease: false,
        html_url: "https://github.com/example/releases/tag/v1.0",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
      {
        id: 2,
        name: "",
        tag_name: "v1.1",
        prerelease: false,
        html_url: "https://github.com/example/releases/tag/v1.1",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
    ];
    const result = classifyReleases(releases);
    expect(result.stable?.tag_name).toBe("v1.0");
    expect(result.playtest).toBeNull();
  });

  it("returns playtest only", () => {
    const releases = [
      {
        id: 1,
        name: "",
        tag_name: "v2.0-rc1",
        prerelease: true,
        html_url: "https://github.com/example/releases/tag/v2.0-rc1",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
    ];
    const result = classifyReleases(releases);
    expect(result.stable).toBeNull();
    expect(result.playtest?.tag_name).toBe("v2.0-rc1");
  });

  it("returns null for both when empty array", () => {
    const result = classifyReleases([]);
    expect(result.stable).toBeNull();
    expect(result.playtest).toBeNull();
  });

  it("picks first stable release from multiple", () => {
    const releases = [
      {
        id: 1,
        name: "",
        tag_name: "v2.0",
        prerelease: false,
        html_url: "https://github.com/example/releases/tag/v2.0",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
      {
        id: 2,
        name: "",
        tag_name: "v1.0",
        prerelease: false,
        html_url: "https://github.com/example/releases/tag/v1.0",
        body: "",
        published_at: "2024-01-15T12:00:00Z",
        assets: [],
      },
    ];
    const result = classifyReleases(releases);
    expect(result.stable?.tag_name).toBe("v2.0");
  });
});
