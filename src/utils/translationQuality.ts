
export interface TranslationQualitySettings {
  genre: 'movie' | 'series' | 'documentary' | 'animation' | 'comedy' | 'drama' | 'action';
  formalityLevel: 'formal' | 'informal' | 'neutral';
  preserveNames: boolean;
  contextualTranslation: boolean;
  qualityCheck: boolean;
}

export interface QualityMetrics {
  score: number;
  issues: string[];
  suggestions: string[];
  lengthRatio: number;
  consistency: number;
}

export class TranslationQualityService {
  static createEnhancedPrompt(texts: string[], settings: TranslationQualitySettings): string {
    const genreContext = this.getGenreContext(settings.genre);
    const formalityInstructions = this.getFormalityInstructions(settings.formalityLevel);
    const preserveNamesInstructions = settings.preserveNames ? this.getNamePreservationInstructions() : '';
    
    const diverseExamples = this.getDiverseExamples();
    const technicalConstraints = this.getTechnicalConstraints();
    const emotionGuidelines = this.getEmotionGuidelines();
    const specialCases = this.getSpecialCases();

    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');

    return `شما یک مترجم بسیار حرفه‌ای زیرنویس فیلم هستید که باید ترجمه‌های دقیق، طبیعی و مناسب برای نمایش ارائه دهید.

**مشخصات پروژه:**
- نوع محتوا: ${genreContext}
- سطح رسمیت: ${formalityInstructions}
${preserveNamesInstructions}

**قوانین کیفیت ترجمه:**
1. **طبیعی بودن**: ترجمه باید مانند گفتار روزمره فارسی باشد
2. **مناسب برای زیرنویس**: حداکثر 42 کاراکتر در هر خط، حداکثر 2 خط
3. **حفظ معنا**: هیچ اطلاعات مهمی نباید حذف شود
4. **سرعت خواندن**: قابل خواندن در 3-4 ثانیه
5. **هماهنگی با لب**: در صورت امکان با حرکت لب همخوانی داشته باشد

${technicalConstraints}

${emotionGuidelines}

${diverseExamples}

${specialCases}

**محدودیت‌های فنی:**
- حداکثر طول خط: 42 کاراکتر
- حداکثر تعداد خط: 2 خط
- سرعت خواندن: 17-21 کاراکتر در ثانیه
- فاصله زمانی حداقل: 1 ثانیه بین زیرنویس‌ها

**متون مورد نظر:**
${textList}

**فرمت پاسخ مطلوب:**
فقط ترجمه فارسی هر جمله، به همان شماره و ترتیب؛ بدون هیچ توضیح اضافی!

**نکته نهایی:** هدف شما تولید زیرنویسی است که بیننده ایرانی بتواند بدون هیچ مشکلی درک کند و احساس کند که فیلم اصلاً فارسی است.`;
  }

  private static getGenreContext(genre: string): string {
    const genreMap = {
      'movie': 'فیلم سینمایی - تمرکز بر جذابیت و روانی',
      'series': 'سریال - تمرکز بر تداوم شخصیت‌ها',
      'documentary': 'مستند - تمرکز بر انتقال دقیق اطلاعات',
      'animation': 'انیمیشن - تمرکز بر زبان ساده و قابل فهم',
      'comedy': 'کمدی - تمرکز بر حفظ طنز و شوخی',
      'drama': 'درام - تمرکز بر انتقال احساسات',
      'action': 'اکشن - تمرکز بر جملات کوتاه و سریع'
    };
    return genreMap[genre as keyof typeof genreMap] || 'عمومی';
  }

  private static getFormalityInstructions(level: string): string {
    const formalityMap = {
      'formal': 'رسمی و ادبی - استفاده از زبان محترمانه و دستور زبان صحیح',
      'informal': 'غیررسمی و صمیمی - استفاده از زبان روزمره و عامیانه مناسب',
      'neutral': 'خنثی - ترکیب متعادل از زبان رسمی و غیررسمی برای عموم مخاطبان'
    };
    return formalityMap[level as keyof typeof formalityMap] || 'خنثی';
  }

