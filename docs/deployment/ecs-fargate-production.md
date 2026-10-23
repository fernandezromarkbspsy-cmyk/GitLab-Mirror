# SOC 5 Outbound ECS Fargate production setup

This runbook prepares task definitions and service prerequisites for the existing production account. It does not deploy an image, register a definition, create AWS resources, or run a migration. Keep all three ECS services at desired count **0** until the readiness gates below pass.

## Findings

- `backend/Dockerfile:1-34` builds one PHP 8.3 Alpine image with Nginx, PHP-FPM, `pdo_pgsql`, `pcntl`, curl and `EXPOSE 8000`; default command starts Supervisor. The same image can run all three roles by overriding the worker and scheduler commands.
- `backend/docker/nginx.conf:1-36` listens on 8000 and routes requests to Laravel. `backend/bootstrap/app.php:43-48` provides `/up`. Root `docker-compose.yml:1-19` uses curl against this path with 45-second start period, 10-second interval, 5-second timeout and 12 retries. The API template carries that container health check.
- `backend/docker/supervisord.conf:1-23` sends Nginx and PHP-FPM output to stdout/stderr. `backend/config/logging.php:25-31,49-54,101-110` defaults Laravel application logs to a file-backed `single` channel. Task definitions set `LOG_CHANNEL=stderr` so Laravel logs are captured by `awslogs`; this is a deliberate production override from the checked-in default.
- `docker-compose.async.yml:1-39` configures database queue/cache/session, secure cookies, `DB_QUEUE_RETRY_AFTER=120`, and `WORKFLOW_OUTBOX_PROCESSING_TIMEOUT_SECONDS=300`. It specifies worker command `php artisan queue:work database --sleep=3 --tries=3 --backoff=5 --timeout=90` and a 100-second graceful stop. `backend/config/queue.php:4-32` uses the database queue and failed-jobs table. `backend/app/Console/Commands/VerifyProductionConfig.php:220-258` requires worker timeout < reservation < outbox processing lease and PHP pcntl; the image has pcntl.
- `backend/.env.example:1-27,35-62,88-119` identifies required application, Supabase, database, SeaTalk, Sentry, and optional Google Sheets settings. `backend/.env.staging.example:1-26` is staging-only and has intentionally blank connection details. `backend/app/Console/Commands/VerifyProductionConfig.php:12-32,90-122` requires APP_KEY, APP_URL, Supabase URL/publishable key/service role key, ADMIN_EMAILS, and PostgreSQL host/user/password; it enforces production APP_ENV, APP_DEBUG=false, HTTPS URLs and TLS database mode.
- `backend/bootstrap/app.php:60-75` shows scheduler events use `withoutOverlapping()` for selected events, but this alone does not establish distributed scheduler locking. Run only one scheduler task as requested until the lock backend and behavior are verified.
- `scripts/deploy/deploy-aws-ecs.sh:10-24,58-104` builds and pushes `ECR_REPOSITORY_URI:<full CI_COMMIT_SHA>`, reads the image digest, then updates the existing API, worker and scheduler services in order. Container names default to `api`, `worker`, `scheduler`. It registers revisions by copying each currently attached task definition and replacing only the matching container's image.
- Source of truth is GitLab (`outbound-project/soc-5-outbound`); GitHub is a mirror and Travis is validation-only (`.gitlab-ci.yml:1-19,122-157`). The deploy job is tag-gated and guarded by `PRODUCTION_DEPLOY_ENABLED=true` (`.gitlab-ci.yml:122-157`). Do not grant AWS deployment credentials to Travis.
- Existing context values supplied for this task include account `675911353185`, region `ap-southeast-1`, cluster `soc5-outbound-production`, ECR repo `soc5-outbound-api`, API family `soc5-outbound-api`, task/execution role names, log group, VPC, API task SG and ALB SG. These names/IDs need live verification before use. The templates use known API names and expected role ARNs, but the worker/scheduler family/service existence and subnet/ALB details remain unverified.

### Important operational findings

