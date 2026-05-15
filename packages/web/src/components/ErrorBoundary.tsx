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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="px-4 py-8 text-center">
          <p className="text-red-500 text-sm mb-2">Terjadi kesalahan</p>
          <p className="text-gray-400 text-xs">{this.state.error?.message || "Silakan coba lagi"}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 text-[var(--color-primary)] text-sm font-medium"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}