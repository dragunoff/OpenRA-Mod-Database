import { Schema } from "effect";

export const GitHubRepo = Schema.Struct({
  description: Schema.NullOr(Schema.String),
  homepage: Schema.NullOr(Schema.String),
});

export type GitHubRepo = typeof GitHubRepo.Type;