1. Do not use `:bootstrap` as the release image. It was reported missing and the current deploy process explicitly publishes the full 40-character Git commit SHA as the ECR tag. Select a release commit SHA only after the matching ECR image tag/digest exists. Pinning the task definition to `sha256:<digest>` is even stronger, but the deploy script updates by SHA tag; use its SHA tag for compatibility and verify the digest is immutable/protected by ECR tag immutability or pipeline policy.
2. Before any service starts, the exact image tag referenced by its task definition must exist in the stated ECR repository and be pullable by the execution role. A task-definition registration does not validate that image presence.
3. The current deploy script’s OIDC setup is not currently compatible with its required variable list: `.gitlab-ci.yml:137-149` configures `AWS_ROLE_ARN` and web identity, but `scripts/deploy/deploy-aws-ecs.sh:13-18` still requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Resolve this in GitLab CI before enabling production deploy; do not work around it with root credentials. Use a narrowly scoped GitLab OIDC role and `iam:PassRole` constrained to the two task roles.
4. The script expects all three ECS services to exist and each attached task definition to contain exactly one matching container. It does not create services, configure networking, attach an ALB, or set desired counts. The provided families are `soc5-outbound-api`, `soc5-outbound-worker`, `soc5-outbound-scheduler`; service names must be configured in GitLab variables. The script updates all three services on every tagged release.
5. Confirm `soc5-outbound-worker` and `soc5-outbound-scheduler` are valid task-definition family names for the planned services. Deploy script image updates preserve the task-definition family and every other setting from the service’s currently attached revision. Registering these templates alone does not make the script adopt them: each service must first be created/pointed to the intended family/revision. Once done, future deploys will clone those revisions and update their images.
6. The provided SG ingress relationship is appropriate: task SG inbound TCP 8000 sourced only from `soc5-api-alb-sg`. It needs egress for required dependencies. Restrict outbound to approved destinations: HTTPS 443 to AWS endpoints/Supabase/other providers and PostgreSQL TCP to the Supabase database endpoint/port. With Supabase/provider destinations on changing public IPs, use controlled NAT egress plus approved destination controls or a reviewed egress proxy; do not add public inbound or broad public task ingress. Fargate tasks in private subnets need outbound connectivity to pull ECR images, fetch Secrets Manager values, write CloudWatch logs and call Supabase/providers. Choose NAT or appropriate VPC endpoints and verify DNS/routes.
7. ECS container health does not itself prove ALB target health. Configure target group health check `GET /up` on traffic port 8000, target type **IP**, HTTP, with compatible thresholds/grace periods. ALB listener should terminate TLS and forward to the target group. Cloudflare DNS should point `api.soc5outboundops.app` to the ALB through the intended Cloudflare proxy/TLS mode.
8. Required schema tables for database-backed queue, cache and sessions must already exist. The task is explicitly not to migrate; have the production owner confirm schema readiness before enabling tasks.

## Task-definition templates

The templates are repository-native JSON inputs for **Register new task definition** in the ECS console. Replace every `REPLACE_WITH_...` token and every placeholder ARN before registration. Never enter a real secret in these files. They use exact family/container names expected by the deploy script.

| Family | Container | Command | Health check |
|---|---|---|---|
| `soc5-outbound-api` | `api` | Docker default: Supervisor + Nginx/PHP-FPM | curl `http://127.0.0.1:8000/up` |
| `soc5-outbound-worker` | `worker` | `php artisan queue:work database --sleep=3 --tries=3 --backoff=5 --timeout=90` | No container health check (long-running queue process); monitor task state, logs and queue backlog |
| `soc5-outbound-scheduler` | `scheduler` | `php artisan schedule:work` | No container health check (long-running scheduler process); monitor task state and logs |

Files: [API](ecs-api-task-definition.json), [worker](ecs-worker-task-definition.json), [scheduler](ecs-scheduler-task-definition.json).

### Values represented in the templates

- Fargate, `awsvpc`, Linux/X86_64, 1 vCPU / 3 GiB task size, 20 GiB ephemeral storage (Fargate minimum/default; increase only if measured need), execution role and task role ARNs for account `675911353185`.
- Image repository URI is known, but `REPLACE_WITH_FULL_CI_COMMIT_SHA` must be replaced with an existing immutable release tag. Do not use `bootstrap` unless a live ECR check proves it exists and the release owner explicitly selects it; SHA-tagged release is the repository-supported approach.
- API maps TCP 8000 and has an ECS health check; worker/scheduler expose no ports. All containers use the existing CloudWatch log group with role-specific stream prefixes, `awslogs-create-group=false`.
- `stopTimeout=100` seconds fits Fargate’s maximum 120 seconds and the Compose worker grace period. Init process enabled. Only the API has a container health check; the worker command can legitimately be idle and the scheduler has no HTTP endpoint.
- Task definition `cpu`/`memory` values are verified from user-provided production context. 20 GiB ephemeral storage and 100-second container stop timeout are explicit baseline choices; raise them only after workload review.
- `LOG_CHANNEL=stderr` is required for Laravel logs to enter CloudWatch. Set retention on the already-existing log group separately.

