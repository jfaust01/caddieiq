export function WeatherCourseCard() {
  return (
    <div className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-4">
        Weather & Course Conditions
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Weather */}
        <div className="rounded-lg border border-white/[0.055] bg-white/[0.03] p-4">
          <div className="text-center">
            <p className="text-3xl mb-2">☀️</p>
            <p className="text-2xl font-bold text-white">72°F</p>
            <p className="text-xs text-white/60 mt-1">Sunny</p>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Wind</span>
              <span className="text-white font-semibold">9 mph SE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Humidity</span>
              <span className="text-white font-semibold">64%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Visibility</span>
              <span className="text-white font-semibold">10 mi</span>
            </div>
          </div>
        </div>

        {/* Course */}
        <div className="rounded-lg border border-white/[0.055] bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white mb-3">Detroit Golf Club</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Par</span>
              <span className="text-white font-semibold">72</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Yardage</span>
              <span className="text-white font-semibold">7,370 yds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Conditions</span>
              <span className="text-emerald-400 font-semibold">Firm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Pressure</span>
              <span className="text-white font-semibold">29.91 in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
