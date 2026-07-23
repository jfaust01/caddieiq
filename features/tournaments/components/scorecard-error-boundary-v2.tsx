'use client'

import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

interface ScorecardErrorBoundaryV2Props {
  children: ReactNode
  fallback?: ReactNode
  playerName?: string
}

interface ScorecardErrorBoundaryV2State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ScorecardErrorBoundaryV2 extends Component<
  ScorecardErrorBoundaryV2Props,
  ScorecardErrorBoundaryV2State
> {
  constructor(props: ScorecardErrorBoundaryV2Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ScorecardErrorBoundaryV2State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SCORECARD ERROR BOUNDARY]', {
      playerName: this.props.playerName,
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    })
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-500/10 border border-red-500 rounded">
            <div className="text-sm font-mono text-red-600">
              Scorecard Error for {this.props.playerName}
            </div>
            <div className="text-xs text-red-500 mt-2">
              {this.state.error?.message}
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