### Required environment and secrets

Every task role needs identical application runtime configuration because each runs the same Laravel app. Required values are duplicated into all three task definitions:

- Plain environment values or production-owner inputs: `APP_NAME`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.soc5outboundops.app`, `FRONTEND_URL=https://soc5outboundops.app`, `PERFORMANCE_TELEMETRY=false`, `LOG_CHANNEL=stderr`, `LOG_LEVEL=info`, `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_SSLMODE=require`, `SUPABASE_URL`, `ADMIN_EMAILS`, `QUEUE_CONNECTION=database`, `DB_QUEUE_RETRY_AFTER=120`, `CACHE_STORE=database`, `DB_CACHE_CONNECTION=pgsql`, `DB_CACHE_LOCK_CONNECTION=pgsql`, `SESSION_DRIVER=database`, `SESSION_CONNECTION=pgsql`, secure/HTTP-only cookies, `SESSION_SAME_SITE=lax`, outbox lease `300`, SeaTalk redirect URI, and feature flags.
- Required Secrets Manager JSON fields: `APP_KEY`, `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_PUBLISHABLE_KEY`. The ready-to-fill JSON object is [soc5-outbound-production-secrets.json](soc5-outbound-production-secrets.json). Store the completed object as one Secrets Manager secret; each task definition uses a JSON-key selector to expose one field as its environment variable. The publishable key is deliberately referenced as a secret here to avoid duplicating the same variable in `environment` and `secrets`.
- Conditional secrets/settings, only if their feature is enabled: SeaTalk `SEATALK_APP_ID`, `SEATALK_APP_SECRET`, `SEATALK_CALLBACK_SIGNING_SECRET`, `SEATALK_APPROVAL_TOKEN_SECRET` and callback URLs; Sentry DSN; Google service-account JSON and sheet IDs. Add required values as ECS `secrets` and operational flags/IDs as environment values. Keep Google/SeaTalk features disabled until credentials, permissions, callbacks and values are confirmed. Do not enable optional integrations by guessing.
- Execution role needs `secretsmanager:GetSecretValue` for only the referenced secrets and `kms:Decrypt` only for customer-managed KMS keys. It also needs ECR pull and CloudWatch Logs permissions. Task role is for runtime AWS API calls; do not grant it deployment or ECR push permissions absent a demonstrated application need.
- `valueFrom` placeholders encode account/region and the JSON field selector but are not real ARNs until replaced. In each template replace only `REPLACE_WITH_RUNTIME_SECRET_NAME_AND_SUFFIX` with the resource portion of the stored secret ARN (for example `soc5-outbound/production/runtime-AbCdEf`), keeping the field suffix such as `:APP_KEY::`. This makes ECS inject each field separately.

## Safe AWS Console setup order

### 1. Gather and verify inputs

1. Sign into the intended AWS account with a named human/admin role (not root). Confirm account `675911353185` and region `ap-southeast-1` in the console.
2. Open ECR → `soc5-outbound-api` → Images. Confirm a production release image tagged with the full GitLab commit SHA exists and record its digest. Confirm ECR tag immutability/policy prevents replacing a deployed SHA tag. `bootstrap` was missing at last check; do not select it based on its name.
3. Verify the task role and execution role ARNs, trust policies, attached policies and permissions boundaries. Execution role must pull from this ECR repository, fetch the named secrets and create log streams/write events in `/ecs/soc5-outbound-api`. Scope resources to this app. Ensure GitLab deploy role is separate and only has ECR push, ECS describe/register/update/wait and narrowly scoped `iam:PassRole` permissions.
4. In Secrets Manager, store the completed [runtime secrets JSON object](soc5-outbound-production-secrets.json) as one secret (for example `soc5-outbound/production/runtime`). Copy its ARN and replace the ARN resource placeholder in all three task definitions, retaining each JSON-key suffix. Restrict read permissions to the ECS execution role. Ensure the task definition never contains literal secret values.
5. Confirm exact Supabase PostgreSQL endpoint, port, database, username/password, project URL and publishable/service-role keys. Verify TLS mode and the production schema already contains queue/cache/session and application-required tables. No migration is run in this procedure.
6. Confirm CloudWatch log group `/ecs/soc5-outbound-api` is in `ap-southeast-1`, retention/encryption policy, and execution-role write access.

