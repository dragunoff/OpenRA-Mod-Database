import { Schema } from "effect";

export const Asset = Schema.Struct({
  browser_download_url: Schema.String,
  name: Schema.String,
  content_type: Schema.String,
  label: Schema.NullOr(Schema.String),
});

export const Release = Schema.Struct({
  id: Schema.Number,
  name: Schema.NullOr(Schema.String),
  body: Schema.NullOr(Schema.String),
  tag_name: Schema.String,
  prerelease: Schema.Boolean,
  html_url: Schema.String,
  published_at: Schema.NullOr(Schema.String),
  assets: Schema.Array(Asset),
});

export type Release = typeof Release.Type;

export const GitHubReleases = Schema.Array(Release);

export type ModReleases = {
  readonly stable: Release | null;
  readonly playtest: Release | null;
};
