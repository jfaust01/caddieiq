'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartData {
  name: string
  [key: string]: string | number
}

interface AnalyticsChartsProps {
  tournamentId: string
}

export function AnalyticsCharts({ tournamentId }: AnalyticsChartsProps) {
  const [salaryVsFinish, setSalaryVsFinish] = useState<ChartData[]>([])
  const [ownershipVsFinish, setOwnershipVsFinish] = useState<ChartData[]>([])
  const [weatherImpact, setWeatherImpact] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [tournamentId])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const [salaryRes, ownershipRes, weatherRes] = await Promise.all([
        fetch(`/api/analytics/charts/salary-vs-finish?id=${tournamentId}`),
        fetch(`/api/analytics/charts/ownership-vs-finish?id=${tournamentId}`),
        fetch(`/api/analytics/charts/weather-impact?id=${tournamentId}`),
      ])

      if (salaryRes.ok) setSalaryVsFinish((await salaryRes.json()).data || [])
      if (ownershipRes.ok) setOwnershipVsFinish((await ownershipRes.json()).data || [])
      if (weatherRes.ok) setWeatherImpact((await weatherRes.json()).data || [])
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 h-80">
            <Skeleton className="w-full h-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Salary vs Finish Position */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Salary vs Finish Position</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="salary" name="Salary" />
            <YAxis type="number" dataKey="position" name="Position" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Players" data={salaryVsFinish} fill="#3b82f6" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Ownership vs Finish */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ownership vs Finish</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="ownership" name="Ownership %" />
            <YAxis type="number" dataKey="position" name="Position" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Players" data={ownershipVsFinish} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Weather Impact */}
      <Card className="p-4 md:col-span-2">
        <h3 className="font-semibold mb-4">Weather Impact on Scoring</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weatherImpact} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="windSpeed" label={{ value: 'Wind Speed (mph)', position: 'insideBottomRight', offset: -10 }} />
            <YAxis label={{ value: 'Avg Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgScore" stroke="#ef4444" name="Avg Score" />
            <Line type="monotone" dataKey="sgTotal" stroke="#10b981" name="SG Total" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
