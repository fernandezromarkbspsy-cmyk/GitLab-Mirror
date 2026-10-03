<?php

namespace App\Features\Approvals;

enum ApprovalSource: string
{
    case Web = 'WEB';
    case SeaTalk = 'SEATALK';
}
