'use client'

/**
 * Skeleton loader for Round DNA chart.
 * Displays animated placeholder while fetching hole data.
 */
export function RoundDnaSkeleton() {
  const SVG_WIDTH = 300
  const SVG_HEIGHT = 60
  const CENTER_Y = SVG_HEIGHT / 2 + 5
  const PADDING = 8
  const USABLE_WIDTH = SVG_WIDTH - 2 * PADDING
  const DOT_GAP = 5
  const STEP_X = (USABLE_WIDTH - DOT_GAP * 18) / 18 + DOT_GAP

  // Generate placeholder dots across all 18 holes
  const skeletonDots = Array.from({ length: 18 }, (_, i) => ({
    x: PADDING + i * STEP_X + STEP_X / 2,
    y: CENTER_Y,
  }))

  return (
    <div className="relative w-full">
      <div className="flex h-full relative">
        <div className="flex-1 min-w-0 overflow-hidden relative">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            style={{ userSelect: 'none' }}
          >
            {/* Center line */}
            <line
              x1={PADDING}
              y1={CENTER_Y}
              x2={SVG_WIDTH - PADDING}
              y2={CENTER_Y}
              stroke="#3F4855"
              strokeWidth="1"
            />

            {/* Skeleton dots - animated pulse */}
            {skeletonDots.map((dot, idx) => (
              <g key={`skeleton-dot-${idx}`}>
                {/* Background circle - animated */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={3}
                  fill="#4B5563"
                  opacity="0.5"
                  className="animate-pulse"
                  style={{
                    animationDuration: '1.5s',
                    animationDelay: `${idx * 50}ms`,
                  }}
                />
                {/* Outline */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={3}
                  fill="none"
                  stroke="#3F4855"
                  strokeWidth="0.75"
                  opacity="0.3"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
