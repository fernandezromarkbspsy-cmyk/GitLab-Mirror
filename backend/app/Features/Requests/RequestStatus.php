<?php

namespace App\Features\Requests;

enum RequestStatus: string
{
    case Pending = 'PENDING';
    case Requested = 'REQUESTED';
    case Cancelled = 'CANCELLED';
    case Rerouted = 'REROUTED';
    case Assigned = 'ASSIGNED';
    case Docking = 'DOCKING';
    case Docked = 'DOCKED';
}
