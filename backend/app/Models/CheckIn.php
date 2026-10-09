<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'check_ins';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'mood',
        'energy',
        'focus',
        'stress',
        'sleep',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mood' => 'integer',
            'energy' => 'integer',
            'focus' => 'integer',
            'stress' => 'integer',
            'sleep' => 'integer',
        ];
    }

    /**
     * Get the user who owns this check-in.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
