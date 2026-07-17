/**
 * Insight Templates
 *
 * Rule-based templates for generating insights from metrics.
 * Each template is deterministic and produces identical output for identical input.
 */

export const DIFFICULTY_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Extreme Championship Test',
      summary: 'One of the most demanding courses imaginable. Only elite golfers should expect competitive scores.',
      importance: 5,
      icon: 'trophy',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Demanding Test',
      summary: 'Long yardage and elevated slope rating reward complete golfers.',
      importance: 4,
      icon: 'award',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Moderate Challenge',
      summary: 'A balanced course testing multiple aspects of the game.',
      importance: 3,
      icon: 'target',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Manageable Layout',
      summary: 'Relatively forgiving course favoring patient, steady play.',
      importance: 2,
      icon: 'smile',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Accessible Course',
      summary: 'Shorter yardage and lower slope create scoring opportunities.',
      importance: 1,
      icon: 'thumbs-up',
    },
  },
]

export const DRIVING_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Precision Driving Essential',
      summary: 'Only drives finding fairways will succeed. Accuracy is the ultimate differentiator.',
      importance: 5,
      icon: 'zap',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Accuracy Matters',
      summary: 'Players consistently finding fairways should gain an advantage.',
      importance: 4,
      icon: 'crosshair',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Solid Driving Valued',
      summary: 'Good tee shots provide a tangible edge over the field.',
      importance: 3,
      icon: 'activity',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Driving Less Critical',
      summary: 'Course design minimizes consequences of wayward tee shots.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Forgiving Off Tee',
      summary: 'Wide fairways and strategic layout forgive most driving mistakes.',
      importance: 1,
      icon: 'info',
    },
  },
]

export const APPROACH_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Elite Iron Play Required',
      summary: 'Tiny greens and demanding approach shots create the ultimate precision test.',
      importance: 5,
      icon: 'target',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Precise Approach Shots Valued',
      summary: 'Small greens increase the value of precise approach shots.',
      importance: 4,
      icon: 'crosshair',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Iron Play Important',
      summary: 'Intermediate difficulty rewards solid approach play.',
      importance: 3,
      icon: 'activity',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Forgiving Green Complex',
      summary: 'Larger greens make approach shots relatively straightforward.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Accessible Approach Play',
      summary: 'Large greens and generous rough make approach shots forgiving.',
      importance: 1,
      icon: 'info',
    },
  },
]

export const PUTTING_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Elite Putting Required',
      summary: 'Blazing fast bentgrass greens punish tentative strokes. Confidence is critical.',
      importance: 5,
      icon: 'droplet',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Bentgrass Specialists',
      summary: 'Fast bentgrass greens reward confident putters.',
      importance: 4,
      icon: 'activity',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Putting Skill Matters',
      summary: 'Moderate green complexity creates meaningful putting variance.',
      importance: 3,
      icon: 'target',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Putting Secondary',
      summary: 'Slower greens and forgiving slopes minimize putting difficulty.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Forgiving on Greens',
      summary: 'Slow greens and generous size make putting straightforward.',
      importance: 1,
      icon: 'smile',
    },
  },
]

export const SHORT_GAME_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Scrambling Impossible',
      summary: 'Severe hazards and tiny greens make recovery nearly impossible.',
      importance: 5,
      icon: 'alert-circle',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Scrambling Difficult',
      summary: 'Hazards and tight short-grass demand precision around the greens.',
      importance: 4,
      icon: 'zap',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Short Game Valued',
      summary: 'Moderate hazards and green sizes create reasonable recovery opportunities.',
      importance: 3,
      icon: 'target',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Generous Short Game',
      summary: 'Ample chip areas and shallow hazards favor aggressive play.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Very Forgiving Short Game',
      summary: 'Large chip areas and minimal hazards make scrambling easy.',
      importance: 1,
      icon: 'smile',
    },
  },
]

export const BIRDIE_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Scoring Opportunities Plentiful',
      summary: 'Multiple reachable Par 5s create numerous birdie and eagle chances.',
      importance: 5,
      icon: 'trending-up',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Scoring Opportunities',
      summary: 'Reachable Par 5s create numerous birdie and eagle chances.',
      importance: 4,
      icon: 'arrow-up',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Moderate Scoring Chances',
      summary: 'Some Par 5s are reachable. Selective scoring expected.',
      importance: 3,
      icon: 'activity',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Limited Scoring Chances',
      summary: 'Long course and few reachable Par 5s limit birdie opportunities.',
      importance: 2,
      icon: 'trending-down',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Few Scoring Opportunities',
      summary: 'Par scoring will be exceptional. Birdies rare.',
      importance: 1,
      icon: 'chevron-down',
    },
  },
]

export const WIND_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Wind Dominates Play',
      summary: 'Links-style and exposed layout mean wind will be the dominant factor.',
      importance: 5,
      icon: 'wind',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Wind Very Important',
      summary: 'Open design and elevation create significant wind exposure.',
      importance: 4,
      icon: 'zap',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Wind Can Impact Play',
      summary: 'Moderate wind exposure, especially on Par 3s and Par 5s.',
      importance: 3,
      icon: 'activity',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Wind Minimal Factor',
      summary: 'Tree-lined course and lower elevation provide wind protection.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Wind Shielded',
      summary: 'Dense trees and protected location make wind almost irrelevant.',
      importance: 1,
      icon: 'info',
    },
  },
]

export const PENALTY_TEMPLATES = [
  {
    minStars: 5,
    template: {
      title: 'Severe Penalty Hazards',
      summary: 'Water, bunkers, and out-of-bounds extensively punish mistakes.',
      importance: 5,
      icon: 'alert-triangle',
    },
  },
  {
    minStars: 4,
    template: {
      title: 'Significant Hazards',
      summary: 'Strategically placed water and bunkers severely punish poor shots.',
      importance: 4,
      icon: 'alert-circle',
    },
  },
  {
    minStars: 3,
    template: {
      title: 'Moderate Hazards',
      summary: 'Hazards penalize poor shots but recovery is possible.',
      importance: 3,
      icon: 'target',
    },
  },
  {
    minStars: 2,
    template: {
      title: 'Limited Hazards',
      summary: 'Few severe hazards make course relatively forgiving.',
      importance: 2,
      icon: 'navigation',
    },
  },
  {
    minStars: 1,
    template: {
      title: 'Minimal Penalties',
      summary: 'Very few hazards. Course emphasizes shot-making over penalization.',
      importance: 1,
      icon: 'smile',
    },
  },
]

/**
 * Get insight template based on stars.
 * Templates ordered by descending stars importance.
 */
export function getTemplate(templates: typeof DIFFICULTY_TEMPLATES, stars: number) {
  for (const template of templates) {
    if (stars >= template.minStars) {
      return template.template
    }
  }
  // Fallback to lowest template
  return templates[templates.length - 1].template
}
