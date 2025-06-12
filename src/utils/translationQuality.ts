
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
    
    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');
    
    return `شما یک مترجم حرفه‌ای زیرنویس هستید. لطفاً متن‌های زیر را از هر زبانی که هستند به فارسی ترجمه کنید.

**مشخصات پروژه:**
- نوع محتوا: ${genreContext}
- سطح رسمیت: ${formalityInstructions}
${preserveNamesInstructions}

**قوانین مهم ترجمه:**
1. ترجمه باید طبیعی، روان و مناسب برای زیرنویس باشد
2. از کلمات ساده و قابل فهم استفاده کنید
3. طول ترجمه نباید بیش از 20% از متن اصلی تفاوت داشته باشد
4. در صورت وجود اصطلاحات خاص، معادل فارسی مناسب استفاده کنید
5. حالت و احساس متن اصلی را حفظ کنید
6. از نوشتن توضیحات اضافی خودداری کنید

**متن‌های مورد نظر:**
${textList}

**فرمت پاسخ:**
لطفاً پاسخ خود را دقیقاً به همین فرمت ارائه دهید:
1. [ترجمه فارسی متن اول]
2. [ترجمه فارسی متن دوم]
...

فقط ترجمه را بنویسید، توضیح اضافی ندهید.`;
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
      'formal': 'رسمی و ادبی - از زبان محترمانه و رسمی استفاده کنید',
      'informal': 'غیررسمی و صمیمی - از زبان روزمره و ساده استفاده کنید',
      'neutral': 'خنثی - ترکیبی از زبان رسمی و غیررسمی مناسب برای عموم'
    };
    return formalityMap[level as keyof typeof formalityMap] || 'خنثی';
  }

  private static getNamePreservationInstructions(): string {
    return `
**حفظ نام‌ها:**
- نام اشخاص، مکان‌ها، برندها و اصطلاحات خاص را حفظ کنید
- در صورت نیاز به ترجمه نام مکان‌ها، معادل فارسی شناخته شده استفاده کنید
- نام‌های اشخاص را همان‌طور که هست نگه دارید`;
  }

  static cleanText(text: string): string {
    return text
      .trim()
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix Persian/Arabic characters
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      // Remove unwanted characters that might interfere with subtitle formatting
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\s\w\d\p{P}]/gu, '')
      // Normalize punctuation
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

    // Check for common issues
    if (translated.includes('...')) {
      if ((translated.match(/\.\.\./g) || []).length > 1) {
        issues.push('استفاده بیش از حد از نقطه چین');
      }
    }

    // Check for proper Persian text
    const persianChars = (translated.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = translated.replace(/\s/g, '').length;
    const persianRatio = persianChars / totalChars;
    
    if (persianRatio < 0.7) {
      issues.push('نسبت کم متن فارسی');
      suggestions.push('اطمینان حاصل کنید که ترجمه به درستی به فارسی انجام شده');
    }

    // Calculate score (0-100)
    let score = 100;
    score -= issues.length * 15;
    if (lengthRatio > 1.2 || lengthRatio < 0.8) score -= 10;
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

    return `گزارش کیفیت ترجمه:
امتیاز کلی: ${avgScore.toFixed(1)}/100
نسبت طول متن: ${avgLengthRatio.toFixed(2)}
تعداد مسائل: ${totalIssues}
نوع محتوا: ${settings.genre}
سطح رسمیت: ${settings.formalityLevel}`;
  }
}
