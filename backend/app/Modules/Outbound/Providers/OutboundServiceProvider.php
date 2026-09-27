<?php

namespace App\Modules\Outbound\Providers;

use App\Core\Support\ModuleServiceProvider;

final class OutboundServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return dirname(__DIR__);
    }
}
