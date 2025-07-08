export interface TranslationQualitySettings {
  genre: 'movie' | 'series' | 'documentary' | 'animation' | 'comedy' | 'drama' | 'action';
  formalityLevel: 'formal' | 'informal' | 'neutral';
  preserveNames: boolean;
  contextualTranslation: boolean;
  qualityCheck: boolean;
  useTranslationContext: boolean;
}

export interface QualityMetrics {
  score: number;
  issues: string[];
  suggestions: string[];
  lengthRatio: number;
  consistency: number;
}

export class TranslationQualityService {
  static createEnhancedPrompt(texts: string[], settings: TranslationQualitySettings, translationContext?: string): string {
    const genreContext = this.getGenreContext(settings.genre);
    const formalityInstructions = this.getFormalityInstructions(settings.formalityLevel);

    const textList = texts.map(text => `${text}`).join('\n---\n');
    
    const translationContextSection = settings.useTranslationContext && translationContext
      ? `
📚 **Context از ترجمه‌های قبلی:**
${translationContext}

**مهم:** از این context برای حفظ consistency در نام‌ها، اصطلاحات و سبک ترجمه استفاده کن.
`
      : '';

    return `سلام رفیق! 😊

می‌خوام کمکم کنی این زیرنویس‌ها رو به فارسی ترجمه کنم. فقط یه چیزی مهمه - باید طبیعی و خودمونی بشه، نه مثل کتاب درسی!

**درباره فیلم/سریال:**
- نوع محتوا: ${genreContext}
- سبک گفتگو: ${formalityInstructions}

**نکته مهم:** 
همه چی رو به فارسی ترجمه کن! حتی اسم‌ها و برندها. مثل:
- John → جان، Mike → مایک  
- Google → گوگل، Facebook → فیسبوک
- New York → نیویورک، London → لندن

**مثال‌هایی از ترجمه خوب:**
"Hey dude, what's up?" → "سلام داداش، چه خبر؟"
"Let's grab coffee at Starbucks" → "بیا بریم استارباکس قهوه بخوریم"
"I'm working at Microsoft" → "تو مایکروسافت کار می‌کنم"

${translationContextSection}
**قوانین زیرنویس:**
- حداکثر ۴۲ حرف هر خط
- حداکثر ۲ خط
- باید سریع خونده بشه

**متن‌هایی که باید ترجمه کنی:**
${textList}

**خیلی مهم:** فقط ترجمه‌های فارسی رو بنویس، هر خط ترجمه رو با خط جدید جدا کن. هیچ شماره یا توضیح اضافی نده!`;
  }

  private static getGenreContext(genre: string): string {
    const genreMap = {
      'movie': 'فیلم سینمایی',
      'series': 'سریال',
      'documentary': 'مستند',
      'animation': 'انیمیشن',
      'comedy': 'کمدی',
      'drama': 'درام',
      'action': 'اکشن'
    };
    return genreMap[genre as keyof typeof genreMap] || 'عمومی';
  }

  private static getFormalityInstructions(level: string): string {
    const formalityMap = {
      'formal': 'رسمی و مؤدبانه',
      'informal': 'غیررسمی و صمیمی',
      'neutral': 'متعادل'
    };
    return formalityMap[level as keyof typeof formalityMap] || 'متعادل';
  }

