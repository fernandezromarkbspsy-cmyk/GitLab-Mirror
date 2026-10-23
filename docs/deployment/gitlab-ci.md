# GitLab CI/CD

`.gitlab-ci.yml` is the pipeline for the GitLab project. Merge requests and
branch pushes run the frontend quality, unit, and browser checks; backend quality
checks; edge-function checks; and Docker/release configuration verification.
Merge requests and the default branch also run PostgreSQL workflow and complete
migration-chain jobs. Tags run staging release acceptance before the optional
production deployment.

## Runner requirements

Use a Linux GitLab Runner with Docker executor and privileged Docker-in-Docker
support for the `deployment-config` and `publish-deploy-production` jobs. The
other jobs use their declared container images. The `postgres:16` service is
isolated to the PostgreSQL jobs.

## CI/CD variables

Set release variables in **Settings → CI/CD → Variables**. Mark secrets masked
and protected. Protect the release tag pattern and allow deployment only from
the intended protected release refs.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `STAGING_BASE_URL` | Tag release acceptance | HTTPS staging application URL |
| `STAGING_AUTH_STATE_B64` or `STAGING_AUTH_STATE` | Tag release acceptance | Staging-only Playwright storage state, base64 encoded or a protected file variable |
| `PRODUCTION_DEPLOY_ENABLED` | Production deploy | Set to `true` to enable the optional production job |
| `AWS_ROLE_ARN` | Production deploy | Optional IAM role for GitLab OIDC; configure the role trust policy for this GitLab project and protected release refs |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Production deploy | Fallback least-privilege AWS credentials when OIDC is not configured |
| `AWS_DEFAULT_REGION` | Production deploy | AWS region containing ECR and ECS |
| `EXPECTED_AWS_ACCOUNT_ID` | Production deploy | Expected 12-digit AWS account ID |
| `ECR_REPOSITORY_URI` | Production deploy | One ECR repository URI in the expected account |
| `ECS_CLUSTER` | Production deploy | ECS cluster name |
| `ECS_API_SERVICE`, `ECS_WORKER_SERVICE`, `ECS_SCHEDULER_SERVICE` | Production deploy | ECS services to update |
| `ECS_API_CONTAINER_NAME`, `ECS_WORKER_CONTAINER_NAME`, `ECS_SCHEDULER_CONTAINER_NAME` | Production deploy | Optional container-name overrides; defaults are `api`, `worker`, and `scheduler` |

Do not enable production deployment until the account, services, container
names, protected variables, IAM permissions, and release protections have been
reviewed. The deploy script publishes the backend image and updates the API,
worker, then scheduler services. It does not run production database migrations.

## Migration from Travis

Keep Travis enabled while the GitLab pipeline is being validated. After the
GitLab pipeline succeeds on the default branch and the configured tag/release
jobs are confirmed, deactivate the GitLab mirror's Travis project in Travis
CI. Remove `.travis.yml` in a follow-up commit so Travis no longer discovers a
pipeline definition in the repository.
