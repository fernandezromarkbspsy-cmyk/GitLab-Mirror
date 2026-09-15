<?php
$passthrough = ['APP_ENV','HERD_PHP_81_INI_SCAN_DIR','HERD_PHP_82_INI_SCAN_DIR','HERD_PHP_83_INI_SCAN_DIR','HERD_PHP_84_INI_SCAN_DIR','HERD_PHP_85_INI_SCAN_DIR','IGNITION_LOCAL_SITES_PATH','LARAVEL_SAIL','PATH','PHP_IDE_CONFIG','SYSTEMROOT','XDEBUG_CONFIG','XDEBUG_MODE','XDEBUG_SESSION'];
$env = [];
foreach ($_ENV as $k => $v) {
    $env[$k] = in_array($k, $passthrough) ? $v : false;
}
$env['PHP_CLI_SERVER_WORKERS'] = 1;

$cmd = [PHP_BINARY, '-S', '127.0.0.1:8000', __DIR__ . '/public/server.php'];
$descriptors = [1 => ['pipe','w'], 2 => ['pipe','w']];
$proc = proc_open($cmd, $descriptors, $pipes, __DIR__ . '/public', $env);
sleep(2);
echo "STDOUT: " . stream_get_contents($pipes[1]) . "\n";
echo "STDERR: " . stream_get_contents($pipes[2]) . "\n";
proc_terminate($proc);
