# PHP SSL Certificate Setup Guide (Windows + Scoop)

Use this guide when setting up the Laravel backend on a new Windows laptop and PHP/Guzzle shows errors such as:

```text
cURL error 60: SSL certificate OpenSSL verify result: unable to get local issuer certificate
```

## 1. Confirm the active PHP configuration file

Run:

```powershell
# C:\Users\<your-user>\OneDrive\development\backend
php --ini
```

Confirm that `Loaded Configuration File` points to your active `php.ini`, for example:

```text
C:\Users\<your-user>\scoop\apps\php\current\php.ini
```

## 2. Download the CA certificate bundle

Run:

```powershell
# C:\Users\<your-user>\OneDrive\development\backend
Invoke-WebRequest `
  -Uri "https://curl.se/ca/cacert.pem" `
  -OutFile "$HOME\scoop\persist\php\cacert.pem"
```

Verify it exists:

```powershell
# C:\Users\<your-user>\OneDrive\development\backend
Test-Path "$HOME\scoop\persist\php\cacert.pem"
```

Expected result:

```text
True
```

## 3. Configure PHP

Open the active `php.ini`.

Example:

```text
C:\Users\<your-user>\scoop\apps\php\current\php.ini
```

Add or update:

```ini
curl.cainfo="C:\Users\<your-user>\scoop\persist\php\cacert.pem"
openssl.cafile="C:\Users\<your-user>\scoop\persist\php\cacert.pem"
```

Replace `<your-user>` with the Windows username on that laptop.

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
# C:\Users\<your-user>\OneDrive\development\backend
php -i | Select-String "curl.cainfo|openssl.cafile"
```

Both settings should point to:

```text
C:\Users\<your-user>\scoop\persist\php\cacert.pem
```

## 6. Retest Laravel / Google Sheets

Start the queue worker:

```powershell
# C:\Users\<your-user>\OneDrive\development\backend
php artisan queue:work redis --sleep=3 --tries=3 --backoff=5 --timeout=90
```

Then dispatch the Google Sheets sync job from Tinker:

```powershell
# C:\Users\<your-user>\OneDrive\development\backend
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
