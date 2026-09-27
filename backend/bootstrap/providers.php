<?php

use App\Core\CoreServiceProvider;
use App\Modules\Dispatch\Providers\DispatchServiceProvider;
use App\Modules\Docking\Providers\DockingServiceProvider;
use App\Modules\Kpi\Providers\KpiServiceProvider;
use App\Modules\Outbound\Providers\OutboundServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    CoreServiceProvider::class,
    OutboundServiceProvider::class,
    DispatchServiceProvider::class,
    DockingServiceProvider::class,
    KpiServiceProvider::class,
];
