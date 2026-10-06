<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->timestampTz('driver_assigned_at')->nullable();
            $table->timestampTz('linehaul_trip_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table): void {
            $table->dropColumn(['driver_assigned_at', 'linehaul_trip_at']);
        });
    }
};
