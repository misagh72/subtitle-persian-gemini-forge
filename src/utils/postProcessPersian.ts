
/**
 * بهبود و تصحیح خودکار ترجمه نهایی فارسی
 * - نیم‌فاصله
 * - علائم نگارشی
 * - حذف فاصله قبل از , و .
 * - تبدیل حروف عربی به فارسی
 */
export function cleanPersianTranslation(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();

  // Replace Arabic ye and ke with Persian
  cleaned = cleaned.replace(/ي/g, "ی").replace(/ك/g, "ک");

  // Normalize multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  // Fix spaces before punctuation
  cleaned = cleaned.replace(/\s+([،,.?!؟؛])/g, "$1");

  // Standardize ellipsis
  cleaned = cleaned.replace(/\.{2,}/g, "…").replace(/\.{3,}/g, "…");

  // Remove space after opening quote or before closing quote
  cleaned = cleaned.replace(/«\s+/g, "«").replace(/\s+»/g, "»");

  // Mid-pause: نیم‌فاصله بعد از می / نمی در افعال  
  cleaned = cleaned.replace(/\b(می|نمی)\s+([\u0600-\u06FF]+)/g, "$1‌$2");

  // Remove repetitive question/exclamation marks
  cleaned = cleaned.replace(/([؟!]){2,}/g, "$1");

  // Trim each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  // Clean line breaks
  cleaned = cleaned.replace(/\n{2,}/g, '\n');

  return cleaned;
}
