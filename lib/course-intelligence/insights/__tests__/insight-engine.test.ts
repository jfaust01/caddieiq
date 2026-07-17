/**
 * Insight Engine Tests
 *
 * Verify deterministic insight generation from CourseIntelligence metrics.
 */

import { describe, it, expect } from 'vitest'
import { generateAllInsights, generateInsightByCategory, getAllCategories } from '../insight-engine'
import type { InsightGenerationInput } from '../types'

describe('Insight Engine', () => {
  const baseInput: InsightGenerationInput = {
    courseIntelligenceId: 'cin-test-123',
    courseId: 'course-123',
    overallDifficultyStars: 3,
    drivingImportanceStars: 3,
    approachImportanceStars: 3,
    shortGameImportanceStars: 3,
    puttingImportanceStars: 3,
    windSensitivityStars: 3,
    penaltySeverityStars: 3,
    birdiePotentialStars: 3,
    scoringVolatilityStars: 3,
  }

  describe('generateAllInsights', () => {
    it('generates exactly 8 insights', () => {
      const insights = generateAllInsights(baseInput)
      expect(insights).toHaveLength(8)
    })

    it('sorts by importance (descending) then displayOrder (ascending)', () => {
      const insights = generateAllInsights(baseInput)
      
      for (let i = 1; i < insights.length; i++) {
        const prev = insights[i - 1]
        const curr = insights[i]
        
        // Either prev importance is higher, or same importance with lower displayOrder
        if (prev.importance === curr.importance) {
          expect(prev.displayOrder).toBeLessThanOrEqual(curr.displayOrder)
        } else {
          expect(prev.importance).toBeGreaterThanOrEqual(curr.importance)
        }
      }
    })

    it('generates deterministic output (identical input produces identical output)', () => {
      const insights1 = generateAllInsights(baseInput)
      const insights2 = generateAllInsights(baseInput)

      expect(insights1).toHaveLength(insights2.length)
      
      for (let i = 0; i < insights1.length; i++) {
        const insight1 = insights1[i]
        const insight2 = insights2[i]
        
        expect(insight1.category).toBe(insight2.category)
        expect(insight1.title).toBe(insight2.title)
        expect(insight1.summary).toBe(insight2.summary)
        expect(insight1.importance).toBe(insight2.importance)
      }
    })

    it('generates challenging insights for high-difficulty courses', () => {
      const hardCourse = {
        ...baseInput,
        overallDifficultyStars: 5,
        drivingImportanceStars: 5,
        approachImportanceStars: 5,
        penaltySeverityStars: 5,
      }

      const insights = generateAllInsights(hardCourse)
      
      // Should have challenging titles
      const titles = insights.map((i) => i.title)
      expect(titles.some((t) => t.toLowerCase().includes('extreme') || t.toLowerCase().includes('elite'))).toBe(true)
    })

    it('generates accessible insights for low-difficulty courses', () => {
      const easyCourse = {
        ...baseInput,
        overallDifficultyStars: 1,
        drivingImportanceStars: 1,
        approachImportanceStars: 1,
        penaltySeverityStars: 1,
      }

      const insights = generateAllInsights(easyCourse)
      
      // Should have accessible/forgiving titles
      const titles = insights.map((i) => i.title)
      expect(
        titles.some(
          (t) =>
            t.toLowerCase().includes('forgiving') ||
            t.toLowerCase().includes('accessible') ||
            t.toLowerCase().includes('manageable')
        )
      ).toBe(true)
    })

    it('includes all 8 insight categories', () => {
      const insights = generateAllInsights(baseInput)
      const categories = insights.map((i) => i.category)

      expect(categories).toContain('difficulty')
      expect(categories).toContain('driving')
      expect(categories).toContain('approach')
      expect(categories).toContain('shortGame')
      expect(categories).toContain('putting')
      expect(categories).toContain('birdie')
      expect(categories).toContain('wind')
      expect(categories).toContain('penalties')
    })
  })

  describe('generateInsightByCategory', () => {
    it('generates insight for each category', () => {
      const categories = getAllCategories()
      
      for (const category of categories) {
        const insight = generateInsightByCategory(baseInput, category)
        expect(insight).not.toBeNull()
        expect(insight?.category).toBe(category)
      }
    })

    it('returns null for unknown category', () => {
      const insight = generateInsightByCategory(baseInput, 'unknown-category')
      expect(insight).toBeNull()
    })

    it('generates deterministic output by category', () => {
      const insight1 = generateInsightByCategory(baseInput, 'difficulty')
      const insight2 = generateInsightByCategory(baseInput, 'difficulty')

      expect(insight1?.title).toBe(insight2?.title)
      expect(insight1?.summary).toBe(insight2?.summary)
      expect(insight1?.importance).toBe(insight2?.importance)
    })
  })

  describe('getAllCategories', () => {
    it('returns 8 categories', () => {
      const categories = getAllCategories()
      expect(categories).toHaveLength(8)
    })

    it('returns expected categories', () => {
      const categories = getAllCategories()
      
      expect(categories).toContain('difficulty')
      expect(categories).toContain('driving')
      expect(categories).toContain('approach')
      expect(categories).toContain('shortGame')
      expect(categories).toContain('putting')
      expect(categories).toContain('birdie')
      expect(categories).toContain('wind')
      expect(categories).toContain('penalties')
    })
  })

  describe('Star-based routing', () => {
    it('routes to correct template based on stars', () => {
      // Test extreme difficulty
      const veryHard = generateAllInsights({ ...baseInput, overallDifficultyStars: 5 })
      const hardInsight = veryHard.find((i) => i.category === 'difficulty')
      expect(hardInsight?.importance).toBe(5)

      // Test minimal difficulty
      const veryEasy = generateAllInsights({ ...baseInput, overallDifficultyStars: 1 })
      const easyInsight = veryEasy.find((i) => i.category === 'difficulty')
      expect(easyInsight?.importance).toBe(1)

      // Test middle difficulty
      const moderate = generateAllInsights({ ...baseInput, overallDifficultyStars: 3 })
      const modInsight = moderate.find((i) => i.category === 'difficulty')
      expect(modInsight?.importance).toBe(3)
    })
  })

  describe('Insight content', () => {
    it('generates non-empty titles and summaries', () => {
      const insights = generateAllInsights(baseInput)

      for (const insight of insights) {
        expect(insight.title).toBeTruthy()
        expect(insight.title.length).toBeGreaterThan(0)
        expect(insight.summary).toBeTruthy()
        expect(insight.summary.length).toBeGreaterThan(0)
      }
    })

    it('generates valid importance scores (1-5)', () => {
      const insights = generateAllInsights(baseInput)

      for (const insight of insights) {
        expect(insight.importance).toBeGreaterThanOrEqual(1)
        expect(insight.importance).toBeLessThanOrEqual(5)
      }
    })

    it('generates valid icon identifiers', () => {
      const validIcons = [
        'trophy', 'award', 'target', 'smile', 'thumbs-up',
        'zap', 'crosshair', 'activity', 'navigation', 'info',
        'droplet', 'alert-circle', 'alert-triangle', 'trending-up',
        'arrow-up', 'trending-down', 'chevron-down', 'wind',
      ]

      const insights = generateAllInsights(baseInput)

      for (const insight of insights) {
        expect(validIcons).toContain(insight.icon)
      }
    })
  })
})
