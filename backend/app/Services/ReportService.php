<?php

namespace App\Services;

use App\Models\CheckIn;
use App\Models\Connection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public function __construct(
        protected PatternAnalysisService $patternAnalysisService
    ) {}

    /**
     * Generate an aggregated well-being report for a user.
     *
     * @param User $user
     * @param string $period '7d' | '30d' | '90d' | 'all'
     * @return array
     */
    public function generateUserReport(User $user, string $period = '30d'): array
    {
        $analysis = $this->patternAnalysisService->analyze($user, $period);
        $totalCheckIns = $analysis['total_check_ins'];

        // Determine period label
        $now = Carbon::now();
        $periodLabel = match ($period) {
            '7d' => $now->copy()->subDays(7)->format('M j') . ' – ' . $now->format('M j, Y'),
            '90d' => $now->copy()->subDays(90)->format('M j') . ' – ' . $now->format('M j, Y'),
            'all' => 'All Available Check-Ins',
            default => $now->copy()->subDays(30)->format('M j') . ' – ' . $now->format('M j, Y'),
        };

        // Determine overall rhythm status
        $statusBadge = 'Steady overall';
        if ($totalCheckIns === 0) {
            $statusBadge = 'No data recorded';
        } elseif ($analysis['trends']['stress'] === 'declining') {
            $statusBadge = 'Elevated stress';
        } elseif ($analysis['trends']['mood'] === 'improving' || $analysis['trends']['energy'] === 'improving') {
            $statusBadge = 'Positive momentum';
        }

        // Generate summary cards
        $dimensionReports = [];
        $dims = [
            'mood' => ['label' => 'Mood', 'color' => 'mint', 'arrow' => '↗'],
            'stress' => ['label' => 'Stress', 'color' => 'coral', 'arrow' => '→'],
            'sleep' => ['label' => 'Sleep', 'color' => 'blue', 'arrow' => '↗'],
            'energy' => ['label' => 'Energy', 'color' => 'yellow', 'arrow' => '→'],
            'focus' => ['label' => 'Focus', 'color' => 'lavender', 'arrow' => '↗'],
        ];

        foreach ($dims as $key => $meta) {
            $trend = $analysis['trends'][$key] ?? 'insufficient_data';
            $arrow = match ($trend) {
                'improving' => '↗',
                'declining' => '↘',
                'stable' => '→',
                default => '—',
            };
            $stateText = match ($trend) {
                'improving' => 'Improving',
                'declining' => 'Declining',
                'stable' => 'Stable',
                default => 'Baseline',
            };

            $dimensionReports[] = [
                'dimension' => $key,
                'label' => $meta['label'],
                'color' => $meta['color'],
                'average' => $analysis['averages'][$key],
                'change' => $analysis['changes'][$key],
                'trend' => $trend,
                'state' => $stateText,
                'arrow' => $arrow,
            ];
        }

        return [
            'period' => $period,
            'period_label' => $periodLabel,
            'status_badge' => $statusBadge,
            'user_name' => $user->name,
            'total_check_ins' => $totalCheckIns,
            'latest_check_in' => $analysis['latest_check_in'],
            'dimension_reports' => $dimensionReports,
            'time_series' => $analysis['time_series'],
            'insights' => $analysis['observations'],
            'has_sufficient_data' => $analysis['has_sufficient_data'],
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Generate authorized shared reports for supporters/admins.
     * Only includes data from users who have an accepted connection and have granted permission.
     *
     * @param User $supporter
     * @param string $period
     * @return array
     */
    public function generateSupporterReport(User $supporter, string $period = '30d'): array
    {
        // Find accepted connections where this user is the supporter
        $connections = Connection::with('requester')
            ->where('supporter_id', $supporter->id)
            ->where('status', 'accepted')
            ->get();

        $sharedReports = [];

        foreach ($connections as $conn) {
            $student = $conn->requester;
            if (!$student) {
                continue;
            }

            $userReport = $this->generateUserReport($student, $period);

            // Filter dimensions based on explicit permissions
            $filteredDims = array_filter($userReport['dimension_reports'], function ($dim) use ($conn) {
                return match ($dim['dimension']) {
                    'mood' => (bool)$conn->allow_mood,
                    'stress' => (bool)$conn->allow_stress,
                    'sleep' => (bool)$conn->allow_sleep,
                    'energy', 'focus' => (bool)$conn->allow_energy,
                    default => false,
                };
            });

            $allowedLabels = [];
            if ($conn->allow_mood) $allowedLabels[] = 'Mood';
            if ($conn->allow_stress) $allowedLabels[] = 'Stress';
            if ($conn->allow_sleep) $allowedLabels[] = 'Sleep';
            if ($conn->allow_energy) $allowedLabels[] = 'Energy';

            $sharedReports[] = [
                'connection_id' => $conn->id,
                'user_id' => $student->id,
                'user_name' => $student->name,
                'shared_permissions' => $allowedLabels,
                'report' => array_merge($userReport, [
                    'dimension_reports' => array_values($filteredDims),
                ]),
            ];
        }

        return [
            'period' => $period,
            'supporter_id' => $supporter->id,
            'shared_reports' => $sharedReports,
            'total_shared_users' => count($sharedReports),
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }
}
