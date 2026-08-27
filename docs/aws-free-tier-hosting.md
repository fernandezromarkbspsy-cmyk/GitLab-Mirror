# AWS Free Tier Hosting Guide — SOC 5 Outbound

This guide deploys SOC 5 Outbound to one Amazon EC2 instance, with Cloudflare
managing DNS and edge traffic and Supabase providing PostgreSQL and Auth. It is
written for the AWS Console UI available in June 2026.

This architecture is intended for a low-traffic internal MVP. It is not highly
available: deployments, instance failures, and maintenance can cause downtime.

## Architecture

```text
Browser
  |
  | HTTPS
  v
Cloudflare DNS and proxy
  |
  | HTTPS, Full (strict)
  v
EC2 Ubuntu host NGINX
  |
  | http://127.0.0.1:8080
  v
Docker Compose
  +-- React static files on NGINX
  +-- Laravel API
          |
          +-- Supabase Auth API
          +-- Supabase PostgreSQL pooler
```

The production URL is `https://soc5outboundops.app`.

## 1. Understand the current AWS Free Tier

AWS changed its Free Tier on July 15, 2025:

- Accounts created before that date use the legacy 12-month Free Tier and must
  remain within each service's allowance.
- New accounts created on or after that date receive credits and a Free or Paid
  account plan. The Free plan ends after six months or when credits are used.

Free Tier does not mean permanently free. Running resources can become billable
when credits, eligibility, or time limits expire. Public IPv4 addresses, EBS
storage, snapshots, data transfer, and excess CloudWatch usage can incur costs.

Before creating resources:

1. Open the AWS Console.
2. Search for **Billing and Cost Management**.
3. Open **Free Tier** and record the expiration date and credit balance.
4. Open **Billing preferences > Alert preferences > Edit**.
5. Enable **Receive AWS Free Tier alerts** and **Receive CloudWatch billing
   alerts**, if available for the account.
6. Open **Budgets > Create budget**.
7. Choose **Use a template (simplified)**.
8. Select **Zero spend budget** and enter the billing-alert email.
9. Create a second **Monthly cost budget** with a small limit you accept, such as
   USD 5, and notifications at 50%, 80%, and 100%.

AWS budgets notify you; they do not automatically stop the instance.

## 2. Secure the AWS account

1. Sign in as the root user only for initial account security.
2. Open the account menu > **Security credentials**.
3. Enable MFA for the root user.
4. Search for **IAM**.
5. Create an administrative user for daily work and enable MFA for it.
6. Do not create long-lived access keys unless a deployment process actually
   needs them.
7. Store recovery codes, the EC2 private key, and credentials in an approved
   password manager.

## 3. Confirm external services first

Before AWS deployment, complete:

- Supabase migrations 001, 002, and 003.
- `users-seed.sql` and `clusters-seed.sql`.
- Supabase Email provider, OTP template, Site URL, SMTP, and rate limits.
- Cloudflare nameserver delegation from Name.com.

Follow [Supabase Auth Setup](supabase-auth-setup.md).

Use the Supabase transaction pooler for this deployment:

```text
Host: aws-0-ap-southeast-1.pooler.supabase.com
Port: 6543
Database: postgres
Username: value shown by Supabase Connect
```

Copy the exact values from **Supabase Dashboard > Connect**. Do not infer the
project-specific username.

## 4. Select the AWS Region

In the AWS Console region selector, choose **Asia Pacific (Singapore)**,
`ap-southeast-1`. Keeping EC2 near the Supabase Singapore endpoint reduces
database latency.

All EC2 resources in this guide must be created in the same region.

## 5. Create an EC2 key pair

1. Search for **EC2** and open it.
2. In the left navigation, open **Network & Security > Key Pairs**.
3. Choose **Create key pair**.
4. Name: `soc5-outbound-prod`.
5. Key pair type: **ED25519** if offered for the selected Linux AMI; otherwise
   use RSA.