### 2. Prepare network and ALB

1. Confirm the VPC `vpc-0729f2cce2e17430e` and identify at least two private ECS subnets in different AZs with routes for required egress. For image pulls, secrets and logs, provide NAT egress or the required ECR API, ECR DKR, S3, Secrets Manager and CloudWatch Logs endpoints plus DNS and routing. External Supabase/provider calls also require an egress path.
2. Verify task SG `sg-078a988b807cea1ba` is in that VPC. Keep inbound TCP 8000 **only from** ALB SG `sg-0ff366979b7f883ed`. Do not add `0.0.0.0/0` or direct public ingress. Add only necessary outbound rules: HTTPS egress to approved endpoints/NAT and TCP to the actual Supabase PostgreSQL endpoint/port. Avoid assuming an empty reported egress is still empty; inspect live rules and routing.
3. Prepare/verify ALB SG: inbound HTTPS 443 from intended internet/Cloudflare ranges (or approved restricted ingress) and outbound TCP 8000 to the task SG. Keep task ingress sourced from ALB SG only.
4. Create/verify an internet-facing ALB in at least two public subnets, HTTPS listener with certificate for `api.soc5outboundops.app`, and target group in the same VPC with target type **IP**, protocol HTTP, port 8000, path `/up`, success code 200. Attach it to the listener. Configure Cloudflare DNS and SSL/TLS mode to match the origin certificate.
5. Confirm the private subnet routing, SGs, NACLs and DNS allow the tasks to reach ALB health checks from the ALB and reach all required dependencies outbound.

### 3. Register task definitions (leave desired count 0)

1. In ECS → Task definitions → Create new task definition, choose Fargate and JSON/configuration editor (or Register new task definition using JSON). For each checked-in JSON file, substitute all placeholder environment values, secret ARNs and the chosen existing SHA image tag. Do not change family/container names or roles without updating GitLab deployment variables/script assumptions.
2. Review the resulting definition: `awsvpc`, Fargate, Linux/X86_64, 1024 CPU, 3072 MiB memory, roles, log group/region, and no literal secrets. Register API, worker and scheduler definitions. Registration is not a service start.
3. Ensure the API service references the registered `soc5-outbound-api` revision, desired count 0, private subnets only, public IP disabled, task SG attached, and ALB target group attached to container `api:8000`. Set service health-check grace period to accommodate the application startup (at least 45 seconds; consider 60 seconds after observing startup). Keep deployment circuit breaker/rollback enabled.
4. Create worker and scheduler services using the registered families, private subnets only, public IP disabled, task SG attached, no load balancer, desired count 0. Start exactly one scheduler task. If using ECS service auto scaling, keep minimum at 0 until the release gate; later enforce scheduler min/max=1.
5. Confirm services have no accidental public IP assignment and all three service task definitions use the expected family and container. Do not start any tasks yet.

### 4. Readiness gate before setting desired count above zero

- The selected SHA tag exists in ECR and its digest matches the intended build; task execution role can pull it.
- All secret ARNs and plain values are real, current and correctly scoped; no `REPLACE_WITH_` placeholders remain. `APP_KEY` is stable across all three roles.
- Production owner has confirmed all required tables/schema are already present; no migrations are pending for queue/cache/session/application code.
- Private subnets have verified DNS/routes and outbound connections to ECR, Secrets Manager, CloudWatch Logs, Supabase PostgreSQL/API and enabled external providers.
- Task SG ingress remains TCP 8000 from ALB SG only; outbound allows approved dependencies. ALB target group is IP/8000/`/up`; certificate, listener and Cloudflare DNS are ready.
- Definitions show `api`, `worker`, `scheduler` names and all service family names match the deploy script configuration. Deploy OIDC/IAM blocker has been fixed before allowing tagged deployments.
- Start first with API desired count 1 and confirm ECS task `RUNNING`, container health `HEALTHY`, target group healthy and `/up` returns 200 through the ALB. Then start worker desired count 1 and confirm logs/no crash/queue connectivity. Start scheduler desired count exactly 1 and verify scheduled activity/logs.
- Only after these checks should production desired counts and autoscaling policy be approved. The GitLab deploy job updates all three services on each release tag, so ensure all three are ready before enabling it.

