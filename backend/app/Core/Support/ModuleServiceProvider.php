<?php

namespace App\Core\Support;

use Illuminate\Support\ServiceProvider;

abstract class ModuleServiceProvider extends ServiceProvider
{
    abstract protected function modulePath(): string;

    public function boot(): void
    {
        $routes = $this->modulePath().DIRECTORY_SEPARATOR.'routes.php';

        if (is_file($routes)) {
            $this->loadRoutesFrom($routes);
        }
    }
}