6. Private key format:
   - `.pem` for OpenSSH, PowerShell `ssh`, or WSL
   - `.ppk` only when using PuTTY
7. Choose **Create key pair** and save the downloaded private key securely.

AWS does not retain a recoverable copy of the private key.

On Windows, restrict access to the PEM file before connecting:

```powershell
icacls .\soc5-outbound-prod.pem /inheritance:r
icacls .\soc5-outbound-prod.pem /grant:r "$($env:USERNAME):(R)"
```

## 6. Create the EC2 security group

1. In EC2, open **Network & Security > Security Groups**.
2. Choose **Create security group**.
3. Name: `soc5-outbound-web`.
4. Description: `SOC 5 Outbound HTTPS and restricted SSH`.
5. Select the default VPC.
6. Add inbound rules:

| Type | Port | Source | Purpose |
|---|---:|---|---|
| SSH | 22 | **My IP** | Administration only |
| HTTP | 80 | `0.0.0.0/0` | Redirect and certificate support |
| HTTPS | 443 | `0.0.0.0/0` | Cloudflare-to-origin traffic |

Do not allow SSH from `0.0.0.0/0`. Update the SSH source when the administrator's
public IP changes.

The simple rules above allow direct origin access. After deployment is stable,
restrict ports 80 and 443 to Cloudflare's published IPv4 and IPv6 ranges. Keep
those ranges updated when Cloudflare changes them.

Leave outbound traffic allowed so the server can reach package repositories,
Supabase, and SMTP-related endpoints.

## 7. Launch the EC2 instance using the current console

1. Open **EC2 > Instances > Launch instances**.
2. **Name and tags**: `soc5-outbound-prod`.
3. **Application and OS Images**:
   - Choose **Ubuntu**.
   - Choose an Ubuntu Server 24.04 LTS image marked **Free tier eligible**.
   - Architecture: **64-bit (x86)**.
4. **Instance type**:
   - Choose `t3.micro` only when the console marks it Free Tier eligible for the
     account.
   - Do not select a larger type merely because another account's guide calls it
     free. Eligibility depends on account creation date and plan.
5. **Key pair**: choose `soc5-outbound-prod`.
6. **Network settings > Edit**:
   - VPC: default VPC
   - Subnet: a public subnet
   - Auto-assign public IP: **Enable**
   - Firewall: **Select existing security group**
   - Select `soc5-outbound-web`
7. **Configure storage**:
   - Root volume: 20 GiB
   - Type: `gp3`
   - Encrypted: enabled
   - Delete on termination: enabled
8. Expand **Advanced details** only to review defaults. Do not add secrets to
   user data because user data can be read from instance metadata and the AWS
   Console.
9. Review the estimated costs and Free Tier label.
10. Choose **Launch instance**.

Wait until instance state is **Running** and both status checks pass.

### Optional: allocate a stable Elastic IP

An auto-assigned public IP can change after stop/start. A stable address prevents
Cloudflare DNS from breaking.

1. Open **EC2 > Network & Security > Elastic IP addresses**.
2. Choose **Allocate Elastic IP address**.
3. Keep the Amazon IPv4 pool and choose **Allocate**.
4. Select it, then **Actions > Associate Elastic IP address**.
5. Resource type: **Instance**.
6. Select `soc5-outbound-prod` and its private IP.
7. Choose **Associate**.

AWS charges for public IPv4 usage under current pricing. An Elastic IP is not a
guarantee of zero cost; monitor Billing and release it when the instance is
deleted.

## 8. Connect to Ubuntu

From PowerShell in the folder containing the key:

```powershell
ssh -i .\soc5-outbound-prod.pem ubuntu@18.140.215.224
```

On the first connection, verify the fingerprint shown in the EC2 connection
instructions before accepting it.

## 9. Patch the server and install Docker