  private static getNamePreservationInstructions(): string {
    return `
**راهنمای حفظ نام‌ها:**
- نام اشخاص: همان‌طور که هست (مثل John → جان، Mary → مری)
- نام مکان‌های مشهور: معادل فارسی (New York → نیویورک)
- نام برندها: همان‌طور که هست (Apple → اپل)
- اصطلاحات تخصصی: ترجمه یا توضیح مختصر در صورت نیاز`;
  }

  private static getDiverseExamples(): string {
    return `
**نمونه‌های ترجمه حرفه‌ای:**

**مکالمات روزمره:**
- "How are you doing?" → "حالت چطوره؟"
- "I'll be right back" → "الان برمی‌گردم"
- "What's going on?" → "چه خبره؟"

**جملات عاطفی:**
- "I love you so much" → "خیلی دوست دارم"
- "I'm really worried" → "خیلی نگرانم"
- "This is amazing!" → "این عالیه!"

**دیالوگ‌های اکشن:**
- "Watch out!" → "مواظب باش!"
- "Let's go, now!" → "بریم، الان!"
- "He's getting away!" → "داره فرار می‌کنه!"

**مکالمات رسمی:**
- "I appreciate your help" → "از کمکتون ممنونم"
- "That's unacceptable" → "این قابل قبول نیست"
- "We need to discuss this" → "باید در موردش صحبت کنیم"`;
  }

  private static getTechnicalConstraints(): string {
    return `
**محدودیت‌های تکنیکی زیرنویس:**
- اگر جمله طولانی است، آن را به دو بخش منطقی تقسیم کنید
- از علائم نگارشی مناسب استفاده کنید (. ، ! ؟)
- عدد و تاریخ به صورت فارسی (۱۲۳۴۵۶۷۸۹۰)
- از کلمات اختصاری مناسب استفاده کنید (نمی‌شه، نمی‌تونه)`;
  }

  private static getEmotionGuidelines(): string {
    return `
**راهنمای انتقال احساسات:**
- خشم: استفاده از کلمات قوی‌تر و جملات کوتاه
- غم: استفاده از کلمات ملایم‌تر و ساختار ساده
- شادی: استفاده از کلمات مثبت و انرژی‌بخش
- ترس: استفاده از کلمات تأثیرگذار و فوری
- تعجب: استفاده از علامت تعجب و کلمات تأکیدی`;
  }

  private static getSpecialCases(): string {
    return `
**موارد خاص:**
- کلمات ناسزا: تعدیل مناسب با حفظ مفهوم
- اصطلاحات محلی: معادل فارسی مناسب
- شوخی‌ها: حفظ روح طنز حتی با تغییر کلمات
- مراجع فرهنگی: توضیح مختصر در صورت نیاز
- گفتار سریع: خلاصه‌سازی با حفظ نکات کلیدی`;
  }

  static cleanText(text: string): string {
    return text
      .trim()
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
    
    if (persianRatio < 0.7) {
      issues.push('نسبت کم متن فارسی');
      suggestions.push('اطمینان حاصل کنید که ترجمه به درستی به فارسی انجام شده');
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
    
    translations.forEach((translated, original) => {
      metrics.push(this.validateTranslation(original, translated));
    });

    const avgScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
    const avgLengthRatio = metrics.reduce((sum, m) => sum + m.lengthRatio, 0) / metrics.length;
    const totalIssues = metrics.reduce((sum, m) => sum + m.issues.length, 0);
    const avgConsistency = metrics.reduce((sum, m) => sum + m.consistency, 0) / metrics.length;

    return `گزارش کیفیت ترجمه پیشرفته:
امتیاز کلی: ${avgScore.toFixed(1)}/100
نسبت طول متن: ${avgLengthRatio.toFixed(2)}
تعداد مسائل: ${totalIssues}
سازگاری فارسی: ${avgConsistency.toFixed(1)}%
نوع محتوا: ${settings.genre}
سطح رسمیت: ${settings.formalityLevel}
حفظ نام‌ها: ${settings.preserveNames ? 'فعال' : 'غیرفعال'}`;
  }
}
