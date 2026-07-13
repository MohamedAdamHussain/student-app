import { toast } from 'sonner'

// =====================================================
// التحقق الموحّد من الملفات المرفوعة
// =====================================================
// قبل هذا الملف، كان كل صفحة يكرّر:
//   if (file.type !== 'application/pdf') { toast.error('...'); return }
//   if (file.size > 5 * 1024 * 1024) { toast.error('...'); return }
// الآن: validateFile(file, { types: [...], maxSizeMB: 5, label: 'السيرة الذاتية' })

export interface FileValidationOptions {
  /** أنواع MIME المسموحة، مثلاً ['application/pdf'] أو ['image/jpeg','image/png'] */
  types: string[]
  /** الحد الأقصى للحجم بالميجابايت */
  maxSizeMB: number
  /** اسم الملف كما يظهر للمستخدم، يُستخدم في رسائل الخطأ */
  label: string
}

/**
 * التحقق من نوع وحجم ملف مرفوع، مع عرض رسالة toast مناسبة عند الفشل.
 *
 * @returns true لو الملف صالح، false لو رُفض (مع toast مُعرض بالفعل).
 * نمط الـ boolean يجعل الاستخدام بسيطاً مع `return` مباشر في الـ handlers.
 *
 * @example
 * const handleCvChange = (e) => {
 *   const file = e.target.files?.[0]
 *   if (!file || !validateFile(file, { types: ['application/pdf'], maxSizeMB: 5, label: 'السيرة الذاتية' })) return
 *   setCvFile(file)
 * }
 */
export function validateFile(file: File, opts: FileValidationOptions): boolean {
  if (!opts.types.includes(file.type)) {
    toast.error(`${opts.label}: الصيغة غير مدعومة`)
    return false
  }
  if (file.size > opts.maxSizeMB * 1024 * 1024) {
    toast.error(`${opts.label}: الحد الأقصى للحجم ${opts.maxSizeMB}MB`)
    return false
  }
  return true
}

/**
 * استخراج امتداد الملف (بدون النقطة) بأحرف صغيرة.
 * يُستخدم كـ fallback للتحقق من النوع عند عدم تطابق MIME type.
 */
export function getFileExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}