Run on EC2:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
```

Sign out and reconnect so the Docker group membership applies:

```bash
exit
```

After reconnecting:

```bash
docker version
docker compose version
```

## 10. Transfer the repository

Preferred method for a private repository:

1. Create a read-only deploy key for the repository.
2. Store the private deploy key only under the EC2 user's `~/.ssh` directory.
3. Add the public key to the repository host.
4. Clone into `/opt/soc5-outbound`.

Example after repository access is configured:

```bash
sudo mkdir -p /opt/soc5-outbound
sudo chown ubuntu:ubuntu /opt/soc5-outbound
git clone YOUR_REPOSITORY_URL /opt/soc5-outbound
cd /opt/soc5-outbound
```

For a public repository, clone its HTTPS URL. Do not copy `.env` files into Git.

## 11. Create production environment files

Generate a Laravel application key without storing it in shell history where
possible. A valid value starts with `base64:`. If PHP and Composer are available
locally, `php artisan key:generate --show` can generate it. Alternatively, build
the API image and run:

```bash
cd /opt/soc5-outbound
docker compose build api
docker compose run --rm api php artisan key:generate --show
```

Create `backend/.env` with permissions restricted to the owner:

```bash
install -m 600 /dev/null backend/.env
nano backend/.env
```

Use:

```dotenv
APP_NAME="SOC 5 Outbound API"
APP_ENV=production
APP_KEY=base64:REPLACE_WITH_GENERATED_KEY
APP_DEBUG=false
APP_URL=https://soc5outboundops.app
FRONTEND_URL=https://soc5outboundops.app

LOG_CHANNEL=stderr
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=REPLACE_WITH_EXACT_SUPABASE_POOLER_USERNAME
DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=REPLACE_WITH_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_SECRET_OR_SERVICE_ROLE_KEY

CACHE_STORE=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

`CACHE_STORE=file` and `QUEUE_CONNECTION=sync` avoid requiring Laravel cache and
jobs tables on this single-server MVP.

The frontend image receives public Supabase configuration at build time. Create
a root `.env` used by Docker Compose:

```bash
install -m 600 /dev/null .env
nano .env
```

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=REPLACE_WITH_PUBLISHABLE_KEY
```

The publishable key is intentionally included in browser code. The secret key
must never appear in this root file because the frontend build consumes it.

## 12. Build and start the application

From `/opt/soc5-outbound`:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

`docker compose config` renders environment values. Do not paste its output into
tickets or chat because it can contain secrets.

Test from EC2:

```bash
curl -I http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/up
```

Expected:

- The first request returns HTTP 200.
- `/up` returns a successful Laravel health response.
- Both containers show healthy/running status.

The current Compose API command uses Laravel's built-in server. It is acceptable
only as a constrained, low-traffic MVP starting point. Before broader production
use, replace it with a production PHP runtime such as PHP-FPM behind NGINX or
FrankenPHP and perform load testing.

## 13. Create a Cloudflare Origin CA certificate

Because `.app` is HTTPS-only in modern browsers, configure TLS before publishing
DNS.

1. Open the Cloudflare dashboard.
2. Select `soc5outboundops.app`.
3. Open **SSL/TLS > Origin Server**.
4. Choose **Create Certificate**.
5. Keep **Generate private key and CSR with Cloudflare**.
6. Private key type: RSA unless organizational policy requires ECC.
7. Hostnames:
   - `soc5outboundops.app`
   - `*.soc5outboundops.app`
8. Choose an expiration period accepted by your security policy.
9. Choose **Create**.
10. Copy the certificate and private key immediately. Cloudflare does not show
    the private key again.

On EC2:

```bash
sudo install -d -m 700 /etc/nginx/cloudflare-origin
sudo nano /etc/nginx/cloudflare-origin/soc5outboundops.app.pem
sudo nano /etc/nginx/cloudflare-origin/soc5outboundops.app.key
sudo chmod 600 /etc/nginx/cloudflare-origin/soc5outboundops.app.key
sudo chmod 644 /etc/nginx/cloudflare-origin/soc5outboundops.app.pem
```

Paste the certificate into the `.pem` file and the private key into the `.key`
file. Never commit either file.

## 14. Configure host NGINX

Create `/etc/nginx/sites-available/soc5outboundops.app`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name soc5outboundops.app www.soc5outboundops.app;
    return 301 https://soc5outboundops.app$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.soc5outboundops.app;

    ssl_certificate /etc/nginx/cloudflare-origin/soc5outboundops.app.pem;
    ssl_certificate_key /etc/nginx/cloudflare-origin/soc5outboundops.app.key;
    return 301 https://soc5outboundops.app$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name soc5outboundops.app;

    ssl_certificate /etc/nginx/cloudflare-origin/soc5outboundops.app.pem;
    ssl_certificate_key /etc/nginx/cloudflare-origin/soc5outboundops.app.key;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
    }
}
```

