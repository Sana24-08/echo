<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Connection extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'requester_id',
        'supporter_id',
        'status',
        'allow_mood',
        'allow_stress',
        'allow_sleep',
        'allow_energy',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allow_mood' => 'boolean',
            'allow_stress' => 'boolean',
            'allow_sleep' => 'boolean',
            'allow_energy' => 'boolean',
        ];
    }

    /**
     * Get the user who sent the connection request.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the user who received the connection request.
     */
    public function supporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supporter_id');
    }
}
