x`# Laravel Octane Production Setup

This guide describes a production deployment for SOC5 Outbound using Laravel
Octane, FrankenPHP, Nginx, Redis, Supabase Supavisor, and a separately hosted
Vite frontend.

Octane is intended for Linux production servers. Keep `php artisan serve` for
local development only.

## Target architecture

```text
Browser
  |
Cloudflare
  |
Nginx :443
  |
Laravel Octane / FrankenPHP :8000
  |             |
 Redis       Supavisor :6543
                |
        Supabase PostgreSQL
```

For the first deployment, one API host with multiple Octane workers is enough.
Add a second API host behind Nginx or a cloud load balancer when load testing
shows that one host is saturated.

References:

- [Laravel Octane](https://laravel.com/docs/12.x/octane)
- [Nginx HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Supabase connection pooling](https://supabase.com/docs/guides/database/connection-management)

## 1. Server requirements

Recommended starting point:

- Ubuntu 24.04 LTS or another supported Linux distribution
- 2 vCPU
- 4 GB RAM
- PHP 8.3 with CLI, FPM-compatible extensions, PostgreSQL, cURL, mbstring,
  OpenSSL, ZIP, and sodium support
- Composer 2
- Node.js 22 for frontend builds only
- Redis 7 or a managed Redis service
- Nginx
- TLS certificate, normally managed by Cloudflare or Certbot

Do not place database passwords, Supabase service-role keys, or Sentry tokens in
the repository or frontend environment.

## 2. Install Octane

From the backend directory:

```bash
composer require laravel/octane
php artisan octane:install
```

Choose FrankenPHP when prompted, or install it using the official FrankenPHP
installation instructions. Confirm that the server can start:

```bash
php artisan octane:start \
  --server=frankenphp \
  --host=127.0.0.1 \
  --port=8000 \
  --workers=2 \
  --max-requests=500
```

The worker count should normally start near the number of available CPU cores.
Increase it only after measuring memory usage and request latency.

## 3. Production environment

Create `backend/.env` on the server and set values similar to:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://app.example.com

LOG_CHANNEL=stack
LOG_STACK=stderr
LOG_LEVEL=info

DB_CONNECTION=pgsql
DB_HOST=your-project.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=your-pooler-username
DB_PASSWORD=your-database-password
DB_SSLMODE=require

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_CLIENT=predis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_CONNECT_TIMEOUT=5
SUPABASE_TIMEOUT=10
SUPABASE_TOKEN_CACHE_TTL=30
```

Use the Supabase pooled connection endpoint on port `6543`. Do not use a
frontend `VITE_` variable for the service-role key.

## 4. Build and optimize Laravel

Run these commands during deployment, not manually on every request:

```bash
cd /var/www/soc5-outbound/backend
composer install --no-dev --classmap-authoritative --no-interaction
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Run the frontend build separately and publish `frontend/dist` through a static
host or Nginx:

```bash
cd /var/www/soc5-outbound/frontend
npm ci
npm run build
```

## 5. Nginx reverse proxy

Example `/etc/nginx/sites-available/soc5-api`:

```nginx
upstream soc5_octane {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 10m;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_pass http://soc5_octane;
    }
}
```

Enable and validate it:

```bash
sudo ln -s /etc/nginx/sites-available/soc5-api /etc/nginx/sites-enabled/soc5-api
sudo nginx -t
sudo systemctl reload nginx
```

If the frontend is hosted by the same Nginx instance, serve its `dist` folder
from a separate `app.example.com` server block and keep API traffic on
`api.example.com`.

## 6. Run Octane with systemd

Create `/etc/systemd/system/soc5-octane.service`:

```ini
[Unit]
Description=SOC5 Outbound Laravel Octane
After=network-online.target redis-server.service
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/soc5-outbound/backend
ExecStart=/usr/bin/php artisan octane:start --server=frankenphp --host=127.0.0.1 --port=8000 --workers=2 --max-requests=500
Restart=always
RestartSec=5
TimeoutStopSec=30
Environment=APP_ENV=production

[Install]
WantedBy=multi-user.target
```

Start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now soc5-octane
sudo systemctl status soc5-octane
```

After every deployment, restart workers so they load the new code and config:

```bash
sudo systemctl restart soc5-octane
```

## 7. Queue worker

If `QUEUE_CONNECTION=redis`, run a separate queue worker. Create
`/etc/systemd/system/soc5-queue.service`:

```ini
[Unit]
Description=SOC5 Outbound Laravel Queue Worker
After=redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/soc5-outbound/backend
ExecStart=/usr/bin/php artisan queue:work redis --sleep=1 --tries=3 --timeout=120 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable it with:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now soc5-queue
```

## 8. Health checks and smoke tests

The API health endpoint is `/up`:

```bash
curl -fsS https://api.example.com/up
```

Check the service and recent logs:

```bash
systemctl is-active soc5-octane
systemctl is-active soc5-queue
journalctl -u soc5-octane -n 100 --no-pager
```

Before opening traffic to users, verify:

- `/up` returns HTTP 200
- authenticated `/api/auth/me` works
- request list and dashboard analytics respond
- queue jobs are being consumed
- Redis connectivity works
- PostgreSQL connections use Supavisor port `6543`
- Nginx forwards the original host and HTTPS scheme

## 9. Deployment and rollback

Recommended order:

```bash
git fetch origin
git checkout <release-sha>
composer install --no-dev --classmap-authoritative --no-interaction
php artisan migrate --force
php artisan optimize
npm ci --prefix ../frontend
npm run build --prefix ../frontend
sudo systemctl restart soc5-octane soc5-queue
sudo nginx -t && sudo systemctl reload nginx
curl -fsS https://api.example.com/up
```

For rollback, restore the previous release directory, restart Octane and the
queue worker, and only revert database migrations when the migration is known
to be safely reversible.

## 10. Performance tuning for this project

The dashboard currently requests several datasets independently. After Octane
is stable, prioritize these improvements:

1. Add a single dashboard summary endpoint for metrics, analytics, intraday
   data, and the initial request list.
2. Cache short-lived dashboard aggregates in Redis for 5–15 seconds.
3. Reduce dashboard polling from 15 seconds to 30–60 seconds where real-time
   updates are not required.
4. Keep request reporting indexes applied through Supabase migrations.
5. Measure database connection time separately from SQL execution time.

Octane reduces PHP boot and worker queuing overhead. It does not replace
Supavisor, query indexing, caching, or dashboard request consolidation.

## 11. Operational warnings

Octane workers are long-lived. Do not keep request-specific values in static
properties, global variables, or singleton state. Restart workers after code,
configuration, or dependency changes. Monitor memory usage and use
`--max-requests` to periodically recycle workers.
