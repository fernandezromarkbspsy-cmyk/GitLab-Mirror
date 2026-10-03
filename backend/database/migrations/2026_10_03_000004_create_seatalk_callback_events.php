<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('seatalk_callback_events')) {
            return;
        }

        Schema::create('seatalk_callback_events', function (Blueprint $table): void {
            $table->string('event_id', 255)->primary();
            $table->string('provider_item_id', 100);
            $table->uuid('request_id')->nullable();
            $table->string('employee_code', 255);
            $table->string('action', 16);
            $table->string('status', 24);
            $table->uuid('correlation_id')->nullable();
            $table->timestampTz('received_at');
            $table->timestampTz('processed_at')->nullable();
            $table->index(['provider_item_id', 'received_at'], 'seatalk_callback_item_received_idx');
            $table->index(['request_id', 'status'], 'seatalk_callback_request_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seatalk_callback_events');
    }
};
