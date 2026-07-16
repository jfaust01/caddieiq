"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CaddieAnswerCard } from "@/features/caddie/components/caddie-answer-card"
import type { CaddieAnswer, CaddieMessage } from "@/lib/caddie/types"

const STARTER_PROMPTS = [
  "Best cash plays?",
  "Who's underpriced?",
  "Who fits the course?",
  "Who's in form?",
  "How does weather affect play?",
] as const

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `msg-${Date.now()}-${idCounter}`
}

interface CaddieChatProps {
  tournamentId: string
  /** Compact mode trims spacing/height for the Command Center widget. */
  compact?: boolean
  className?: string
}

/**
 * AI Caddie chat surface. Sends questions to /api/caddie and renders the
 * deterministic, grounded answers. Shared by the full /caddie page and the
 * Command Center widget (via `compact`).
 */
export function CaddieChat({ tournamentId, compact = false, className }: CaddieChatProps) {
  const [messages, setMessages] = useState<CaddieMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isLoading])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || isLoading) return

      setError(null)
      setInput("")
      const userMessage: CaddieMessage = {
        id: nextId(),
        role: "user",
        text: question,
        answer: null,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const res = await fetch("/api/caddie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId, message: question }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? "The Caddie couldn't answer that right now.")
        }
        const data = (await res.json()) as { answer: CaddieAnswer }
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "caddie",
            text: data.answer.summary,
            answer: data.answer,
            createdAt: new Date().toISOString(),
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, tournamentId],
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Respect CJK IME composition and Safari's unreliable final event.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void send(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className={cn("flex flex-col", compact ? "h-[420px]" : "h-[600px]", className)}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Caddie conversation"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-6 text-primary" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Ask the AI Caddie</p>
              <p className="max-w-xs text-sm text-muted-foreground text-pretty">
                Every answer is grounded in CaddieIQ&apos;s verified engines and names its source.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-1">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex flex-col gap-2">
                  {message.answer && <CaddieAnswerCard answer={message.answer} />}
                  {message.answer && message.answer.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.answer.followUps.map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          onClick={() => void send(followUp)}
                          className="rounded-4xl border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {isLoading && (
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
                Consulting the engines…
              </div>
            )}
          </div>
        )}
      </div>

      {isEmpty && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-3">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void send(prompt)}
              className="rounded-4xl border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="px-1 pb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <form
        className="flex items-end gap-2 border-t border-border pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          void send(input)
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about cash plays, course fit, form, weather…"
          rows={1}
          className="max-h-32 min-h-10 resize-none"
          aria-label="Ask the AI Caddie a question"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  )
}
