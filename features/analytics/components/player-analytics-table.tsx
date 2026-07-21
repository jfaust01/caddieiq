'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface PlayerAnalytics {
  id: string
  firstName: string
  lastName: string
  salary: number
  projection: number
  ownership: number
  vegasOdds: number
  recentForm: number
  courseHistory: number
  weatherRating: number
  valueRating: number
  riskRating: number
  confidence: number
}

type SortField = keyof PlayerAnalytics
type SortOrder = 'asc' | 'desc'

interface PlayerAnalyticsTableProps {
  tournamentId: string
  onPlayerSelect?: (playerId: string) => void
}

export function PlayerAnalyticsTable({ tournamentId }: PlayerAnalyticsTableProps) {
  const [players, setPlayers] = useState<PlayerAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('valueRating')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchPlayers()
  }, [tournamentId])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/players?tournamentId=${tournamentId}`)
      const data = await response.json()
      setPlayers(data.data || [])
    } catch (error) {
      console.error('Failed to fetch players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = a[sortField] || 0
    const bVal = b[sortField] || 0
    const multiplier = sortOrder === 'asc' ? 1 : -1
    return (aVal > bVal ? 1 : -1) * multiplier
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-foreground" />
    ) : (
      <ChevronDown className="w-3 h-3 text-foreground" />
    )
  }

  const getValueColor = (value: number, type: 'rating' | 'odds' | 'percentage') => {
    if (type === 'rating') {
      if (value >= 0.75) return 'text-green-500'
      if (value >= 0.5) return 'text-yellow-500'
      return 'text-red-500'
    }
    return ''
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Player</th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('salary')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Salary</span>
                  <SortIcon field="salary" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('projection')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Projection</span>
                  <SortIcon field="projection" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('ownership')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Ownership</span>
                  <SortIcon field="ownership" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('vegasOdds')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Odds</span>
                  <SortIcon field="vegasOdds" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('recentForm')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Form</span>
                  <SortIcon field="recentForm" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('courseHistory')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Course Fit</span>
                  <SortIcon field="courseHistory" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('weatherRating')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Weather</span>
                  <SortIcon field="weatherRating" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('valueRating')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Value</span>
                  <SortIcon field="valueRating" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('riskRating')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Risk</span>
                  <SortIcon field="riskRating" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('confidence')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span>Conf</span>
                  <SortIcon field="confidence" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, idx) => (
              <tr
                key={player.id}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/analytics/players/${player.id}`}
                    className="font-medium hover:underline text-blue-500 hover:text-blue-600"
                  >
                    {player.firstName} {player.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  ${player.salary.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {player.projection.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right">
                  {player.ownership.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {(player.vegasOdds / 100).toFixed(1)}%
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getValueColor(player.recentForm, 'rating')}`}>
                  {(player.recentForm * 100).toFixed(0)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getValueColor(player.courseHistory, 'rating')}`}>
                  {(player.courseHistory * 100).toFixed(0)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getValueColor(player.weatherRating, 'rating')}`}>
                  {(player.weatherRating * 100).toFixed(0)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${getValueColor(player.valueRating, 'rating')}`}>
                  {(player.valueRating * 100).toFixed(0)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${getValueColor(player.riskRating, 'rating')}`}>
                  {(player.riskRating * 100).toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {(player.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
