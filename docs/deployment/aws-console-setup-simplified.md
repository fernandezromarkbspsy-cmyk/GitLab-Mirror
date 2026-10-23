# AWS production setup using the AWS Console

This is a click-by-click guide for the AWS Console. It creates the Laravel
backend only:

- **ECS Fargate** runs the API, queue worker, and scheduler.
- **ECR** stores the Docker image.
- **Application Load Balancer (ALB)** provides HTTPS access.
- **Secrets Manager** stores Laravel settings and secrets.
- **CloudWatch** stores container logs.
- **Supabase** continues to provide PostgreSQL, Auth, and Realtime.
- **Firebase Hosting** continues to serve the React frontend.

This guide assumes the AWS account, VPC, Docker image, Supabase project, and
Cloudflare domain are already available. Use staging before production.

> **Important:** The AWS Console can create the AWS resources, but it cannot
> build this repository's Docker image from source. Push an approved image to
> ECR using the repository's GitLab pipeline before starting the ECS service.

For frontend/API changes and the complete architecture, see
[AWS + Firebase production setup](aws-firebase-production-setup.md).

## Write these values down first

Use one AWS region for every resource. The examples below use
`ap-southeast-1` (Singapore).

| Value | Example |
| --- | --- |
| AWS Region | `ap-southeast-1` |
| ECS cluster | `soc5-outbound-production` |
| ECR repository | `soc5-outbound-api` |
| API hostname | `api.soc5outboundops.app` |
| Frontend hostname | `app.soc5outboundops.app` |
| API container name | `api` |
| API container port | `8000` |
| Health-check path | `/up` |

You also need:

- an approved production Docker image tag, preferably the full 40-character
  commit SHA;
- a production VPC with two public subnets and two private subnets;
- private-subnet outbound access through NAT or approved VPC endpoints;
- Cloudflare DNS access;
- production Supabase connection details; and
- a monthly AWS budget approved by the owner.

Do not use the AWS root account for routine work. Do not paste secrets into
Git, Docker build arguments, Firebase settings, chat, or screenshots.

## 1. Select the region and create a budget

1. Sign in to the **AWS Management Console**.
2. At the top-right, open the **Region** selector.
3. Select **Asia Pacific (Singapore) `ap-southeast-1`**.
4. In the search box at the top, search for **Billing and Cost Management**.
5. Select **Budgets** in the left menu.
6. Select **Create budget**.
7. Choose **Use a template** or **Customize**.
8. Enter the approved monthly amount.
9. Configure email alerts at 50%, 80%, and 100%.
10. Select **Create budget**.

## 2. Check the VPC before creating anything

1. Search for **VPC** and open the VPC console.
2. Select **Your VPCs**.
3. Select the production VPC.
4. Open **Resource map** and confirm:
   - at least two public subnets in different Availability Zones;
   - at least two private subnets in different Availability Zones;
   - public subnets have a route to an Internet Gateway; and
   - private subnets have NAT or another approved outbound route.
5. Write down the VPC ID and the four subnet IDs.

If these items are missing, stop and ask the AWS/network owner to prepare the
network. Do not put ECS tasks in public subnets as a shortcut.

## 3. Request the HTTPS certificate

1. Search for **Certificate Manager** and open it.
2. Confirm the region is `ap-southeast-1`.
3. Select **Request** → **Request a public certificate**.
4. For **Fully qualified domain name**, enter:
   `api.soc5outboundops.app`.
5. Select **DNS validation**.
6. Select **Request**.
7. Open the new certificate.
8. Expand **Domains** and copy the CNAME **Name** and **Value**.
9. Open Cloudflare → your domain → **DNS** → **Add record**.
10. Add the CNAME exactly as ACM displays it. Set **Proxy status** to
    **DNS only** (gray cloud).
11. Return to ACM and select **Refresh** if necessary.
12. Continue only when the certificate status is **Issued**.

Do not proxy the ACM validation CNAME. Firebase uses a separate certificate
for `app.soc5outboundops.app`.

## 4. Create the ECR image repository

1. Search for **Elastic Container Registry**.
2. Select **Repositories** → **Create repository**.
3. Set **Visibility** to **Private**.
4. Set **Repository name** to `soc5-outbound-api`.
5. Turn on **Scan on push**.
6. If available, turn on **Tag immutability**.
7. Select **Create repository**.
8. Open the repository and copy its **URI**.

The URI looks like:

```text
675911353185.dkr.ecr.ap-southeast-1.amazonaws.com/soc5-outbound-api
```

Push the approved image using GitLab CI. The image tag must be the approved
commit SHA. In ECR, open **Images** and confirm the tag exists before creating
the ECS task definitions.

## 5. Create the security groups

### ALB security group

1. Search for **VPC**.
2. Select **Security groups** → **Create security group**.
3. Set **Security group name** to `soc5-api-alb-sg`.
4. Select the production VPC.
5. Add an inbound rule:
   - **Type:** HTTPS
   - **Port:** 443
   - **Source:** `0.0.0.0/0` only if public access is approved.
