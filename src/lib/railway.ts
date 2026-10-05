import { createServerOnlyFn } from '@tanstack/react-start'

// Railway injects these into every deployment:
// https://docs.railway.com/variables/reference#railway-provided-variables
// createServerOnlyFn makes this throw if it is ever called from the browser.
export const getRailwayEnv = createServerOnlyFn(() => {
  const env = process.env
  return {
    onRailway: Boolean(env.RAILWAY_ENVIRONMENT_ID),
    region: env.RAILWAY_REPLICA_REGION ?? 'local',
    replicaId: env.RAILWAY_REPLICA_ID ?? null,
    deploymentId: env.RAILWAY_DEPLOYMENT_ID ?? null,
    commitSha: env.RAILWAY_GIT_COMMIT_SHA ?? null,
    commitMessage: env.RAILWAY_GIT_COMMIT_MESSAGE ?? null,
    branch: env.RAILWAY_GIT_BRANCH ?? null,
    serviceName: env.RAILWAY_SERVICE_NAME ?? 'local',
    environmentName: env.RAILWAY_ENVIRONMENT_NAME ?? 'development',
    publicDomain: env.RAILWAY_PUBLIC_DOMAIN ?? null,
  }
})

export type RailwayEnv = ReturnType<typeof getRailwayEnv>