## CI deployment compatibility and prerequisites

The script pins each new deployment to `ECR_REPOSITORY_URI:$CI_COMMIT_SHA` and validates the pushed digest. Set GitLab protected variables for the expected account, region `ap-southeast-1`, repository URI `675911353185.dkr.ecr.ap-southeast-1.amazonaws.com/soc5-outbound-api`, cluster, and all three service names. Optional container-name variables should be exactly `api`, `worker`, and `scheduler` (or leave unset for script defaults).

Before the job can work, all three services must already exist and must each point to a task-definition revision with exactly one expected container. API service must be correctly attached to the ALB and private networking; worker/scheduler must exist with correct desired count and network. The script only modifies image, registers a new revision, updates service task-definition and waits for stable; it does not correct roles, env, secrets, health checks, load balancers or networking. Since it updates all three services, an incomplete worker/scheduler setup blocks the release after API may already have rolled out.

Production GitLab OIDC should be fixed to avoid requiring static access keys. The deploy role needs ECR login/push/read digest for only this repository, ECS describe services/task definitions, `ecs:RegisterTaskDefinition`, `ecs:UpdateService` limited to this cluster’s three services, and `iam:PassRole` limited to the exact execution/task roles with `iam:PassedToService=ecs-tasks.amazonaws.com`. Protect release tags and the GitLab environment/variables. AWS access must be through the GitLab OIDC role or a named human role, never root. Travis remains validation-only and must receive no AWS deployment credentials.

## Values still needed from AWS or the production owner

- Exact production Supabase host, port, database, username, password, Supabase project URL, publishable key and service-role key; connection pooling mode/port and allowed network policy.
- Production administrator email list; stable Laravel `APP_KEY`; secret ARNs/secret JSON shapes and KMS key ARN if customer-managed encryption is used.
- Decision whether SeaTalk approval/login, Google Sheets integrations and Sentry are enabled in production; if enabled, all provider credentials, IDs, callbacks, permissions, sheet IDs, Sentry DSN and operational values.
- Verified role ARNs/trust/policies, task role permissions, execution role permissions, permissions boundaries, and GitLab OIDC role ARN/trust constraints.
- Existing ECR SHA image tag and digest, tag immutability status, release SHA, and confirmation task execution role can pull it.
- Verified private subnet IDs/AZs/route tables, NAT/endpoints, DNS settings/NACL rules, SG current ingress/egress, and outbound allowlist design for Supabase/providers.
- ALB ARN/name, subnet/AZ placement, ALB SG, certificate ARN, listener rule/priority, target-group ARN, health thresholds/grace period, and Cloudflare record/proxy/TLS configuration.
- Whether worker and scheduler services/families already exist, required desired counts/autoscaling, and confirmation distributed scheduler locks use a shared persistent backend before ever scaling scheduler above one.
- Confirmation production database schema already supports database queue, cache, sessions, failed jobs and the application’s scheduled jobs; no migrations are performed here.
- CloudWatch retention/encryption settings and any environment-specific logging/Sentry sampling policy.

## Validation checklist

- [ ] Parse all three JSON files and confirm no duplicate environment/secrets name and no placeholder is left in the final console input.
- [ ] Verify Fargate compatibility, valid CPU/memory pair, awsvpc and runtime platform.
- [ ] Verify task and execution role ARNs/trust and least-privilege policies; confirm PassRole is limited.
- [ ] Verify image tag exists and record digest; verify immutable SHA tag policy.
- [ ] Verify required Secrets Manager ARNs and execution-role access; never print values in logs/CLI output.
- [ ] Verify log group and log stream prefix/region, health endpoint, start/stop timing.
- [ ] Verify all services desired count 0 until readiness gates; API has private subnet, no public IP, target group API:8000; worker/scheduler private and without LB.
- [ ] Verify SG task ingress only from ALB SG on TCP 8000 and controlled egress for dependencies.
- [ ] Verify target type IP, health path `/up`, HTTPS listener/certificate and Cloudflare origin configuration.
- [ ] Verify GitLab production OIDC job no longer requires static credentials; deploy role cannot be used by Travis and is not root.
- [ ] Verify service/family/container-name alignment and remember each tag release updates all three services.
- [ ] Start API first, validate ALB target healthy, then worker and one scheduler; inspect CloudWatch logs and queue/scheduler behavior.

