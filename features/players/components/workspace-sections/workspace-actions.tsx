'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'
import Link from 'next/link'

interface WorkspaceActionsProps {
  playerId: string
  playerName: string
}

export function WorkspaceActions({ playerId, playerName }: WorkspaceActionsProps) {
  const actions = [
    { label: 'Compare Players', href: `/compare?players=${playerId}` },
    { label: 'View Comparison', href: `/compare?players=${playerId}` },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <CardTitle>Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button variant="outline" size="sm" className="w-full justify-start">
              {action.label}
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
