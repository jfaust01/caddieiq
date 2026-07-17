/**
 * Insight Generators
 *
 * Rule-based generators for each insight category.
 * Deterministic: identical input always produces identical output.
 */

import type { RawInsight, InsightGenerationInput } from './types'
import {
  DIFFICULTY_TEMPLATES,
  DRIVING_TEMPLATES,
  APPROACH_TEMPLATES,
  PUTTING_TEMPLATES,
  SHORT_GAME_TEMPLATES,
  BIRDIE_TEMPLATES,
  WIND_TEMPLATES,
  PENALTY_TEMPLATES,
  getTemplate,
} from './templates'

export function generateDifficultyInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(DIFFICULTY_TEMPLATES, input.overallDifficultyStars)
  return {
    category: 'difficulty',
    ...template,
    displayOrder,
  }
}

export function generateDrivingInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(DRIVING_TEMPLATES, input.drivingImportanceStars)
  return {
    category: 'driving',
    ...template,
    displayOrder,
  }
}

export function generateApproachInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(APPROACH_TEMPLATES, input.approachImportanceStars)
  return {
    category: 'approach',
    ...template,
    displayOrder,
  }
}

export function generateShortGameInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(SHORT_GAME_TEMPLATES, input.shortGameImportanceStars)
  return {
    category: 'shortGame',
    ...template,
    displayOrder,
  }
}

export function generatePuttingInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(PUTTING_TEMPLATES, input.puttingImportanceStars)
  return {
    category: 'putting',
    ...template,
    displayOrder,
  }
}

export function generateBirdieInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(BIRDIE_TEMPLATES, input.birdiePotentialStars)
  return {
    category: 'birdie',
    ...template,
    displayOrder,
  }
}

export function generateWindInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(WIND_TEMPLATES, input.windSensitivityStars)
  return {
    category: 'wind',
    ...template,
    displayOrder,
  }
}

export function generatePenaltyInsight(input: InsightGenerationInput, displayOrder: number): RawInsight {
  const template = getTemplate(PENALTY_TEMPLATES, input.penaltySeverityStars)
  return {
    category: 'penalties',
    ...template,
    displayOrder,
  }
}
