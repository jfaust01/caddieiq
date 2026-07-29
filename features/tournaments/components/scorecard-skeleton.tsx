'use client'

/**
 * Skeleton loading component for scorecard
 * Displays placeholder content while scorecard data is loading
 */
export function ScorecardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-0 animate-pulse">
      {/* Round Selector Skeleton */}
      <div className="flex-shrink-0 px-4 py-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((round) => (
            <div
              key={round}
              className="px-3 py-2 rounded-lg bg-white/10 w-12 h-9"
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto mt-5">
        <div className="min-w-0">
          <div className="min-w-0 flex flex-col gap-4">
            {/* Front 9 Skeleton */}
            <div className="min-w-0 flex flex-col gap-2">
              <div className="h-6 w-24 bg-white/10 rounded" />
              <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-white/[0.02]">
                {/* Header row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={hole} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Par row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`par-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Score row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`score-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* PTS row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`pts-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Out Total */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05] bg-white/[0.05]">
                  <div className="col-span-1 p-2">
                    <div className="h-4 bg-white/10 rounded w-full" />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={`out-${i}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Back 9 Skeleton */}
            <div className="min-w-0 flex flex-col gap-2">
              <div className="h-6 w-24 bg-white/10 rounded" />
              <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-white/[0.02]">
                {/* Header row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05]">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((hole) => (
                    <div key={hole} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Par row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`par-back-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Score row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`score-back-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* PTS row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                    <div key={`pts-back-${hole}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* In and Total rows */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05] bg-white/[0.05]">
                  <div className="col-span-1 p-2">
                    <div className="h-4 bg-white/10 rounded w-full" />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={`in-${i}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="grid grid-cols-9 divide-x divide-white/[0.05] border-t border-white/[0.05] bg-white/[0.05]">
                  <div className="col-span-1 p-2">
                    <div className="h-4 bg-white/10 rounded w-full" />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={`tot-${i}`} className="p-2 text-center">
                      <div className="h-4 bg-white/10 rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend Skeleton */}
            <div className="pt-2">
              <div className="flex gap-4 text-xs text-muted-foreground">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Strip Skeleton */}
            <div className="grid grid-cols-8 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] divide-x divide-white/[0.05]">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center py-3 px-2">
                  <div className="h-4 w-12 bg-white/10 rounded mb-2" />
                  <div className="h-5 w-8 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
