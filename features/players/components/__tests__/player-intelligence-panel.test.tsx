import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ActivePlayerIntelligence } from '@/features/players/types'
import { PlayerIntelligencePanel } from '../player-intelligence-panel'

describe('PlayerIntelligencePanel', () => {
  const mockBuild: ActivePlayerIntelligence = {
    buildId: 'build-1',
    playerId: 'player-1',
    buildStatus: 'SUCCESS',
    activationStatus: 'ACTIVE',
    dataCompleteness: 85,
    featureCount: 7,
    completedFeatureCount: 6,
    calculatedAt: new Date('2025-07-15'),
    activatedAt: new Date('2025-07-15T12:00:00'),
    features: [
      {
        featureName: 'tournament_count',
        featureCategory: 'tournament_stats',
        featureValue: 25,
        featureValueStr: null,
        confidence: 95,
        source: 'sportsdataio',
      },
      {
        featureName: 'avg_finish',
        featureCategory: 'tournament_stats',
        featureValue: 12.5,
        featureValueStr: null,
        confidence: 88,
        source: 'calculated',
      },
      {
        featureName: 'cut_percentage',
        featureCategory: 'tournament_stats',
        featureValue: 0.75,
        featureValueStr: null,
        confidence: 92,
        source: 'sportsdataio',
      },
      {
        featureName: 'avg_dkpoints',
        featureCategory: 'fantasy',
        featureValue: 42.3,
        featureValueStr: null,
        confidence: 85,
        source: 'calculated',
      },
      {
        featureName: 'avg_salary',
        featureCategory: 'fantasy',
        featureValue: 7500,
        featureValueStr: null,
        confidence: 80,
        source: 'sportsdataio',
      },
      {
        featureName: 'salary_value',
        featureCategory: 'fantasy',
        featureValue: 5.64,
        featureValueStr: null,
        confidence: 78,
        source: 'calculated',
      },
    ],
  }

  it('should render null state when no intelligence provided', () => {
    render(<PlayerIntelligencePanel intelligence={null} />)
    expect(screen.getByText('No active intelligence build')).toBeInTheDocument()
  })

  it('should render undefined state when intelligence undefined', () => {
    render(<PlayerIntelligencePanel intelligence={undefined} />)
    expect(screen.getByText('No active intelligence build')).toBeInTheDocument()
  })

  it('should display header with feature count and completeness', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText(/6 of 7 features/)).toBeInTheDocument()
    expect(screen.getByText(/85% completeness/)).toBeInTheDocument()
  })

  it('should display calculated date', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText(/Jul 15, 2025/)).toBeInTheDocument()
  })

  it('should format percentage features with %', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('75.0%')).toBeInTheDocument()
  })

  it('should format currency features with $', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('$7,500')).toBeInTheDocument()
  })

  it('should format count features as integers', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should format decimal features with 2 decimal places', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('12.50')).toBeInTheDocument()
    expect(screen.getByText('5.64')).toBeInTheDocument()
  })

  it('should display confidence levels with appropriate badges', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('78%')).toBeInTheDocument()
  })

  it('should display features grouped by category', () => {
    render(<PlayerIntelligencePanel intelligence={mockBuild} />)
    expect(screen.getByText('Tournament Statistics')).toBeInTheDocument()
    expect(screen.getByText('Fantasy Points')).toBeInTheDocument()
  })
})
