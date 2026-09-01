import { Option } from "effect";
import { RateLimitError, RepoFetchError } from "./errors.schema.js";

export const formatError = (error: unknown): string => {
  if (error instanceof RateLimitError) {
    const resetAt = Option.isSome(error.resetAt)
      ? new Date(error.resetAt.value * 1000).toISOString()
      : "shortly";
    const retryAfter = Option.isSome(error.retryAfter)
      ? ` Retry in ${error.retryAfter.value}s.`
      : "";
    return (
      `GitHub API rate limit exceeded while fetching ${error.repo}.` +
      `${retryAfter} Rate limit resets at ${resetAt}.` +
      " Set GITHUB_TOKEN to raise the limit."
    );
  }
  if (error instanceof RepoFetchError) {
    const snippet = error.bodySnippet ? ` — ${error.bodySnippet}` : "";
    return `Failed to fetch ${error.repo}: HTTP ${error.status}${snippet}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
