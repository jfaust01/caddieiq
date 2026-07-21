'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRef, useEffect } from 'react'
import { Loader2, Send, RotateCcw } from 'lucide-react'
import { ChatMessage } from './chat-message'

export function AiGolfAnalystInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } = useChat({
    api: '/api/analyst/chat',
  })

  // Set initial message only once
  const initialMessageSet = messages.length === 0

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize with greeting message if no messages exist
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            'Hey! I\'m your AI Golf Analyst, powered by CaddieIQ data. Ask me anything about this week\'s tournament:\n\n• Compare two players\n• Suggest value plays\n• Explain weather impact\n• Analyze ownership\n• Identify risky pivots\n\nWhat would you like to know?',
        },
      ])
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          'Hey! I\'m your AI Golf Analyst, powered by CaddieIQ data. Ask me anything about this week\'s tournament:\n\n• Compare two players\n• Suggest value plays\n• Explain weather impact\n• Analyze ownership\n• Identify risky pivots\n\nWhat would you like to know?',
      },
    ])
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={input || ''}
                onChange={handleInputChange}
                placeholder="Ask about players, value plays, weather impact, ownership..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !(input && input.trim())}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              {isLoading && (
                <Button onClick={stop} variant="outline" size="icon">
                  Stop
                </Button>
              )}
              {messages.length > 1 && (
                <Button onClick={handleReset} variant="outline" size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <QuickAction
              label="Compare Players"
              prompt="Compare Scottie vs Rory this week"
              onSelect={(text) => {
                handleInputChange({ target: { value: text } } as any)
              }}
            />
            <QuickAction
              label="Best Value"
              prompt="Who are the best value plays this week?"
              onSelect={(text) => {
                handleInputChange({ target: { value: text } } as any)
              }}
            />
            <QuickAction
              label="Weather Impact"
              prompt="Which players benefit from the forecasted weather?"
              onSelect={(text) => {
                handleInputChange({ target: { value: text } } as any)
              }}
            />
            <QuickAction
              label="Ownership"
              prompt="Who will likely be under-owned?"
              onSelect={(text) => {
                handleInputChange({ target: { value: text } } as any)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface QuickActionProps {
  label: string
  prompt: string
  onSelect: (text: string) => void
}

function QuickAction({ label, prompt, onSelect }: QuickActionProps) {
  return (
    <button
      onClick={() => onSelect(prompt)}
      className="px-3 py-2 text-sm font-medium text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {label}
    </button>
  )
}
