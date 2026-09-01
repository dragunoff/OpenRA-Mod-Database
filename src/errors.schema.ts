import { Schema } from "effect";

export class RateLimitError extends Schema.TaggedError<RateLimitError>()("RateLimitError", {
  repo: Schema.String,
  resetAt: Schema.OptionFromNullOr(Schema.Number),
  retryAfter: Schema.OptionFromNullOr(Schema.Number),
}) {}

export class RepoFetchError extends Schema.TaggedError<RepoFetchError>()("RepoFetchError", {
  repo: Schema.String,
  status: Schema.Number,
  bodySnippet: Schema.String,
}) {}
