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
    // Prompt with explicit subtitle and context-aware instructions and examples
    const genreContext = this.getGenreContext(settings.genre);
    const formalityInstructions = this.getFormalityInstructions(settings.formalityLevel);
    const preserveNamesInstructions = settings.preserveNames ? this.getNamePreservationInstructions() : '';
    const examples = `
    **چند مثال ترجمه زیرنویس حرفه‌ای:**
    1. Original: How are you doing?
       ترجمه: حالت چطوره؟
    2. Original: I'm not sure about this.
       ترجمه: مطمئن نیستم از این کار.
    3. Original: Let's get out of here!
       ترجمه: بیا بریم از اینجا!
    4. Original: What did you say?
       ترجمه: چی گفتی؟
    `;

    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');

    return `شما یک مترجم بسیار حرفه‌ای زیرنویس فیلم هستید و باید جملات کوتاه و طبیعی و دقیق ارائه دهید. لطفاً جملات زیر را از هر زبانی به فارسی ترجمه کنید.

**مشخصات پروژه:**
- نوع محتوا: ${genreContext}
- سطح رسمیت: ${formalityInstructions}
${preserveNamesInstructions}

**قوانین لازم:**
1. ترجمه باید بسیار طبیعی، روان و مختصر (مانند زیرنویس حرفه‌ای فیلم و سریال ایرانی) باشد
2. طول ترجمه از متن اصلی نباید بیشتر از ۲۰٪ بیشتر یا کمتر باشد
3. اسم افراد، مکان‌ها، برندها و اصطلاحات خاص را تغییر ندهید
4. از گفتار روزمره و عامیانه مناسب با موقعیت استفاده کنید
5. سبک و حس جملات اصلی را حفظ کنید (طنز، عصبانیت، جدیت و ...)
6. توضیح اضافه ننویسید و فقط خود ترجمه هر جمله را به همان ترتیب ارائه دهید 

${examples}

**متون مورد نظر:**
${textList}

**فرمت پاسخ:**
فقط ترجمه فارسی هر جمله، به همان شماره و ترتیب؛ بدون هیچ توضیح اضافی!`;
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
    // Use new post-processing util for improved cleaning:
    // (existing logic will remain for backward compatibility)
    // This will be used in post-translate step as well.
    // usage in components: import { cleanPersianTranslation } from './postProcessPersian'
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
