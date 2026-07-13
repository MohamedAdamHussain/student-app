import type { AxiosError } from 'axios'

// =====================================================
// معالجة أخطاء الـ API بشكل موحّد
// =====================================================
// قبل هذا الملف، كان كل صفحة يكتب يدوياً:
//   const e = err as { response?: { data?: { message?: string } }; message?: string }
//   const msg = e?.response?.data?.message ?? e?.message ?? '...'
// الآن: extractApiMessage(err, 'رسالة افتراضية')
//
// الهدف: مصدر واحد لاستخراج رسالة الخطأ من استجابة Laravel،
// مع fallback آمن لكل الحالات (شبكة/ CORS/ مهلة/ غير معروف).

/** شكل جسم خطأ Laravel القياسي (message + errors للتحقق). */
interface LaravelErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

/**
 * استخراج رسالة خطأ صالحة لعرضها للمستخدم من أي خطأ.
 *
 * ترتيب الأولوية:
 * 1. رسالة التحقق (validation) الأولى من Laravel  → `errors[*][0]`
 * 2. الرسالة العامة من Laravel                    → `message`
 * 3. رسالة axios/الشبكة                            → `error.message`
 * 4. الرسالة الافتراضية
 */
export function extractApiMessage(err: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  // 1. أخطاء Axios مع استجابة من الخادم (4xx/5xx)
  const axiosErr = err as AxiosError<LaravelErrorBody>
  const body = axiosErr?.response?.data

  if (body?.errors) {
    const firstValidation = Object.values(body.errors)[0]?.[0]
    if (firstValidation) return firstValidation
  }
  if (body?.message) return body.message

  // 2. رسالة الخطأ نفسها (شبكة/ مهلة/ CORS)
  if (axiosErr?.message) return axiosErr.message

  // 3. أي كائن خطأ عام
  if (err instanceof Error) return err.message

  return fallback
}

/**
 * استخراج أخطاء التحقق (validation) كاملةً كـ Record للحقل → رسائل.
 * تُستخدم لربط أخطاء الحقول بنموذج كامل (مثلاً صفحات التسجيل).
 * تُرجع null لو لم توجد أخطاء تحقق.
 */
export function extractValidationErrors(err: unknown): Record<string, string[]> | null {
  const body = (err as AxiosError<LaravelErrorBody>)?.response?.data
  return body?.errors ?? null
}

/**
 * كود حالة HTTP من خطأ، أو null لو لا يوجد استجابة (شبكة/CORS/مهلة).
 * مفيد لتمييز "لا رد من الخادم" عن رد بخطأ.
 */
export function getErrorStatus(err: unknown): number | null {
  const axiosErr = err as AxiosError
  return axiosErr?.response?.status ?? null
}

/**
 * هل الخطأ بسبب الشبكة/CORS/الخادم مطفأ (لا استجابة HTTP أصلاً)؟
 */
export function isNetworkError(err: unknown): boolean {
  const axiosErr = err as AxiosError
  return !axiosErr?.response && !!axiosErr?.request
}
