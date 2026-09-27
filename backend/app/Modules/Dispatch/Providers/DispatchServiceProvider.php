<?php

namespace App\Modules\Dispatch\Providers;

use App\Core\Support\ModuleServiceProvider;

final class DispatchServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return dirname(__DIR__);
    }
}
