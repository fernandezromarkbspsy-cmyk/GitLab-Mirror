<?php

namespace App\Modules\Kpi\Providers;

use App\Core\Support\ModuleServiceProvider;

final class KpiServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return dirname(__DIR__);
    }
}