## Read-only AWS CLI checks (PowerShell)

These commands are examples only and were **not run**. Use a named, read-only operator profile/role in the correct account; do not use root. Commands call only `describe`, `list`, `get`, `sts get-caller-identity`, or `ecr describe` APIs.

```powershell
$Region = 'ap-southeast-1'
$Cluster = 'soc5-outbound-production'
$EcrRepo = 'soc5-outbound-api'
$ApiService = 'soc5-outbound-api'
$WorkerService = 'REPLACE_WITH_WORKER_SERVICE_NAME'
$SchedulerService = 'REPLACE_WITH_SCHEDULER_SERVICE_NAME'
$TargetGroupArn = 'REPLACE_WITH_TARGET_GROUP_ARN'
$Profile = 'REPLACE_WITH_NAMED_READ_ONLY_PROFILE'

aws sts get-caller-identity --profile $Profile
aws ecs list-task-definitions --family-prefix soc5-outbound-api --status ACTIVE --sort DESC --region $Region --profile $Profile
aws ecs describe-task-definition --task-definition soc5-outbound-api --include TAGS --region $Region --profile $Profile
aws ecs describe-task-definition --task-definition soc5-outbound-worker --include TAGS --region $Region --profile $Profile
aws ecs describe-task-definition --task-definition soc5-outbound-scheduler --include TAGS --region $Region --profile $Profile

aws iam get-role --role-name soc5-outbound-production-task --profile $Profile
aws iam get-role --role-name soc5-outbound-production-task-execution --profile $Profile
aws iam list-attached-role-policies --role-name soc5-outbound-production-task --profile $Profile
aws iam list-attached-role-policies --role-name soc5-outbound-production-task-execution --profile $Profile
aws iam list-role-policies --role-name soc5-outbound-production-task --profile $Profile
aws iam list-role-policies --role-name soc5-outbound-production-task-execution --profile $Profile

aws ecr describe-images --repository-name $EcrRepo --region $Region --profile $Profile --query 'imageDetails[].{tags:imageTags,digest:imageDigest,pushedAt:imagePushedAt}' --output table
aws ecs describe-services --cluster $Cluster --services $ApiService $WorkerService $SchedulerService --region $Region --profile $Profile --query 'services[].{name:serviceName,status:status,desired:desiredCount,running:runningCount,taskDefinition:taskDefinition,launchType:launchType,network:networkConfiguration,loadBalancers:loadBalancers,deployments:deployments[].{status:rolloutState,taskDefinition:taskDefinition}}' --output json

aws ec2 describe-security-groups --group-ids sg-078a988b807cea1ba sg-0ff366979b7f883ed --region $Region --profile $Profile --query 'SecurityGroups[].{id:GroupId,name:GroupName,vpc:VpcId,ingress:IpPermissions,egress:IpPermissionsEgress}' --output json
aws elbv2 describe-target-health --target-group-arn $TargetGroupArn --region $Region --profile $Profile --query 'TargetHealthDescriptions[].{target:Target,health:TargetHealth.State,reason:TargetHealth.Reason,description:TargetHealth.Description}' --output table
aws logs describe-log-groups --log-group-name-prefix /ecs/soc5-outbound-api --region $Region --profile $Profile --query 'logGroups[].{name:logGroupName,retention:retentionInDays,encrypted:kmsKeyId}' --output table
```

`describe-services` can return a `failures` collection alongside services; verify it is empty. For role policies, retrieve individual policies only when needed for review and avoid dumping secret values. To inspect registered revision/container names, use `describe-task-definition` and examine `family`, `revision`, `taskRoleArn`, `executionRoleArn`, `runtimePlatform`, `containerDefinitions[].name`, `.image`, `.portMappings`, `.healthCheck`, `.logConfiguration` and `.secrets[].valueFrom`; never print environment/secret values into a shared terminal transcript.

## Repository changes and validation performed

- Added the three ECS JSON templates and this setup guide. No application code, CI code, AWS account resource, image or database was changed.
- No deployment, migration, test, or AWS CLI command was run. JSON syntax/structure and placeholders should be checked locally before registering; the AWS CLI block above is for the user to run after substituting names and profile.