Enable and validate it:

```bash
sudo ln -s /etc/nginx/sites-available/soc5outboundops.app /etc/nginx/sites-enabled/soc5outboundops.app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Test the origin before changing DNS:

```bash
curl -k --resolve soc5outboundops.app:443:127.0.0.1 https://soc5outboundops.app/up
```

`-k` is used only for this loopback origin test because Cloudflare Origin CA
certificates are trusted by Cloudflare, not by the operating system's public CA
bundle. Do not use `-k` for normal public endpoint monitoring.

## 15. Configure Cloudflare DNS

In Cloudflare, open **DNS > Records** and add:

| Type | Name | Target | Proxy status | TTL |
|---|---|---|---|---|
| A | `@` | EC2 Elastic/public IPv4 | Proxied | Auto |
| CNAME | `www` | `soc5outboundops.app` | Proxied | Auto |

Do not create a DNS record for `api` with this same-origin deployment. The React
frontend calls `/api`, which host NGINX forwards through the web container.

In Cloudflare:

1. Open **SSL/TLS > Overview**.
2. Set encryption mode to **Full (strict)**.
3. Open **SSL/TLS > Edge Certificates**.
4. Enable **Always Use HTTPS**.
5. Keep **Automatic HTTPS Rewrites** enabled unless testing finds an issue.

Never use Flexible mode. Full (strict) encrypts and validates both browser-edge
and edge-origin connections.

## 16. Update Supabase production URLs

In Supabase:

1. Open **Authentication > URL Configuration**.
2. Site URL: `https://soc5outboundops.app`.
3. Redirect URLs:
   - `https://soc5outboundops.app/**`
   - `http://localhost:5173/**` only while local development is required
4. Save.

Keep `VITE_SUPABASE_URL` on the normal Supabase project URL. A paid Supabase
custom domain is not required.

## 17. End-to-end validation

Run these checks:

1. Open `https://soc5outboundops.app` in a private browser window.
2. Confirm the certificate is valid and HTTPS is used.
3. Confirm `http://soc5outboundops.app` redirects to HTTPS.
4. Select FTE and request an OTP for an active staged user.
5. Confirm the email contains the configured numeric OTP, not a magic link.
6. Enter the code and confirm the dashboard loads.
7. Confirm `/api/auth/me` succeeds in browser developer tools.
8. Confirm an unstaged SPX email cannot create an application account.
9. Create and test one Backroom account through the FTE-only user API or UI when
   the user-management page is available.
10. Confirm first Backroom login forces a password change.
11. Confirm a disabled profile is denied access.

Server checks:

```bash
cd /opt/soc5-outbound
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=200 web
sudo journalctl -u nginx --since "30 minutes ago"
curl -I https://soc5outboundops.app
curl -i https://soc5outboundops.app/up
```

## 18. Deploy updates

### Automatic deployment from GitHub

