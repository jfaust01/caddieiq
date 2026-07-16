'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FileText, Save, Trash2 } from 'lucide-react'

interface WorkspaceNotesProps {
  playerId: string
}

export function WorkspaceNotes({ playerId }: WorkspaceNotesProps) {
  const [notes, setNotes] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`player-notes-${playerId}`)
    if (saved) {
      const { content, timestamp } = JSON.parse(saved)
      setNotes(content)
      setLastSaved(new Date(timestamp))
    }
  }, [playerId])

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes.trim()) {
        setIsSaving(true)
        localStorage.setItem(
          `player-notes-${playerId}`,
          JSON.stringify({ content: notes, timestamp: new Date().toISOString() }),
        )
        setLastSaved(new Date())
        setIsSaving(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [notes, playerId])

  const handleClear = () => {
    if (confirm('Clear all notes?')) {
      setNotes('')
      localStorage.removeItem(`player-notes-${playerId}`)
      setLastSaved(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>Personal Notes</CardTitle>
          </div>
          {lastSaved && <span className="text-xs text-muted-foreground">Saved</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Add your personal analysis notes here... (supports markdown)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[180px] resize-none"
          maxLength={5000}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{notes.length} / 5000 characters</span>
          {lastSaved && <span>{lastSaved.toLocaleTimeString()}</span>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-red-600 dark:text-red-400 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Notes
        </Button>
      </CardContent>
    </Card>
  )
}
