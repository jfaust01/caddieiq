'use client'

import { Flag } from 'lucide-react'

interface HoleVisualizationProps {
  courseId: string
  holeNumber: number
  isLoading?: boolean
}

/**
 * Hole Visualization Panel
 *
 * Placeholder for future hole visualization features including:
 * - Interactive hole maps and diagrams
 * - GPS coordinates and layouts
 * - Drone flyovers
 * - Strategy overlays
 * - Hazard visualization
 * - Elevation profiles
 * - 3D models
 *
 * This component is designed to be extensible and support future implementations
 * without requiring changes to parent components.
 */
export function HoleVisualization({
  courseId,
  holeNumber,
  isLoading = false,
}: HoleVisualizationProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Hole Visualization</h3>

      {isLoading ? (
        // Loading skeleton placeholder
        <div className="aspect-video rounded-lg border border-border bg-muted/50 animate-pulse" />
      ) : (
        // Coming Soon placeholder
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card/50 py-12 px-4">
          {/* Icon */}
          <div className="rounded-full bg-primary/10 p-3">
            <Flag className="size-8 text-primary" aria-hidden="true" />
          </div>

          {/* Title */}
          <h4 className="text-base font-semibold text-foreground text-center">
            Hole Visualization
          </h4>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Hole diagrams, GPS layouts, flyovers, and strategy overlays will be
            available in a future release.
          </p>

          {/* Coming Soon badge */}
          <div className="inline-flex items-center rounded-full bg-amber-100/50 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Coming Soon
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * Data contract for future hole visualization implementations.
 *
 * Future versions should support the following data structure:
 *
 * interface HoleVisualizationData {
 *   // GPS Coordinates
 *   teeCoordinates: { latitude: number; longitude: number }
 *   greenCoordinates: { latitude: number; longitude: number }
 *   fairwayPolygon: Array<{ latitude: number; longitude: number }>
 *
 *   // Features
 *   hazards: Hazard[]
 *   water: WaterFeature[]
 *   bunkers: Bunker[]
 *   trees: Tree[]
 *
 *   // Imagery
 *   satelliteImageUrl?: string
 *   droneImageUrl?: string
 *   diagramUrl?: string
 *
 *   // Elevation
 *   elevationProfile?: ElevationProfile
 *   teeElevation?: number
 *   greenElevation?: number
 *
 *   // 3D/Advanced
 *   modelUrl?: string
 *   flyoverVideoUrl?: string
 * }
 *
 * interface Hazard {
 *   id: string
 *   type: 'water' | 'bunker' | 'tree' | 'out-of-bounds' | 'rough'
 *   coordinates: Array<{ latitude: number; longitude: number }>
 *   description?: string
 * }
 */
