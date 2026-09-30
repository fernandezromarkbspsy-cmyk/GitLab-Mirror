<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('requests')->where('status', 'APPROVED')->update(['status' => 'REQUESTED']);
        DB::table('requests')->where('status', 'REJECTED_BY_MM')->update(['status' => 'CANCELLED']);
        DB::table('requests')->where('status', 'FOR_DOCKING')->update(['status' => 'DOCKING']);
        DB::table('requests')->where('status', 'CONFIRMED')->update(['status' => 'DOCKED']);
    }

    public function down(): void
    {
        // The new values are also produced by current workflow actions, so a
        // lossless rollback cannot be inferred from the status column alone.
    }
};
