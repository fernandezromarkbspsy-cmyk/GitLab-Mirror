<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('seatalk_approval_items')) {
            Schema::create('seatalk_approval_items', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->uuid('request_id');
                $table->string('provider_item_id')->nullable()->unique();
                $table->string('provider_response_id')->nullable();
                $table->string('status', 24)->default('PENDING');
                $table->text('failure_reason')->nullable();
                $table->uuid('correlation_id')->nullable();
                $table->timestampsTz();
                $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
                $table->unique('request_id');
                $table->index(['status', 'updated_at'], 'seatalk_items_status_updated_idx');
                $table->index('correlation_id', 'seatalk_items_correlation_idx');
            });
        }

        if (! Schema::hasTable('seatalk_approval_assignments')) {
            Schema::create('seatalk_approval_assignments', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->uuid('request_id');
                $table->uuid('seatalk_approval_item_id');
                $table->uuid('fte_user_id');
                $table->unsignedInteger('sequence');
                $table->string('status', 24)->default('ACTIVE');
                $table->timestampTz('sent_at')->nullable();
                $table->timestampTz('expires_at')->nullable();
                $table->timestampTz('responded_at')->nullable();
                $table->string('seatalk_message_id')->nullable();
                $table->string('provider_response_id')->nullable();
                $table->string('approval_token_hash')->nullable();
                $table->text('failure_reason')->nullable();
                $table->uuid('correlation_id')->nullable();
                $table->timestampsTz();
                $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
                $table->foreign('seatalk_approval_item_id')->references('id')->on('seatalk_approval_items')->cascadeOnDelete();
                $table->foreign('fte_user_id')->references('id')->on('profiles')->restrictOnDelete();
                $table->index(['status', 'expires_at'], 'seatalk_assignments_expiry_idx');
                $table->index(['fte_user_id', 'status'], 'seatalk_assignments_employee_idx');
                $table->index(['request_id', 'sequence'], 'seatalk_assignments_request_sequence_idx');
                $table->index('correlation_id', 'seatalk_assignments_correlation_idx');
            });
        }

        if (! $this->constraintExists('seatalk_approval_items', 'seatalk_approval_items_status_check')) {
            DB::statement("ALTER TABLE seatalk_approval_items
                ADD CONSTRAINT seatalk_approval_items_status_check
                CHECK (status IN ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'CLOSED', 'FAILED'))");
        }
        if (! $this->constraintExists('seatalk_approval_assignments', 'seatalk_approval_assignments_status_check')) {
            DB::statement("ALTER TABLE seatalk_approval_assignments
                ADD CONSTRAINT seatalk_approval_assignments_status_check
                CHECK (status IN ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'EXPIRED', 'CLOSED', 'FAILED'))");
        }
        if (! $this->constraintExists('seatalk_approval_assignments', 'seatalk_approval_assignments_sequence_check')) {
            DB::statement('ALTER TABLE seatalk_approval_assignments
                ADD CONSTRAINT seatalk_approval_assignments_sequence_check
                CHECK (sequence > 0)');
        }

        if (! $this->hasIndex('seatalk_approval_assignments', 'seatalk_active_assignment_request_uidx')) {
            DB::statement("create unique index seatalk_active_assignment_request_uidx
                on seatalk_approval_assignments (request_id)
                where status in ('PENDING', 'ACTIVE')");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seatalk_approval_assignments');
        Schema::dropIfExists('seatalk_approval_items');
    }

    private function hasIndex(string $table, string $name): bool
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return collect(Schema::getConnection()->select("PRAGMA index_list({$table})"))
                ->contains(fn (object $index): bool => ($index->name ?? null) === $name);
        }

        return DB::table('pg_indexes')
            ->where('schemaname', Schema::getConnection()->getConfig('schema', 'public'))
            ->where('tablename', $table)
            ->where('indexname', $name)
            ->exists();
    }

    private function constraintExists(string $table, string $name): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('table_schema', Schema::getConnection()->getConfig('schema', 'public'))
            ->where('table_name', $table)
            ->where('constraint_name', $name)
            ->exists();
    }
};
