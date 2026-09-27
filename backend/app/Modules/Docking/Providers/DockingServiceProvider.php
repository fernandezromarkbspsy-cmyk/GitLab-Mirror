<?php

namespace App\Modules\Docking\Providers;

use App\Core\Support\ModuleServiceProvider;

final class DockingServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return dirname(__DIR__);
    }
}
