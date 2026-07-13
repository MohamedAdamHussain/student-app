// =====================================================
// ApiDebug — أداة تشخيص لعرض البيانات الخام من API
// =====================================================
import { useState } from 'react'
import { Bug, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiDebugProps {
  label: string
  rawData?: unknown
  transformedData?: unknown
  expectedFields?: string[]
  error?: unknown
  enabled?: boolean
}

const ENV_ENABLED =
  import.meta.env.VITE_API_DEBUG === 'true' ||
  import.meta.env.DEV === true

export function ApiDebug({
  label,
  rawData,
  transformedData,
  expectedFields,
  error,
  enabled = ENV_ENABLED,
}: ApiDebugProps) {
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  const fieldCheck = expectedFields?.map((field) => {
    const value = (transformedData as any)?.[field]
    const rawKey = field.replace(/[A-Z]/g, (l) => '_' + l.toLowerCase())
    const rawValue = (rawData as any)?.[rawKey]
    return {
      field,
      rawKey,
      present: value !== undefined && value !== null,
      value,
      rawValue,
    }
  })

  const hasError = error !== undefined && error !== null
  const allFieldsPresent = fieldCheck?.every((f) => f.present) ?? true
  const status = hasError ? 'error' : allFieldsPresent ? 'ok' : 'warn'

  return (
    <div
      className={cn(
        'my-2 border rounded-md text-xs overflow-hidden font-mono',
        status === 'error'
          ? 'border-danger/30 bg-danger/5'
          : status === 'warn'
            ? 'border-warning/30 bg-warning/5'
            : 'border-info/30 bg-info/5',
      )}
      dir="ltr"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug size={12} className={status === 'error' ? 'text-danger' : status === 'warn' ? 'text-warning' : 'text-info'} />
          <span className="font-bold text-ink-700 dark:text-ink-200">API DEBUG: {label}</span>
          {status === 'ok' && <CheckCircle2 size={12} className="text-success" />}
          {status === 'warn' && <AlertTriangle size={12} className="text-warning" />}
          {status === 'error' && <AlertTriangle size={12} className="text-danger" />}
          {fieldCheck && (
            <span className="text-ink-500">
              ({fieldCheck.filter((f) => f.present).length}/{fieldCheck.length} fields)
            </span>
          )}
        </div>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="px-3 py-2 border-t border-ink-200 dark:border-ink-700 space-y-2">
          {error !== undefined && error !== null && (
            <div className="text-danger">
              <div className="font-bold mb-1">ERROR:</div>
              <pre className="whitespace-pre-wrap break-words text-[11px]">
                {error instanceof Error
                  ? `${error.message}\n${error.stack ?? ''}`
                  : typeof error === 'object'
                    ? JSON.stringify(error, null, 2)
                    : String(error)}
              </pre>
            </div>
          )}

          {fieldCheck && fieldCheck.length > 0 && (
            <div>
              <div className="font-bold text-ink-700 dark:text-ink-200 mb-1">FIELD CHECK:</div>
              <div className="space-y-1">
                {fieldCheck.map((f) => (
                  <div key={f.field} className="flex items-start gap-2">
                    {f.present ? (
                      <CheckCircle2 size={11} className="text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={11} className="text-warning mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{f.field}</span>
                      <span className="text-ink-400"> (raw: {f.rawKey})</span>
                      <span className={cn('ml-2', f.present ? 'text-success' : 'text-warning')}>
                        {f.present ? '✓ present' : '⚠ MISSING'}
                      </span>
                      <div className="text-ink-500 text-[10px]">
                        value: {JSON.stringify(f.value)}
                      </div>
                      {!f.present && f.rawValue !== undefined && (
                        <div className="text-warning text-[10px]">
                          ⚠ Raw value exists as {f.rawKey} = {JSON.stringify(f.rawValue)} → transform issue
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rawData !== undefined && (
            <div>
              <div className="font-bold text-ink-700 dark:text-ink-200 mb-1">RAW (from Laravel):</div>
              <pre className="whitespace-pre-wrap break-words text-[10px] bg-ink-100 dark:bg-ink-800 p-2 rounded max-h-48 overflow-auto">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}

          {transformedData !== undefined && (
            <div>
              <div className="font-bold text-ink-700 dark:text-ink-200 mb-1">TRANSFORMED (camelCase):</div>
              <pre className="whitespace-pre-wrap break-words text-[10px] bg-ink-100 dark:bg-ink-800 p-2 rounded max-h-48 overflow-auto">
                {JSON.stringify(transformedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
