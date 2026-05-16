import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-dvh flex items-center justify-center px-6 bg-gray-50">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-500 text-sm mb-4">
              {this.state.error?.message || "Silakan coba lagi"}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left bg-gray-100 rounded-lg p-3 mb-4 text-xs text-red-600 overflow-auto max-h-32">
                {this.state.error.stack}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-[var(--color-primary)] text-white rounded-xl px-6 py-2.5 font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Muat Ulang
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="border border-gray-200 text-gray-700 rounded-xl px-6 py-2.5 font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
