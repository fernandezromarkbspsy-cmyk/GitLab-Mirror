<?php

use Illuminate\Support\Facades\Route;

Route::get('/up', fn () => response()->json(['ok' => true]));
