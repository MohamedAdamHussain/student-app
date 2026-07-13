import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ✨ P2-3: ErrorBoundary
 *
 * يلتقط أي runtime error في الـ children المعروضين ويمنع
 * تساقط التطبيق كاملاً. يعرض fallback UI مع زر إعادة تحميل.
 *
 * الاستخدام:
 *   <ErrorBoundary>
 *     <AppRoutes />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // ✨ في الإنتاج، أرسل لـ Sentry / Bugsnag هنا
    console.error('🚨 ErrorBoundary caught:', error, info)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-soft grid place-items-center">
            <AlertTriangle size={26} className="text-danger" />
          </div>

          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-2">
            حدث خطأ غير متوقع
          </h1>

          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
            نعتذر عن الإزعاج. حاول تحديث الصفحة، ولو تكرر الخطأ
            تواصل مع الدعم الفني.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details className="mb-5 text-right">
              <summary className="text-xs text-ink-400 cursor-pointer mb-2">
                تفاصيل الخطأ (وضع التطوير)
              </summary>
              <pre className="text-[11px] text-danger bg-danger-soft p-3 rounded overflow-auto max-h-40" dir="ltr">
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm font-semibold bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-200 rounded-md hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors"
            >
              <RefreshCw size={14} />
              تحديث الصفحة
            </button>
          </div>
        </div>
      </div>
    )
  }
}
