'use client'

import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'

export function TournamentLoadingScreen() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with premium gradient background */}
      <div className="border-b border-white/[0.055] bg-gradient-to-b from-surface/80 to-surface/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-5">
            <Skeleton className="h-4 w-20 bg-white/10" />
            <span className="text-muted-foreground/60">/</span>
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>

          {/* Header content with premium spacing */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-9 w-72 mb-4 bg-white/15" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-28 bg-white/10" />
                <Skeleton className="h-5 w-36 bg-white/10" />
              </div>
            </div>
            <div className="hidden sm:flex gap-3">
              <Skeleton className="h-10 w-28 bg-white/10 rounded-md" />
              <Skeleton className="h-10 w-28 bg-white/10 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Tabs skeleton with premium styling */}
        <div className="flex items-center gap-6 mb-8 border-b border-white/[0.055] pb-5">
          <Skeleton className="h-10 w-28 bg-white/15 rounded-md" />
          <Skeleton className="h-10 w-32 bg-white/10 rounded-md" />
          <Skeleton className="h-10 w-24 bg-white/10 rounded-md" />
          <Skeleton className="h-10 w-36 bg-white/10 rounded-md hidden sm:block" />
        </div>

        {/* Content grid with premium spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-7">
          {/* Main content area */}
          <div className="lg:col-span-3 space-y-7">
            {/* Overview cards with gradient borders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/5 to-white/2 p-5 hover:border-white/[0.12] transition-colors">
                  {/* Subtle gradient accent on top */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-400/30 via-cyan-400/10 to-transparent" />
                  <Skeleton className="h-4 w-28 mb-4 bg-white/12" />
                  <Skeleton className="h-9 w-36 bg-white/15" />
                </div>
              ))}
            </div>

            {/* Table skeleton with premium styling */}
            <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/3 to-white/1 divide-y divide-white/[0.05]">
              {/* Subtle accent line at top */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/20 via-emerald-400/5 to-transparent" />
              
              <div className="bg-gradient-to-r from-white/[0.03] to-transparent p-5 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24 bg-white/12" />
                  <Skeleton className="h-4 w-28 bg-white/10" />
                  <Skeleton className="h-4 w-20 bg-white/10 hidden sm:block" />
                </div>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <Skeleton className="h-11 w-11 rounded-full bg-white/12 flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-44 bg-white/15" />
                      <Skeleton className="h-3 w-36 bg-white/10" />
                    </div>
                    <Skeleton className="h-9 w-20 bg-white/12 rounded-md flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton with premium cards */}
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/4 to-white/1 p-5 hover:border-white/[0.12] transition-colors">
                {/* Subtle gradient accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-400/20 via-sky-400/5 to-transparent" />
                <Skeleton className="h-5 w-28 mb-4 bg-white/12" />
                <Skeleton className="h-12 w-full mb-3 bg-white/10 rounded-md" />
                <Skeleton className="h-12 w-full bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium loading indicator with backdrop blur */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Soft glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl" />
          
          {/* Content */}
          <div className="relative flex flex-col items-center gap-4">
            <Spinner className="size-8 text-cyan-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground hidden sm:block">Loading tournament data</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
