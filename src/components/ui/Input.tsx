import { forwardRef, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, required, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="mb-5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink-900 dark:text-ink-100 mb-1.5">
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <input ref={ref} id={inputId} className={cn('form-input', className)} {...props} />
        {hint && <p className="text-xs text-ink-400 mt-1.5">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const textareaId = id ?? props.name
    return (
      <div className="mb-5">
        {label && (
          <label htmlFor={textareaId} className="block text-[13px] font-semibold text-ink-900 dark:text-ink-100 mb-1.5">
            {label}
          </label>
        )}
        <textarea ref={ref} id={textareaId} className={cn('form-textarea', className)} {...props} />
        {hint && <p className="text-xs text-ink-400 mt-1.5">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  required?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, required, id, children, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <div className="mb-5">
        {label && (
          <label htmlFor={selectId} className="block text-[13px] font-semibold text-ink-900 dark:text-ink-100 mb-1.5">
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <select ref={ref} id={selectId} className={cn('form-select', className)} {...props}>
          {children}
        </select>
        {hint && <p className="text-xs text-ink-400 mt-1.5">{hint}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
