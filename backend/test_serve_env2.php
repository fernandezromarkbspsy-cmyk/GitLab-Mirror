<?php
$exclude = $argv[1] ?? '';
$port = $argv[2] ?? 8000;
$env = [];
foreach ($_ENV as $k => $v) {
    $env[$k] = ($k === $exclude) ? false : $v;
}
$cmd = [PHP_BINARY, '-S', "127.0.0.1:$port", __DIR__ . '/public/server.php'];
$descriptors = [1 => ['pipe','w'], 2 => ['pipe','w']];
$proc = proc_open($cmd, $descriptors, $pipes, __DIR__ . '/public', $env);
usleep(800000);
$err = stream_get_contents($pipes[2]);
$status = proc_get_status($proc);
echo ($exclude ?: '(none)') . " => " . (str_contains($err, 'Failed to listen') ? "FAIL" : "OK") . "\n";
if ($status['pid']) {
    exec('taskkill /F /T /PID ' . $status['pid'] . ' 2>NUL');
}