The repository includes `.github/workflows/deploy-production.yml` and
`deploy/deploy-production.sh`. A push to `main` can deploy automatically through
GitHub OIDC and AWS Systems Manager Run Command. This design does not store the
EC2 PEM or long-lived AWS access keys in GitHub and does not require opening SSH
to GitHub-hosted runners.

#### Enable Systems Manager on EC2

In AWS IAM:

1. Open **IAM > Roles > Create role**.
2. Trusted entity: **AWS service**; use case: **EC2**.
3. Attach `AmazonSSMManagedInstanceCore`.
4. Name the role `soc5-outbound-ec2-ssm` and create it.
5. Open **EC2 > Instances**, select `soc5-outbound-prod`, then choose
   **Actions > Security > Modify IAM role**.
6. Select `soc5-outbound-ec2-ssm` and save.

On EC2, verify the agent. Ubuntu images can expose it as either a Snap service or
a conventional systemd service:

```bash
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service --no-pager \
  || sudo systemctl status amazon-ssm-agent --no-pager
```

In **AWS Systems Manager > Fleet Manager > Managed nodes**, wait until the EC2
instance appears as online.

#### Add GitHub as an AWS OIDC provider

In AWS IAM:

1. Open **IAM > Identity providers > Add provider**.
2. Provider type: **OpenID Connect**.
3. Provider URL: `https://token.actions.githubusercontent.com`.
4. Audience: `sts.amazonaws.com`.
5. Add the provider.

Skip creation only when that exact provider already exists in the account.

#### Create the GitHub deployment role

Create an IAM policy named `soc5-outbound-github-deploy`. Replace
`ACCOUNT_ID` and `INSTANCE_ID` with the real values:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:ap-southeast-1:ACCOUNT_ID:instance/INSTANCE_ID",
        "arn:aws:ssm:ap-southeast-1::document/AWS-RunShellScript"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": "*"
    }
  ]
}
```

Then create role `soc5-outbound-github-deploy` with **Web identity** as the
trusted entity, the GitHub OIDC provider, audience `sts.amazonaws.com`, and the
policy above. Its trust policy must restrict access to this repository and main
branch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:fernandezromarkbspsy-cmyk/soc5-outboundops-project:environment:production"
        }
      }
    }
  ]
}
```

Because the workflow uses the GitHub `production` environment, GitHub places the
environment name—not the branch name—in the OIDC subject. Do not use a wildcard
repository or environment in this trust policy. The environment's deployment
branch rule below independently restricts deployment to `main`.

#### Configure the GitHub production environment

In GitHub, open **Repository > Settings > Environments**:

1. Create environment `production`.
2. Restrict deployment branches to `main`.
3. Add an approval reviewer if the repository plan supports it and every
   production deployment should require manual approval.
4. Add environment secrets:
   - `AWS_DEPLOY_ROLE_ARN`: ARN of `soc5-outbound-github-deploy`
   - `AWS_EC2_INSTANCE_ID`: instance ID such as `i-0123456789abcdef0`

Neither value is a private key, but environment secrets keep deployment
configuration scoped to production. Do not add the EC2 PEM or AWS access keys.

#### Prepare the EC2 deployment script

After pushing these automation files once, update the EC2 checkout manually:

```bash
cd /opt/soc5-outbound
git fetch --prune origin main
git reset --hard origin/main
git status
```

`git status` must be clean. The deployment intentionally refuses to overwrite
tracked files edited directly on EC2, then resets the checkout to the commit
selected by GitHub Actions. Move all permanent server hotfixes into the
repository, commit them locally, and push them before enabling automation.

Test Systems Manager from **Systems Manager > Run Command** using the
`AWS-RunShellScript` document and this command:

```bash
sudo -u ubuntu bash /opt/soc5-outbound/deploy/deploy-production.sh
```

After that succeeds, open **GitHub > Actions > Deploy production > Run
workflow** for the first automated test. Subsequent pushes to `main` trigger the
same workflow automatically. The workflow serializes deployments, waits for SSM
completion, prints deployment output, and fails when the API does not become
healthy.

