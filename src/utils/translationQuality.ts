
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
    
    const completeTranslationGuidelines = this.getCompleteTranslationGuidelines();
    const nameTranslationRules = this.getNameTranslationRules();
    const technicalConstraints = this.getTechnicalConstraints();
    const emotionGuidelines = this.getEmotionGuidelines();
    const diverseExamples = this.getDiverseExamples();
    const specialCases = this.getSpecialCases();

    const textList = texts.map((text, index) => `${index + 1}. ${text}`).join('\n');

    return `شما یک مترجم حرفه‌ای زیرنویس هستید که باید **همه چیز را به فارسی ترجمه کنید**. هیچ کلمه‌ای نباید بدون ترجمه باقی بماند.

**مشخصات پروژه:**
- نوع محتوا: ${genreContext}
- سطح رسمیت: ${formalityInstructions}

${completeTranslationGuidelines}

${nameTranslationRules}

**قوانین کیفیت ترجمه:**
1. **ترجمه کامل**: هر کلمه انگلیسی باید معادل فارسی داشته باشد
2. **طبیعی بودن**: ترجمه باید مانند گفتار روزمره فارسی باشد
3. **مناسب برای زیرنویس**: حداکثر 42 کاراکتر در هر خط، حداکثر 2 خط
4. **حفظ معنا**: مفهوم اصلی حفظ شود ولی همه کلمات ترجمه شوند
5. **سرعت خواندن**: قابل خواندن در 3-4 ثانیه

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
فقط ترجمه کامل فارسی هر جمله، به همان شماره و ترتیب؛ بدون هیچ توضیح اضافی!

**نکته مهم:** هیچ کلمه انگلیسی نباید در ترجمه باقی بماند. حتی اگر معادل دقیق وجود نداشته باشد، باید تقریبی‌ترین معنا را به فارسی ارائه دهید.`;
  }

  private static getCompleteTranslationGuidelines(): string {
    return `
**راهنمای ترجمه کامل:**
- هیچ کلمه انگلیسی نباید در نتیجه نهایی باقی بماند
- اگر کلمه‌ای معادل مستقیم ندارد، نزدیک‌ترین معنا را استفاده کنید
- اگر اصطلاحی تخصصی است، آن را توضیح دهید یا ساده کنید
- برای کلمات بدون معادل، از توصیف کوتاه استفاده کنید
- همیشه اولویت با قابل فهم بودن برای مخاطب فارسی‌زبان است`;
  }

  private static getNameTranslationRules(): string {
    return `
**قوانین ترجمه اسم‌ها و کلمات خاص:**

**اسم اشخاص:**
- John → جان
- Mary → مری  
- Michael → مایکل
- Sarah → سارا
- Robert → رابرت

**اسم مکان‌ها:**
- New York → نیویورک
- London → لندن
- Paris → پاریس
- Tokyo → توکیو
- California → کالیفرنیا

**نام برندها و شرکت‌ها:**
- Apple → اپل
- Microsoft → مایکروسافت
- Google → گوگل
- Facebook → فیس‌بوک
- Amazon → آمازون

**اصطلاحات تخصصی:**
- Software → نرم‌افزار
- Hardware → سخت‌افزار
- Internet → اینترنت
- Computer → کامپیوتر
- Website → وب‌سایت

**کلمات بدون معادل مستقیم:**
- Pizza → پیتزا
- Hamburger → همبرگر
- Coffee → قهوه
- Tea → چای
- Chocolate → شکلات

**اگر اسم یا کلمه‌ای کاملاً ناشناخته است:**
- آن را به نزدیک‌ترین تلفظ فارسی تبدیل کنید
- مثال: "Xerxes" → "خشایارشا" یا "زرکسیس"`;
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

  private static getDiverseExamples(): string {
    return `
**نمونه‌های ترجمه کامل:**

**مکالمات روزمره:**
- "How are you doing, John?" → "حالت چطوره جان؟"
- "I'll call Sarah back" → "به سارا زنگ می‌زنم"
- "Let's go to McDonald's" → "بریم مک‌دونالد"

**جملات با اسم‌های خاص:**
- "Meet me at Starbucks" → "تو استارباکس ملاقات کنیم"
- "I work at Microsoft" → "تو مایکروسافت کار می‌کنم"
- "Drive to Los Angeles" → "به لس‌آنجلس برانیم"

**اصطلاحات تخصصی:**
- "Download the software" → "نرم‌افزار رو دانلود کن"
- "Check your email" → "ایمیلت رو چک کن"
- "Upload to YouTube" → "تو یوتیوب آپلود کن"

**ترکیب اسم و فعل:**
- "Google it" → "گوگلش کن"
- "Facebook me" → "تو فیس‌بوک پیام بده"
- "Skype with them" → "باهاشون اسکایپ کن"`;
  }

  private static getTechnicalConstraints(): string {
    return `
**محدودیت‌های تکنیکی زیرنویس:**
- اگر جمله طولانی است، آن را به دو بخش منطقی تقسیم کنید
- از علائم نگارشی مناسب استفاده کنید (. ، ! ؟)
- عدد و تاریخ به صورت فارسی (۱۲۳۴۵۶۷۸۹۰)
- از کلمات اختصاری مناسب استفاده کنید (نمی‌شه، نمی‌تونه)
- همه اسم‌ها و کلمات خاص باید ترجمه شوند`;
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
- گفتار سریع: خلاصه‌سازی با حفظ نکات کلیدی
- **اسم‌های خاص: همه باید ترجمه شوند - هیچ استثنایی وجود ندارد**`;
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

    return `گزارش کیفیت ترجمه کامل:
امتیاز کلی: ${avgScore.toFixed(1)}/100
نسبت طول متن: ${avgLengthRatio.toFixed(2)}
تعداد مسائل: ${totalIssues}
کلمات ترجمه نشده: ${totalUntranslatedWords}
سازگاری فارسی: ${avgConsistency.toFixed(1)}%
نوع محتوا: ${settings.genre}
سطح رسمیت: ${settings.formalityLevel}
وضعیت ترجمه کامل: ${totalUntranslatedWords === 0 ? '✅ کامل' : '❌ ناکامل'}`;
  }
}
