<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notification_reads')) {
            Schema::create('notification_reads', function (Blueprint $table): void {
                $table->unsignedBigInteger('notification_id');
                $table->uuid('user_id');
                $table->timestampTz('read_at')->useCurrent();
                $table->primary(['notification_id', 'user_id']);
                $table->index(['user_id', 'read_at'], 'notification_reads_user_read_idx');
                $table->foreign('notification_id')->references('id')->on('notifications')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('profiles')->cascadeOnDelete();
            });
        }

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('alter table public.notification_reads enable row level security');
            DB::statement('drop policy if exists "own notification receipts" on public.notification_reads');
            DB::statement('create policy "own notification receipts" on public.notification_reads for select using (user_id = auth.uid())');
            DB::statement(<<<'SQL'
                insert into public.notification_reads (notification_id, user_id, read_at)
                select n.id, p.id, n.read_at
                from public.notifications n
                join public.profiles p on p.role = n.target_role and p.is_active
                where n.target_role is not null and n.read_at is not null
                on conflict (notification_id, user_id) do nothing
                SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
    }
};