#### Normal automated release

1. Make changes locally on a feature branch.
2. Run backend tests and the frontend production build.
3. Open and review a pull request.
4. Merge the pull request into `main`.
5. GitHub Actions assumes the restricted AWS role with a short-lived OIDC token.
6. Systems Manager runs the deployment script as `ubuntu` on EC2.
7. The script resets Git to the selected commit, validates Compose, builds images, starts the
   containers, and verifies `/up`.

Keep the manual procedure below as the recovery path when GitHub Actions or
Systems Manager is unavailable.

Before each deployment, take note of the current commit so rollback is possible.

```bash
cd /opt/soc5-outbound
git status
git fetch --prune origin main
git reset --hard origin/main
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

The frontend's Supabase URL and publishable key are build-time values. Rebuild
the web image after changing them.

Rollback example:

```bash
cd /opt/soc5-outbound
git log --oneline -10
git switch --detach KNOWN_GOOD_COMMIT
docker compose build
docker compose up -d
```

Return to the deployment branch after diagnosing the failed release.

## 19. Reboot behavior

Docker is enabled at boot and Compose services use `restart: unless-stopped`.
Verify after an EC2 reboot:

```bash
sudo reboot
```

Reconnect after several minutes, then run:

```bash
docker compose -f /opt/soc5-outbound/docker-compose.yml ps
systemctl status nginx --no-pager
curl -I https://soc5outboundops.app
```

## 20. Routine operations

Weekly:

```bash
sudo apt update
apt list --upgradable
docker system df
df -h
```

Apply security updates during a maintenance window:

```bash
sudo apt upgrade -y
sudo reboot
```

Review:

- AWS Billing and Free Tier usage
- EC2 CPU, network, and status checks
- Disk usage
- Supabase database usage and Auth logs
- Cloudflare security events
- SMTP bounces and complaints

Do not run `docker system prune -a` blindly; it can remove rollback images and
build cache. Remove only resources confirmed to be unused.

## 21. Backup and recovery

Application code should remain in the Git repository. Environment files and
private keys must be backed up in an approved secrets manager, not Git.

The system of record is Supabase, so review the backup and point-in-time recovery
features of the selected Supabase plan. AWS EBS snapshots can preserve server
configuration but consume billable storage. A replacement EC2 instance should
be recoverable from:

1. Repository code
2. Documented environment variables
3. Cloudflare Origin certificate or a newly issued one
4. Supabase database and Auth data
5. This deployment guide

Test recovery instead of assuming a snapshot is usable.

## 22. Free-tier cost controls

Avoid these components for the initial deployment:

- Application Load Balancer
- NAT Gateway
- ECS/Fargate always-on services
- RDS
- Route 53 hosted zone
- CloudFront
- Paid Elastic IP assumptions
- Large or frequent EBS snapshots
- Paid Supabase custom domain

Use one eligible EC2 instance and one small encrypted `gp3` root volume. Stop or
terminate unused test instances. Release unused Elastic IPs and delete unused
volumes and snapshots. Check Billing after every infrastructure change.

## 23. Known limitations before wider production use

- One instance is a single point of failure.
- Deployments are not zero-downtime.
- The current Laravel API process uses the framework's built-in server.
- Secrets reside in restricted files on one host rather than AWS Secrets Manager.
- There is no automated CI/CD or infrastructure-as-code deployment.
- There is no application-specific metrics or alerting stack.
- Backroom user management UI is incomplete even though provisioning API support
  exists.

These limitations are acceptable only when the business explicitly accepts the
MVP risk. Resolve them before treating the system as a high-availability or
business-critical production service.

## Official references

- [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html)
- [Track AWS Free Tier usage](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html)
- [EC2 launch instance wizard](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-instance-wizard.html)
- [EC2 key pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [EC2 security groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/changing-security-group.html)
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Cloudflare Full (strict) TLS](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
