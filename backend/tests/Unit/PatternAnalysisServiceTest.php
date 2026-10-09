<?php

namespace Tests\Unit;

use App\Services\PatternAnalysisService;
use PHPUnit\Framework\TestCase;

class PatternAnalysisServiceTest extends TestCase
{
    protected PatternAnalysisService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PatternAnalysisService();
    }

    /**
     * Test trend direction for positive dimensions (mood, energy, focus, sleep).
     */
    public function test_standard_dimension_trend_direction(): void
    {
        // Improving (delta >= +0.5)
        $this->assertEquals('improving', $this->service->determineTrend('mood', 0.5));
        $this->assertEquals('improving', $this->service->determineTrend('energy', 1.2));
        $this->assertEquals('improving', $this->service->determineTrend('focus', 0.8));
        $this->assertEquals('improving', $this->service->determineTrend('sleep', 2.0));

        // Declining (delta <= -0.5)
        $this->assertEquals('declining', $this->service->determineTrend('mood', -0.5));
        $this->assertEquals('declining', $this->service->determineTrend('energy', -1.0));
        $this->assertEquals('declining', $this->service->determineTrend('focus', -0.6));
        $this->assertEquals('declining', $this->service->determineTrend('sleep', -1.5));

        // Stable (|delta| < 0.5)
        $this->assertEquals('stable', $this->service->determineTrend('mood', 0.3));
        $this->assertEquals('stable', $this->service->determineTrend('energy', -0.4));
        $this->assertEquals('stable', $this->service->determineTrend('focus', 0.0));
    }

    /**
     * Test stress dimension trend direction (inverted: lower is improving, higher is declining).
     */
    public function test_stress_dimension_trend_direction_inverted(): void
    {
        // Stress decreased by >= 0.5 -> User is calmer -> Improving
        $this->assertEquals('improving', $this->service->determineTrend('stress', -0.5));
        $this->assertEquals('improving', $this->service->determineTrend('stress', -2.0));

        // Stress increased by >= 0.5 -> User is more stressed -> Declining
        $this->assertEquals('declining', $this->service->determineTrend('stress', 0.5));
        $this->assertEquals('declining', $this->service->determineTrend('stress', 1.5));

        // Small change in stress -> Stable
        $this->assertEquals('stable', $this->service->determineTrend('stress', 0.2));
        $this->assertEquals('stable', $this->service->determineTrend('stress', -0.3));
    }

    /**
     * Test null delta returns insufficient data.
     */
    public function test_null_delta_returns_insufficient_data(): void
    {
        $this->assertEquals('insufficient_data', $this->service->determineTrend('mood', null));
        $this->assertEquals('insufficient_data', $this->service->determineTrend('stress', null));
    }

    /**
     * Test current state classification heuristics.
     */
    public function test_classify_current_state_rules(): void
    {
        // High stress & low mood -> low state
        $lowResult = $this->service->classifyCurrentState([
            'mood' => 3,
            'energy' => 3,
            'focus' => 4,
            'stress' => 9,
            'sleep' => 3,
        ]);
        $this->assertEquals('low', $lowResult['state']);
        $this->assertEquals('coral', $lowResult['badgeColor']);

        // High mood, good energy, low stress -> positive state
        $posResult = $this->service->classifyCurrentState([
            'mood' => 8,
            'energy' => 8,
            'focus' => 8,
            'stress' => 2,
            'sleep' => 8,
        ]);
        $this->assertEquals('positive', $posResult['state']);
        $this->assertEquals('mint', $posResult['badgeColor']);

        // Balanced ratings -> neutral state
        $neutralResult = $this->service->classifyCurrentState([
            'mood' => 6,
            'energy' => 5,
            'focus' => 6,
            'stress' => 5,
            'sleep' => 6,
        ]);
        $this->assertEquals('neutral', $neutralResult['state']);
        $this->assertEquals('lavender', $neutralResult['badgeColor']);
    }
}
