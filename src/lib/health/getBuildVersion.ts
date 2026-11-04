/**
 * Identifies the running build.
 *
 * A version hash is what makes an incident report actionable — "error on
 * production" is not, "error on 4f2c1ad" is. The value comes from the deploy
 * platform or CI; with neither set the endpoint still answers, and says so
 * instead of inventing a version.
 */
export function getBuildVersion(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    process.env.APP_VERSION ||
    "unknown"
  );
}
