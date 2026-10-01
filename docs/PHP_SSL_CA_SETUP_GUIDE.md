# PHP SSL Certificate Setup Guide (Windows)

Use this guide when setting up the Laravel backend on a new Windows laptop and PHP/Guzzle shows errors such as:

```text
cURL error 60: SSL certificate OpenSSL verify result: unable to get local issuer certificate
```

## 1. Confirm the active PHP configuration file

Run:

```powershell
Set-Location (Resolve-Path .)
.\scripts\setup-local.ps1
php --ini
```

Confirm that `Loaded Configuration File` points to `tools/php.local.ini`.

The script discovers the active PHP installation and writes its extension and
CA settings to this ignored, machine-local file.

## 2. Download the CA certificate bundle

Run:

```powershell
Invoke-WebRequest `
  -Uri "https://curl.se/ca/cacert.pem" `
  -OutFile (Join-Path (Resolve-Path .\tools).Path 'cacert.pem')
```

Verify it exists:

```powershell
Test-Path .\tools\cacert.pem
```

Expected result:

```text
True
```

## 3. Configure PHP

Run `scripts/setup-local.ps1` again after placing the bundle in
`tools/cacert.pem`. It updates the ignored local PHP configuration without
changing the shared template.

## 4. Restart PHP processes

Close and restart any running:

```text
php artisan serve
php artisan queue:work
php artisan schedule:work
php artisan tinker
```

## 5. Verify PHP sees the CA bundle

Run:

```powershell
# Run from the repository root.
php -i | Select-String "curl.cainfo|openssl.cafile"
```

Both settings should point to the current laptop's `tools/cacert.pem` path.

## 6. Retest Laravel / Google Sheets

Start the queue worker:

```powershell
# Run from the repository root.
php artisan queue:work redis --sleep=3 --tries=3 --backoff=5 --timeout=90
```

Then dispatch the Google Sheets sync job from Tinker:

```powershell
# Run from the repository root.
php artisan tinker
```

Inside Tinker:

```php
\App\Jobs\SyncRequestsToGoogleSheetJob::dispatch();
```

The worker should process the job without `cURL error 60`.

## Important

Do **not** commit `cacert.pem` to Git.

The certificate bundle is a machine-level dependency. Each developer laptop should download its own copy during local setup.

Do not disable SSL verification as a workaround.
