<?php

namespace App\Services;

use App\Models\CheckIn;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PatternAnalysisService
{
    /**
     * Analyze check-in records for a user across a specified period.
     *
     * @param User $user
     * @param string $period '7d' | '30d' | '90d' | 'all'
     * @return array
     */
    public function analyze(User $user, string $period = '7d'): array
    {
        $validPeriods = ['7d', '30d', '90d', 'all'];
        if (!in_array($period, $validPeriods, true)) {
            $period = '7d';
        }

        // Query all check-ins for the user in chronological order
        $allCheckIns = $user->checkIns()
            ->orderBy('created_at', 'asc')
            ->get();

        $totalHistoricalCount = $allCheckIns->count();
        $latestRecord = $allCheckIns->last();

        // Determine date boundaries for current and previous comparable periods
        $startDate = $this->getStartDateForPeriod($period);
        
        $currentPeriodCheckIns = $allCheckIns->filter(function (CheckIn $checkIn) use ($startDate) {
            if ($startDate === null) {
                return true;
            }
            return $checkIn->created_at >= $startDate;
        })->values();

        $periodCount = $currentPeriodCheckIns->count();

        // Previous comparable period query
        $prevPeriodCheckIns = $this->getPreviousPeriodCheckIns($allCheckIns, $period);

        // Empty state handling
        if ($periodCount === 0) {
            return [
                'period' => $period,
                'total_check_ins' => 0,
                'total_historical_check_ins' => $totalHistoricalCount,
                'latest_check_in' => $latestRecord ? $this->formatCheckIn($latestRecord) : null,
                'averages' => [
                    'mood' => null,
                    'energy' => null,
                    'focus' => null,
                    'stress' => null,
                    'sleep' => null,
                ],
                'changes' => [
                    'mood' => null,
                    'energy' => null,
                    'focus' => null,
                    'stress' => null,
                    'sleep' => null,
                ],
                'trends' => [
                    'mood' => 'insufficient_data',
                    'energy' => 'insufficient_data',
                    'focus' => 'insufficient_data',
                    'stress' => 'insufficient_data',
                    'sleep' => 'insufficient_data',
                ],
                'comparison_period' => [
                    'has_comparison' => false,
                    'type' => 'none',
                    'previous_averages' => null,
                ],
                'observations' => [
                    'No check-ins recorded for this period yet. Complete a check-in to begin seeing your personal patterns.',
                ],
                'time_series' => [],
                'has_sufficient_data' => false,
            ];
        }

        // Calculate averages for current period
        $averages = [
            'mood' => round($currentPeriodCheckIns->avg('mood'), 1),
            'energy' => round($currentPeriodCheckIns->avg('energy'), 1),
            'focus' => round($currentPeriodCheckIns->avg('focus'), 1),
            'stress' => round($currentPeriodCheckIns->avg('stress'), 1),
            'sleep' => round($currentPeriodCheckIns->avg('sleep'), 1),
        ];

        // Format chronological time series (actual records only, no fake data)
        $timeSeries = $currentPeriodCheckIns->map(fn(CheckIn $c) => $this->formatCheckIn($c))->all();

        // Calculate changes & trends
        $changes = [];
        $trends = [];
        $hasComparison = false;
        $comparisonType = 'none';
        $prevAverages = null;

        // Condition 1: Period-to-period comparison if previous period has records
        if ($prevPeriodCheckIns->isNotEmpty()) {
            $hasComparison = true;
            $comparisonType = 'period_over_period';
            $prevAverages = [
                'mood' => round($prevPeriodCheckIns->avg('mood'), 1),
                'energy' => round($prevPeriodCheckIns->avg('energy'), 1),
                'focus' => round($prevPeriodCheckIns->avg('focus'), 1),
                'stress' => round($prevPeriodCheckIns->avg('stress'), 1),
                'sleep' => round($prevPeriodCheckIns->avg('sleep'), 1),
            ];

            foreach (['mood', 'energy', 'focus', 'stress', 'sleep'] as $dim) {
                $diff = round($averages[$dim] - $prevAverages[$dim], 1);
                $changes[$dim] = $diff;
                $trends[$dim] = $this->determineTrend($dim, $diff);
            }
        } 
        // Condition 2: Fallback to latest vs previous check-in if at least 2 check-ins exist
        elseif ($periodCount >= 2 || $totalHistoricalCount >= 2) {
            $pool = $periodCount >= 2 ? $currentPeriodCheckIns : $allCheckIns;
            $latest = $pool->last();
            $previous = $pool->slice(-2, 1)->first();

            $hasComparison = true;
            $comparisonType = 'latest_vs_previous';
            $prevAverages = [
                'mood' => (float)$previous->mood,
                'energy' => (float)$previous->energy,
                'focus' => (float)$previous->focus,
                'stress' => (float)$previous->stress,
                'sleep' => (float)$previous->sleep,
            ];

            foreach (['mood', 'energy', 'focus', 'stress', 'sleep'] as $dim) {
                $diff = round($latest->{$dim} - $previous->{$dim}, 1);
                $changes[$dim] = $diff;
                $trends[$dim] = $this->determineTrend($dim, $diff);
            }
        } 
        // Condition 3: Exactly 1 check-in total (or in period) -> insufficient data
        else {
            foreach (['mood', 'energy', 'focus', 'stress', 'sleep'] as $dim) {
                $changes[$dim] = null;
                $trends[$dim] = 'insufficient_data';
            }
        }

        $hasSufficientData = $periodCount >= 2 || ($periodCount === 1 && $hasComparison);

        // Generate rule-based observations
        $observations = $this->generateObservations($periodCount, $averages, $changes, $trends, $comparisonType);

        return [
            'period' => $period,
            'total_check_ins' => $periodCount,
            'total_historical_check_ins' => $totalHistoricalCount,
            'latest_check_in' => $this->formatCheckIn($latestRecord),
            'averages' => $averages,
            'changes' => $changes,
            'trends' => $trends,
            'comparison_period' => [
                'has_comparison' => $hasComparison,
                'type' => $comparisonType,
                'previous_averages' => $prevAverages,
            ],
            'observations' => $observations,
            'time_series' => $timeSeries,
            'has_sufficient_data' => $hasSufficientData,
        ];
    }

    /**
     * Determine trend direction for a dimension based on delta.
     * 
     * For mood, energy, focus, sleep: positive delta is improving, negative is declining.
     * For stress: lower score is calmer/better, so negative delta is improving, positive is declining.
     * 
     * Threshold: |delta| >= 0.5 indicates a meaningful movement. Otherwise stable.
     */
    public function determineTrend(string $dimension, ?float $delta): string
    {
        if ($delta === null) {
            return 'insufficient_data';
        }

        $threshold = 0.5;

        if ($dimension === 'stress') {
            // Lower stress = improving; Higher stress = declining
            if ($delta <= -$threshold) {
                return 'improving';
            } elseif ($delta >= $threshold) {
                return 'declining';
            } else {
                return 'stable';
            }
        }

        // Standard dimensions: Higher = improving; Lower = declining
        if ($delta >= $threshold) {
            return 'improving';
        } elseif ($delta <= -$threshold) {
            return 'declining';
        } else {
            return 'stable';
        }
    }

    /**
     * Generate transparent, rule-based observations.
     */
    protected function generateObservations(
        int $count,
        array $averages,
        array $changes,
        array $trends,
        string $comparisonType
    ): array {
        $obs = [];

        if ($count < 2 && $comparisonType === 'none') {
            $obs[] = 'Not enough check-ins yet to identify a reliable trend. Check in over multiple days to see your personal rhythm emerge.';
            return $obs;
        }

        // Stress observation
        if (isset($trends['stress'])) {
            if ($trends['stress'] === 'improving') {
                $obs[] = 'Your stress ratings show a welcome easing trend compared with earlier records.';
            } elseif ($trends['stress'] === 'declining') {
                $obs[] = 'Your stress ratings have been higher in recent check-ins. Take things at a gentle pace.';
            } else {
                $obs[] = 'Your stress levels have remained steady and balanced across recent check-ins.';
            }
        }

        // Mood observation
        if (isset($trends['mood'])) {
            if ($trends['mood'] === 'improving') {
                $obs[] = 'Your mood ratings show an uplifting upward trend.';
            } elseif ($trends['mood'] === 'declining') {
                $obs[] = 'Your mood has dipped slightly compared with earlier ratings. Be kind to yourself today.';
            } else {
                $obs[] = 'Your mood ratings have been fairly consistent across this period.';
            }
        }

        // Energy / Sleep synergy observation
        if (isset($trends['energy']) && isset($trends['sleep'])) {
            if ($trends['energy'] === 'improving' && $trends['sleep'] === 'improving') {
                $obs[] = 'Both your energy and sleep ratings are trending higher, indicating strong restorative momentum.';
            } elseif ($trends['energy'] === 'declining' && $trends['sleep'] === 'declining') {
                $obs[] = 'Lower sleep ratings appear to coincide with reduced energy reserves. Extra rest may help you recharge.';
            } elseif ($trends['energy'] === 'improving') {
                $obs[] = 'Your average energy rating was higher this period than in previous check-ins.';
            }
        }

        // Focus observation if needed
        if (isset($trends['focus']) && $trends['focus'] === 'improving') {
            $obs[] = 'Your focus ratings have sharpened over recent check-ins.';
        }

        if (empty($obs)) {
            $obs[] = 'Your ratings reflect a steady rhythm with no abrupt fluctuations.';
        }

        return $obs;
    }

    /**
     * Formats a single CheckIn record.
     */
    public function formatCheckIn(CheckIn $checkIn): array
    {
        return [
            'id' => $checkIn->id,
            'user_id' => $checkIn->user_id,
            'mood' => (int)$checkIn->mood,
            'energy' => (int)$checkIn->energy,
            'focus' => (int)$checkIn->focus,
            'stress' => (int)$checkIn->stress,
            'sleep' => (int)$checkIn->sleep,
            'created_at' => $checkIn->created_at->toISOString(),
            'formatted_date' => $checkIn->created_at->format('M j, Y g:i A'),
            'date_short' => $checkIn->created_at->format('M j'),
            'day_of_week' => $checkIn->created_at->format('D'),
        ];
    }

    /**
     * Derive current state classification from check-in ratings.
     * Matches the ECHO rule-based reflection (non-diagnostic).
     */
    public function classifyCurrentState(array $ratings): array
    {
        $mood = (int)($ratings['mood'] ?? 7);
        $energy = (int)($ratings['energy'] ?? 6);
        $focus = (int)($ratings['focus'] ?? 7);
        $stress = (int)($ratings['stress'] ?? 4);
        $sleep = (int)($ratings['sleep'] ?? 8);

        // Inverted stress: 1 (calm) -> 10, 10 (overwhelmed) -> 1
        $calmness = 11 - $stress;
        $overallScore = ($mood + $energy + $focus + $sleep + $calmness) / 5;

        // 1. Low state
        if ($overallScore < 4.8 || ($mood <= 3 && $energy <= 4) || ($mood <= 4 && $stress >= 8)) {
            $note = "You don't have to carry everything all at once today. Take things one gentle step at a time.";
            if ($stress >= 8) {
                $note = "Your check-in suggests you're holding a lot of stress right now with lower reserves. That's okay — you don't have to have everything figured out today. Be gentle with yourself.";
            } elseif ($sleep <= 3 || $energy <= 3) {
                $note = "Your ratings show that your energy and rest are running low today. Listen to your body and give yourself permission to take a quiet breath and recharge.";
            } elseif ($mood <= 3) {
                $note = "It looks like today feels a bit heavy emotionally. That's completely okay. You don't have to force yourself to feel positive right now.";
            }

            return [
                'state' => 'low',
                'title' => "It looks like today feels a little heavy.",
                'message' => $note,
                'quote' => "It's okay to have difficult days. They don't define you. Be gentle with yourself today — small steps still count. 💛",
                'badgeText' => 'GENTLE REFLECTION',
                'badgeColor' => 'coral',
                'characterMood' => 'supportive',
                'overall_score' => round($overallScore, 1),
            ];
        }

        // 2. Positive state
        if ($overallScore >= 6.8 && $mood >= 6 && $stress <= 6) {
            $note = "Your check-in shows some really positive energy today. Keep that wonderful momentum going and enjoy what's ahead.";
            if ($energy >= 8 && $focus >= 8) {
                $note = "Your check-in highlights sharp focus, bright energy, and a vibrant mindset today. You're in a great groove — make the most of this momentum!";
            } elseif ($sleep >= 8) {
                $note = "Restful sleep has set a strong, supportive foundation for your day. It's great to see your rhythm feeling so light and balanced.";
            } elseif ($stress <= 3) {
                $note = "Your mind feels peaceful, open, and calm today. That ease is worth noticing and enjoying as you move through your day.";
            }

            return [
                'state' => 'positive',
                'title' => "You're looking pretty good today! ✨",
                'message' => $note,
                'quote' => "A good day is worth celebrating. Keep doing more of what makes you feel alive and grounded. 💛",
                'badgeText' => 'POSITIVE RHYTHM',
                'badgeColor' => 'mint',
                'characterMood' => 'celebrating',
                'overall_score' => round($overallScore, 1),
            ];
        }

        // 3. Neutral state
        return [
            'state' => 'neutral',
            'title' => "Looks like you're somewhere in the middle today.",
            'message' => "Nothing too high or too low. Your ratings suggest a steady, balanced state. Take a moment to check in with yourself and keep moving at your own pace.",
            'quote' => "You don't have to rush or force anything. Progress can be quiet too. 🌿",
            'badgeText' => 'BALANCED RHYTHM',
            'badgeColor' => 'lavender',
            'characterMood' => 'calm',
            'overall_score' => round($overallScore, 1),
        ];
    }

    /**
     * Get start date boundary for the period.
     */
    protected function getStartDateForPeriod(string $period): ?Carbon
    {
        return match ($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            default => null,
        };
    }

    /**
     * Get previous comparable period check-ins.
     */
    protected function getPreviousPeriodCheckIns(Collection $allCheckIns, string $period): Collection
    {
        $days = match ($period) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => null,
        };

        if ($days === null) {
            return collect();
        }

        $now = Carbon::now();
        $prevPeriodEnd = (clone $now)->subDays($days);
        $prevPeriodStart = (clone $now)->subDays($days * 2);

        return $allCheckIns->filter(function (CheckIn $c) use ($prevPeriodStart, $prevPeriodEnd) {
            return $c->created_at >= $prevPeriodStart && $c->created_at < $prevPeriodEnd;
        })->values();
    }
}
