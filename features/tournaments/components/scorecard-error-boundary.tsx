'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  playerName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ScorecardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[v0] Scorecard Error:', error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 bg-red-500/10 border border-red-500/30 rounded-md">
          <div className="text-sm text-red-400 mb-3">
            <strong>Scorecard temporarily unavailable</strong>
          </div>
          <div className="text-xs text-red-400/70 mb-4">
            {this.state.error?.message || 'An error occurred while loading the scorecard.'}
          </div>
          <div className="space-y-2 text-xs text-red-400/70">
            <div>Scorecard for: <span className="font-mono">{this.props.playerName}</span></div>
            <div className="font-mono bg-red-500/5 p-2 rounded border border-red-500/20 overflow-auto max-h-24">
              {this.state.error?.stack || 'No error details available'}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
