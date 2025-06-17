
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

    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');

    return `سلام! تو یه مترجم زیرنویس حرفه‌ای هستی و کارت اینه که زیرنویس‌های انگلیسی رو به فارسی طبیعی و روان ترجمه کنی.

**چی باید بدونی:**
- نوع فیلم/سریال: ${genreContext}
- سبک زبان: ${formalityInstructions}

**راز ترجمه عالی:**
هر کلمه انگلیسی باید معادل فارسی داشته باشه! هیچ چیز نباید انگلیسی باقی بمونه.

**مثال‌های عملی:**
- "Hey John, how's it going?" → "سلام جان، چطوری؟"
- "Let's grab some coffee at Starbucks" → "بیا بریم استارباکس قهوه بخوریم"
- "I work at Google as a software engineer" → "تو گوگل کار می‌کنم، مهندس نرم‌افزارم"
- "Can you download the app?" → "می‌تونی اپ رو دانلود کنی؟"

**اسم‌ها رو چطور ترجمه کنم:**
- اسم آدم‌ها: John → جان، Mary → مری، Mike → مایک
- اسم مکان‌ها: New York → نیویورک، Paris → پاریس
- برندها: Apple → اپل، Microsoft → مایکروسافت
- کلمات تخصصی: software → نرم‌افزار، internet → اینترنت

**قوانین مهم زیرنویس:**
✅ حداکثر 42 حرف در هر خط
✅ حداکثر 2 خط
✅ باید تو 3-4 ثانیه خونده بشه
✅ طبیعی و روان باشه

**توجه کن:**
- اگه جمله طولانیه، شکستش کن
- از کلمات کوتاه‌تر استفاده کن
- احساس جمله رو حفظ کن
- زبان روزمره استفاده کن

**متن‌هایی که باید ترجمه کنی:**
${textList}

**مهم:** فقط ترجمه‌های فارسی رو به همین ترتیب بنویس، هیچ توضیح اضافی نده!`;
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
    
    translations.forEach((translated, original) => {
      const metric = this.validateTranslation(original, translated);
      metrics.push(metric);
      
      // Count untranslated English words
      const englishWords = translated.match(/[a-zA-Z]+/g);
      if (englishWords) {
        totalUntranslatedWords += englishWords.length;
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
سازگاری فارسی: ${avgConsistency.toFixed(1)}%
نوع محتوا: ${settings.genre}
سطح رسمیت: ${settings.formalityLevel}
وضعیت ترجمه: ${totalUntranslatedWords === 0 ? '✅ کامل' : '❌ ناکامل'}`;
  }
}
