<?php

namespace App\Features\Requests;

enum RequestStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Cancelled = 'CANCELLED';
    case RejectedByMm = 'REJECTED_BY_MM';
    case Assigned = 'ASSIGNED';
    case ForDocking = 'FOR_DOCKING';
    case Docked = 'DOCKED';
    case Confirmed = 'CONFIRMED';
}
