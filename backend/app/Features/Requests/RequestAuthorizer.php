<?php

namespace App\Features\Requests;

final class RequestAuthorizer
{
    public function canView(object $actor, object $request): bool
    {
        return $actor->role !== 'ops_pic'
            || ($actor->is_admin ?? false)
            || $request->created_by === $actor->id;
    }

    public function canEdit(object $actor): bool
    {
        return $actor->role === 'fte_ops';
    }

    public function canTransition(object $actor, string $action, object $request): bool
    {
        if ($action === 'cancel') {
            return $actor->role === 'ops_pic' && $request->created_by === $actor->id;
        }

        if (in_array($action, ['mark-docked', 'confirm'], true)) {
            return $actor->role === 'doc_officer';
        }

        return match ($action) {
            'approve', 'reject-ops' => $actor->role === 'fte_ops',
            'reject-mm', 'assign-truck' => $actor->role === 'fte_mm',
            default => false,
        };
    }
}
