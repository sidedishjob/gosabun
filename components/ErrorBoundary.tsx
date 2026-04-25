/**
 * 差分表示領域のランタイムエラーをキャッチして回復 UI を表示するエラーバウンダリ。
 */

"use client"

import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info })
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development"
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
          <p className="text-center text-sm font-medium text-destructive">
            表示中にエラーが発生しました
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            「再試行」を押すか、入力内容を見直してから再度比較してください。
          </p>
          <div className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              再試行
            </Button>
          </div>
          {isDev && this.state.error && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                エラー詳細（開発環境のみ）
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-muted-foreground">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack ?? ""}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