6. Leave outbound access as approved by the network owner.
7. Select **Create security group**.

### ECS task security group

1. Select **Create security group** again.
2. Set **Security group name** to `soc5-api-task-sg`.
3. Select the same production VPC.
4. Add an inbound rule:
   - **Type:** Custom TCP
   - **Port:** `8000`
   - **Source:** choose security group
   - choose `soc5-api-alb-sg`
5. Keep outbound access for Supabase, AWS services, and enabled integrations.
6. Select **Create security group**.

Never add public inbound rules for ports 8000, 5432, or 6379.

## 6. Create the ECS IAM roles

These roles let ECS pull the image, write logs, and read the application secret.

### Create the task execution role

1. Search for **IAM**.
2. Select **Roles** → **Create role**.
3. For **Trusted entity type**, choose **AWS service**.
4. For **Use case**, choose **Elastic Container Service** →
   **Elastic Container Service Task**.
5. Select **Next**.
6. Attach `AmazonECSTaskExecutionRolePolicy`.
7. Select **Next**.
8. Set role name to `soc5-outbound-ecs-execution-role`.
9. Select **Create role**.

### Create the task role

1. Select **Create role** again with the same ECS task trusted entity.
2. Name it `soc5-outbound-ecs-task-role`.
3. Create it with no broad administrator policy.
4. After the secret is created in the next step, add a narrowly scoped policy
   allowing `secretsmanager:GetSecretValue` only for that secret.

## 7. Store the Laravel production secret

1. Search for **Secrets Manager**.
2. Select **Store a new secret**.
3. Choose **Other type of secret**.
4. Choose **Key/value pairs**.
5. Add the values required by `backend/.env.example`. At minimum:

   ```text
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=<stable production Laravel key>
   APP_URL=https://api.soc5outboundops.app
   FRONTEND_URL=https://app.soc5outboundops.app
   DB_CONNECTION=pgsql
   DB_HOST=<production Supabase host>
   DB_PORT=6543
   DB_DATABASE=postgres
   DB_USERNAME=<production database user>
   DB_PASSWORD=<production database password>
   DB_SSLMODE=require
   SUPABASE_URL=<production Supabase URL>
   SUPABASE_PUBLISHABLE_KEY=<publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role key>
   SESSION_DRIVER=database
   CACHE_STORE=database
   QUEUE_CONNECTION=database
   LOG_CHANNEL=stderr
   ```

6. Select **Next**.
7. Set **Secret name** to `/soc5/production/laravel`.
8. Select **Next** through rotation settings. Do not enable rotation unless it
   has been designed and tested for this application.
9. Select **Store**.
10. Open the secret and copy its ARN.
11. In IAM, open `soc5-outbound-ecs-task-role`.
12. Add a policy allowing `secretsmanager:GetSecretValue` for this ARN only.

Keep SeaTalk Approval Center and Google Sheets disabled until their staging
tests and provider approvals are complete.

## 8. Create the ECS cluster

1. Search for **Elastic Container Service**.
2. Select **Clusters** → **Create cluster**.
3. Enter `soc5-outbound-production` as the cluster name.
4. Select **AWS Fargate** as the infrastructure.
5. Select **Create**.

## 9. Create the API task definition

1. In ECS, select **Task definitions** → **Create new task definition**.
2. Set **Task definition family** to `soc5-outbound-api`.
3. Choose **AWS Fargate**.
4. Set operating system to **Linux** and architecture to match the image.
5. Choose CPU and memory approved from staging measurements.
6. Select:
   - **Task execution role:**
     `soc5-outbound-ecs-execution-role`
   - **Task role:** `soc5-outbound-ecs-task-role`
7. Under **Container details**, select **Add container**.
8. Enter:
   - **Name:** `api`
   - **Image URI:** ECR URI plus the approved commit-SHA tag
   - **Port mappings:** container port `8000`, protocol TCP
9. Enable **Use log collection** with the `awslogs` driver.
10. Set a log group such as `/ecs/soc5-outbound/production/api`.
11. Add the secret:
    - **Environment variables / Secrets** → **Add secret**
    - choose **Secrets Manager**
    - select `/soc5/production/laravel`
    - map the secret keys required by the container.
12. Add the container health check:
    - **Command:** `CMD-SHELL`
      `curl -f http://localhost:8000/up || exit 1`
    - **Interval:** 30 seconds
    - **Timeout:** 5 seconds
    - **Retries:** 3
    - **Start period:** 45 seconds
13. Select **Create**.

The API container must be named `api` and listen on port 8000. These values are
used later by the load balancer and deployment script.

## 10. Create worker and scheduler task definitions

Repeat the previous step twice. Use the same image, roles, secret, region, and
log settings.

### Worker

- **Family:** `soc5-outbound-worker`
- **Container name:** `worker`
- **Command:**
  `php artisan queue:work database --sleep=3 --tries=3 --backoff=5 --timeout=90`
- **Log group:** `/ecs/soc5-outbound/production/worker`
- Do not add an HTTP health check.

### Scheduler

