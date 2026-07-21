'use client'

import { Message } from 'ai'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-2xl ${
          isAssistant
            ? 'bg-muted rounded-lg rounded-tl-none'
            : 'bg-primary text-primary-foreground rounded-lg rounded-tr-none'
        } p-4`}
      >
        <div className={`text-sm ${isAssistant ? 'text-foreground' : 'text-white'}`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {isAssistant && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
            <Badge variant="outline" className="text-xs">
              AI Analyst
            </Badge>
            <button
              onClick={handleCopy}
              className="ml-auto p-1 hover:bg-accent rounded transition-colors"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
