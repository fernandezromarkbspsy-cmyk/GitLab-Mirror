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

    /**
     * @return list<string>
     */
    public static function workflowValues(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }

    /**
     * @return list<string>
     */
    public static function approvalPendingValues(): array
    {
        return [self::Pending->value, self::Rerouted->value];
    }
}