- **Family:** `soc5-outbound-scheduler`
- **Container name:** `scheduler`
- **Command:** `php artisan schedule:work`
- **Log group:** `/ecs/soc5-outbound/production/scheduler`
- Do not add an HTTP health check.

Run exactly one scheduler task. Set the worker stop timeout/grace period above
90 seconds.

## 11. Create the Application Load Balancer

1. Search for **EC2**.
2. In the left menu, select **Load Balancers** → **Create Load Balancer**.
3. Select **Application Load Balancer**.
4. Set **Load balancer name** to `soc5-outbound-api-alb`.
5. Set **Scheme** to **Internet-facing**.
6. Select the production VPC.
7. Select two public subnets in different Availability Zones.
8. Select `soc5-api-alb-sg`.
9. Under **Listeners and routing**, create an HTTPS listener on port 443.
10. Select the ACM certificate for `api.soc5outboundops.app`.
11. Create a new target group:
    - **Target type:** IP addresses
    - **Protocol:** HTTP
    - **Port:** 8000
    - **Health check path:** `/up`
    - **Success codes:** `200`
12. Select **Create load balancer**.
13. Copy the ALB **DNS name**. Cloudflare will use it in the next step.

## 12. Create the API ECS service

1. In ECS, open `soc5-outbound-production`.
2. Select **Services** → **Create**.
3. Select **Launch type**: Fargate.
4. Select the latest `soc5-outbound-api` task definition revision.
5. Set **Service name** to `soc5-outbound-api`.
6. Set desired tasks to **1** for the first staging deployment. Use **2** in
   production when the budget and staging results support it.
7. Under **Networking**, select:
   - the production VPC;
   - two private subnets;
   - `soc5-api-task-sg`; and
   - **Public IP:** Off.
8. Under **Load balancing**, choose **Application Load Balancer**.
9. Select the ALB and target group created above.
10. Choose container `api` and port `8000`.
11. Select **Create**.
12. Open the service's **Tasks** tab and wait for the task to be **Running**.
13. Open the target group in EC2 and wait for the target to be **Healthy**.

If the task stops, open **ECS → Cluster → Tasks → Stopped** and read the
**Stopped reason** and **Container logs**. Common causes are a missing image
tag, missing secret permission, or missing private-subnet egress.

## 13. Create worker and scheduler services

Repeat **ECS → Clusters → cluster → Services → Create**:

### Worker service

- **Task definition:** latest `soc5-outbound-worker`
- **Service name:** `soc5-outbound-worker`
- **Desired tasks:** 1
- **VPC/subnets/security group:** the same private settings as the API
- **Load balancer:** none

### Scheduler service

- **Task definition:** latest `soc5-outbound-scheduler`
- **Service name:** `soc5-outbound-scheduler`
- **Desired tasks:** 1
- **VPC/subnets/security group:** the same private settings as the API
- **Load balancer:** none

## 14. Add the API DNS record

1. Open Cloudflare → `soc5outboundops.app` → **DNS**.
2. Select **Add record**.
3. Set **Type** to CNAME.
4. Set **Name** to `api`.
5. Set **Target** to the ALB DNS name.
6. Set **Proxy status** to **DNS only** initially.
7. Select **Save**.
8. Open `https://api.soc5outboundops.app/up` in a browser.
9. Continue only when it returns a successful response.

After validation, Cloudflare proxying is optional. If enabled, use **Full
(strict)** TLS and allow only Cloudflare's published IP ranges at the ALB.

## 15. Deploy the frontend separately

Firebase Hosting is not configured in the AWS Console. In Firebase, add
`app.soc5outboundops.app` as a custom domain and use:

```dotenv
VITE_API_URL=https://api.soc5outboundops.app/api/v1
VITE_SUPABASE_URL=https://<production-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<production-publishable-key>
```

Only browser-safe values belong in Firebase variables. The frontend must have
the reviewed separate-API-origin, credentialed-request, CORS, and secure-cookie
changes described in [AWS + Firebase production setup](aws-firebase-production-setup.md).

## 16. Check logs and finish the release

1. In ECS, verify all three services are stable.
2. In **CloudWatch → Logs → Log groups**, open the API, worker, and scheduler
   groups and confirm logs are arriving.
3. Verify login, role permissions, request creation, approval, realtime updates,
   and queue processing.
4. Run the production configuration check as a protected one-off task:

   ```sh
   php artisan system:verify-config --production
   ```

5. Record:
   - image tag and digest;
   - ECS task-definition revisions;
   - frontend commit;
   - migration record; and
   - previous known-good release.

The protected GitLab pipeline can publish the image and update all three ECS
services after AWS OIDC, IAM, protected variables, and service names are
configured. Do not give AWS deployment credentials to Travis.

## Stop and ask for help if

- the ECR image tag is missing;
- a task cannot pull the image or read the secret;
- the target is unhealthy;
- private subnets cannot reach Supabase or AWS services;
- production migrations or backups are uncertain; or
- authentication, CORS, cookies, or queue processing fail.

Never open port 8000 publicly or deploy a staging image to production.