  static cleanText(text: string): string {
    return text
      .trim()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
      .replace(/^[۰-۹]+\.\s*/, '') // Remove Persian numbers too
      .replace(/\s+/g, ' ')
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\s\w\d\p{P}]/gu, '')
      .replace(/\.{2,}/g, '...')
      .replace(/\?{2,}/g, '?')
      .replace(/!{2,}/g, '!');
  }

  static validateTranslation(original: string, translated: string): QualityMetrics {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for untranslated English words
    const englishWords = translated.match(/[a-zA-Z]+/g);
    if (englishWords && englishWords.length > 0) {
      issues.push(`کلمات انگلیسی ترجمه نشده: ${englishWords.join(', ')}`);
      suggestions.push('همه کلمات انگلیسی باید ترجمه شوند');
    }
    
    // Check for numbers at the beginning
    if (/^\d+\./.test(translated) || /^[۰-۹]+\./.test(translated)) {
      issues.push('شماره‌گذاری اضافی در ابتدای ترجمه');
      suggestions.push('اعداد اضافی را حذف کنید');
    }
    
    // Check length ratio
    const lengthRatio = translated.length / original.length;
    if (lengthRatio > 1.5) {
      issues.push('ترجمه بیش از حد طولانی است');
      suggestions.push('سعی کنید ترجمه را کوتاه‌تر کنید');
    } else if (lengthRatio < 0.5) {
      issues.push('ترجمه بیش از حد کوتاه است');
      suggestions.push('ممکن است بخشی از معنا از دست رفته باشد');
    }

    // Check for subtitle length constraints
    const lines = translated.split('\n');
    if (lines.length > 2) {
      issues.push('تعداد خطوط بیش از حد مجاز (2 خط)');
      suggestions.push('جمله را به حداکثر 2 خط کوتاه کنید');
    }
    
    lines.forEach((line, index) => {
      if (line.length > 42) {
        issues.push(`خط ${index + 1} بیش از 42 کاراکتر است`);
        suggestions.push(`خط ${index + 1} را کوتاه‌تر کنید`);
      }
    });

    // Check for proper Persian text
    const persianChars = (translated.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = translated.replace(/\s/g, '').length;
    const persianRatio = persianChars / totalChars;
    
    if (persianRatio < 0.9) {
      issues.push('نسبت کم متن فارسی - ممکن است کلماتی ترجمه نشده باشند');
      suggestions.push('اطمینان حاصل کنید که همه کلمات به فارسی ترجمه شده‌اند');
    }

    // Check for reading speed (17-21 chars per second is optimal)
    const readingTime = translated.length / 19; // Average 19 chars per second
    if (readingTime > 4) {
      issues.push('زمان خواندن بیش از حد مجاز');
      suggestions.push('متن را برای خواندن سریع‌تر کوتاه کنید');
    }

    // Calculate score (0-100)
    let score = 100;
    score -= issues.length * 12;
    if (lengthRatio > 1.2 || lengthRatio < 0.8) score -= 8;
    if (lines.length > 2) score -= 15;
    if (englishWords && englishWords.length > 0) score -= 25; // Heavy penalty for untranslated words
    if (/^\d+\./.test(translated) || /^[۰-۹]+\./.test(translated)) score -= 20; // Penalty for numbers
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      suggestions,
      lengthRatio,
      consistency: persianRatio * 100
    };
  }

  static generateQualityReport(translations: Map<string, string>, settings: TranslationQualitySettings): string {
    const metrics: QualityMetrics[] = [];
    let totalUntranslatedWords = 0;
    let totalNumberedTranslations = 0;
    
    translations.forEach((translated, original) => {
      const metric = this.validateTranslation(original, translated);
      metrics.push(metric);
      
      // Count untranslated English words
      const englishWords = translated.match(/[a-zA-Z]+/g);
      if (englishWords) {
        totalUntranslatedWords += englishWords.length;
      }
      
      // Count numbered translations
      if (/^\d+\./.test(translated) || /^[۰-۹]+\./.test(translated)) {
        totalNumberedTranslations++;
      }
    });

    const avgScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
    const avgLengthRatio = metrics.reduce((sum, m) => sum + m.lengthRatio, 0) / metrics.length;
    const totalIssues = metrics.reduce((sum, m) => sum + m.issues.length, 0);
    const avgConsistency = metrics.reduce((sum, m) => sum + m.consistency, 0) / metrics.length;

    return `گزارش کیفیت ترجمه:
امتیاز کلی: ${avgScore.toFixed(1)}/100
نسبت طول متن: ${avgLengthRatio.toFixed(2)}
تعداد مسائل: ${totalIssues}
کلمات ترجمه نشده: ${totalUntranslatedWords}
ترجمه‌های شماره‌دار: ${totalNumberedTranslations}
سازگاری فارسی: ${avgConsistency.toFixed(1)}%
نوع محتوا: ${settings.genre}
سطح رسمیت: ${settings.formalityLevel}
وضعیت ترجمه: ${totalUntranslatedWords === 0 && totalNumberedTranslations === 0 ? '✅ کامل' : '❌ ناکامل'}`;
  }
}
