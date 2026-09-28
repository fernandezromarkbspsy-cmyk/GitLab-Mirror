<?php

use App\Features\Auth\SeatalkController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/seatalk/callback', [SeatalkController::class, 'callback']);
