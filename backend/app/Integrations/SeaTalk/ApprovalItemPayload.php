<?php

namespace App\Integrations\SeaTalk;

final readonly class ApprovalItemPayload
{
    public function __construct(
        public string $itemId,
        public int $createdAt,
        public int $updatedAt,
        public string $applicantName,
        public array|string $title,
        public array $pendingList,
        public array $approvedList = [],
        public array $rejectedList = [],
        public array $approvalChain = [],
        public array|string|null $itemName = null,
        public array|string|null $itemState = null,
        public array|string|null $subtitle = null,
        public array|string|null $description = null,
        public array|string|null $statusText = null,
        public int $statusState = 0,
        public int $actionButton = 1,
        public ?string $appPath = null,
        public ?string $approveUrl = null,
        public ?string $rejectUrl = null,
        public bool $hasAttachments = false,
    ) {}

    public function toArray(): array
    {
        $this->validate();
        $payload = [
            'item_id' => $this->itemId,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'applicant_name' => $this->applicantName,
            'has_attachments' => $this->hasAttachments,
            'title' => $this->text($this->title),
            'approval_chain' => ['approvers' => $this->approvalChain],
            'status' => ['state' => $this->statusState, 'text' => $this->optionalText($this->statusText)],
            'action_button' => $this->actionButton,
            'approve_url' => $this->approveUrl,
            'reject_url' => $this->rejectUrl,
            'pending_list' => $this->pendingList,
            'approved_list' => $this->approvedList,
            'rejected_list' => $this->rejectedList,
        ];
        foreach ([
            'item_name' => $this->itemName,
            'item_state' => $this->itemState,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
        ] as $key => $value) {
            if ($value !== null) {
                $payload[$key] = $this->text($value);
            }
        }
        if ($this->appPath !== null) {
            $payload['app_path'] = $this->appPath;
        }

        return $payload;
    }

    private function validate(): void
    {
        if ($this->itemId === '' || strlen($this->itemId) > 30) {
            throw SeaTalkProviderException::validation('SeaTalk item_id must be between 1 and 30 characters.');
        }
        if ($this->applicantName === '' || strlen($this->applicantName) > 50) {
            throw SeaTalkProviderException::validation('SeaTalk applicant_name must be between 1 and 50 characters.');
        }
        if ($this->approveUrl === null || strlen($this->approveUrl) > 500 || $this->rejectUrl === null || strlen($this->rejectUrl) > 500) {
            throw SeaTalkProviderException::validation('SeaTalk approval callback URLs are required and limited to 500 characters.');
        }
        if ($this->actionButton === 2 && ($this->appPath === null || strlen($this->appPath) > 500)) {
            throw SeaTalkProviderException::validation('SeaTalk app_path is required for action_button 2 and limited to 500 characters.');
        }
        if (count($this->pendingList) > 100 || count($this->approvedList) > 100 || count($this->rejectedList) > 100 || count($this->approvalChain) > 100) {
            throw SeaTalkProviderException::validation('SeaTalk approval lists and chain cannot contain more than 100 users.');
        }
    }

    private function text(array|string $value): array
    {
        return is_array($value) ? $value : ['en' => $value];
    }

    private function optionalText(array|string|null $value): ?array
    {
        return $value === null ? null : $this->text($value);
    }
}
