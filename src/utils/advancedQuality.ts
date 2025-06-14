
export interface RecurringPattern {
  pattern: string;
  frequency: number;
  translations: Map<string, number>;
  preferredTranslation: string;
}

export interface GrammarIssue {
  type: 'spelling' | 'grammar' | 'punctuation' | 'structure';
  position: number;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SentimentAnalysis {
  polarity: number; // -1 to 1 (negative to positive)
  intensity: number; // 0 to 1
  emotions: string[];
  tone: 'formal' | 'informal' | 'emotional' | 'neutral';
}

export interface CoherenceCheck {
  consistency: number; // 0 to 100
  terminologyIssues: string[];
  styleIssues: string[];
  suggestions: string[];
}

export class AdvancedQualityService {
  private static patterns: Map<string, RecurringPattern> = new Map();
  private static readonly PERSIAN_GRAMMAR_RULES = [
    {
      pattern: /\s+/g,
      replacement: ' ',
      description: 'فاصله‌های اضافی'
    },
    {
      pattern: /[،؛]\s*$/,
      replacement: '',
      description: 'نقطه‌گذاری نادرست در انتها'
    },
    {
      pattern: /([؟!])\1+/g,
      replacement: '$1',
      description: 'نشانه‌های سؤال یا تعجب تکراری'
    },
    {
      pattern: /\b(می)\s+([\u0600-\u06FF]+)/g,
      replacement: '$1‌$2',
      description: 'فاصله نیم‌فاصله در فعل‌ها'
    }
  ];

  static detectRecurringPatterns(texts: string[]): RecurringPattern[] {
    const patterns = new Map<string, { count: number; texts: string[] }>();
    
    // تشخیص عبارات تکراری
    texts.forEach(text => {
      const words = text.split(/\s+/);
      
      // بررسی عبارات 2-5 کلمه‌ای
      for (let len = 2; len <= Math.min(5, words.length); len++) {
        for (let i = 0; i <= words.length - len; i++) {
          const phrase = words.slice(i, i + len).join(' ');
          
          if (phrase.length > 5) {
            if (!patterns.has(phrase)) {
              patterns.set(phrase, { count: 0, texts: [] });
            }
            patterns.get(phrase)!.count++;
            patterns.get(phrase)!.texts.push(text);
          }
        }
      }
    });

    // فیلتر کردن الگوهای با فراوانی بالا
    return Array.from(patterns.entries())
      .filter(([_, data]) => data.count >= 3)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        translations: new Map(),
        preferredTranslation: pattern
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  static checkPersianGrammar(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];
    
    this.PERSIAN_GRAMMAR_RULES.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        issues.push({
          type: 'grammar',
          position: match.index,
          suggestion: text.replace(rule.pattern, rule.replacement),
          severity: 'medium'
        });
      }
    });

    // بررسی نوشتار فارسی
    const arabicChars = text.match(/[يك]/g);
    if (arabicChars) {
      issues.push({
        type: 'spelling',
        position: 0,
        suggestion: 'استفاده از حروف فارسی به جای عربی (ی به جای ي، ک به جای ك)',
        severity: 'high'
      });
    }

    // بررسی علائم نگارشی
    if (text.includes('...') && text.match(/\.{4,}/)) {
      issues.push({
        type: 'punctuation',
        position: text.indexOf('....'),
        suggestion: 'استفاده از سه نقطه به جای بیشتر',
        severity: 'low'
      });
    }

    return issues;
  }

  static analyzeSentiment(originalText: string, translatedText: string): {
    original: SentimentAnalysis;
    translated: SentimentAnalysis;
    consistency: number;
  } {
    const originalSentiment = this.extractSentiment(originalText);
    const translatedSentiment = this.extractSentiment(translatedText);
    
    // محاسبه انسجام احساسی
    const polarityDiff = Math.abs(originalSentiment.polarity - translatedSentiment.polarity);
    const intensityDiff = Math.abs(originalSentiment.intensity - translatedSentiment.intensity);
    const consistency = Math.max(0, 100 - (polarityDiff + intensityDiff) * 50);

    return {
      original: originalSentiment,
      translated: translatedSentiment,
      consistency
    };
  }

  private static extractSentiment(text: string): SentimentAnalysis {
    const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'excellent', 'خوب', 'عالی', 'فوق‌العاده', 'بهترین'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'بد', 'افتضاح', 'وحشتناک', 'بدترین'];
    const emotionalWords = ['love', 'hate', 'angry', 'sad', 'happy', 'عشق', 'نفرت', 'عصبانی', 'غمگین', 'خوشحال'];
    
    const words = text.toLowerCase().split(/\s+/);
    let polarity = 0;
    let intensity = 0;
    const emotions: string[] = [];
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        polarity += 0.1;
        intensity += 0.1;
      }
      if (negativeWords.includes(word)) {
        polarity -= 0.1;
        intensity += 0.1;
      }
      if (emotionalWords.includes(word)) {
        emotions.push(word);
        intensity += 0.1;
      }
    });

    // تشخیص تون
    let tone: 'formal' | 'informal' | 'emotional' | 'neutral' = 'neutral';
    if (intensity > 0.3) tone = 'emotional';
    else if (text.includes('please') || text.includes('لطفاً') || text.includes('خواهشاً')) tone = 'formal';
    else if (text.includes('hey') || text.includes('سلام') || text.includes('!')) tone = 'informal';

    return {
      polarity: Math.max(-1, Math.min(1, polarity)),
      intensity: Math.min(1, intensity),
      emotions,
      tone
    };
  }

  static checkCoherence(translations: Map<string, string>): CoherenceCheck {
    const terminologyMap = new Map<string, Set<string>>();
    const stylePatterns: string[] = [];
    const issues: string[] = [];
    const suggestions: string[] = [];

    // بررسی ثبات اصطلاحات
    translations.forEach((translated, original) => {
      const originalWords = original.toLowerCase().split(/\s+/);
      const translatedWords = translated.split(/\s+/);

      originalWords.forEach(word => {
        if (word.length > 3) {
          if (!terminologyMap.has(word)) {
            terminologyMap.set(word, new Set());
          }
          
          // یافتن ترجمه احتمالی
          const possibleTranslation = this.findCorrespondingWord(word, translatedWords);
          if (possibleTranslation) {
            terminologyMap.get(word)!.add(possibleTranslation);
          }
        }
      });
    });

    // شناسایی مسائل ثبات
    terminologyMap.forEach((translations, term) => {
      if (translations.size > 1) {
        issues.push(`کلمه "${term}" با ترجمه‌های مختلف: ${Array.from(translations).join(', ')}`);
        suggestions.push(`استفاده یکسان از ترجمه "${Array.from(translations)[0]}" برای "${term}"`);
      }
    });

    // بررسی ثبات سبک
    const formalityLevels = Array.from(translations.values()).map(text => {
      const formalWords = ['لطفاً', 'خواهشمندم', 'محترم'];
      const informalWords = ['سلام', 'چطوری', 'باشه'];
      
      const formalCount = formalWords.filter(word => text.includes(word)).length;
      const informalCount = informalWords.filter(word => text.includes(word)).length;
      
      return formalCount > informalCount ? 'formal' : 'informal';
    });

    const consistentStyle = formalityLevels.every(level => level === formalityLevels[0]);
    if (!consistentStyle) {
      issues.push('عدم ثبات در سطح رسمیت ترجمه');
      suggestions.push('حفظ سطح رسمیت یکسان در تمام ترجمه‌ها');
    }

    const consistency = Math.max(0, 100 - issues.length * 15);

    return {
      consistency,
      terminologyIssues: issues.filter(issue => issue.includes('کلمه')),
      styleIssues: issues.filter(issue => issue.includes('سطح')),
      suggestions
    };
  }

  private static findCorrespondingWord(originalWord: string, translatedWords: string[]): string | null {
    // ساده‌ترین روش: یافتن کلمه با بیشترین شباهت طول
    const targetLength = originalWord.length;
    let bestMatch = null;
    let bestScore = 0;

    translatedWords.forEach(word => {
      const lengthScore = 1 - Math.abs(word.length - targetLength) / Math.max(word.length, targetLength);
      if (lengthScore > bestScore && lengthScore > 0.5) {
        bestScore = lengthScore;
        bestMatch = word;
      }
    });

    return bestMatch;
  }

  static generateAdvancedReport(
    patterns: RecurringPattern[],
    grammarIssues: GrammarIssue[],
    sentimentAnalysis: { consistency: number }[],
    coherenceCheck: CoherenceCheck
  ): string {
    const avgSentimentConsistency = sentimentAnalysis.reduce((sum, s) => sum + s.consistency, 0) / sentimentAnalysis.length;
    
    return `گزارش تفصیلی کیفیت ترجمه:

📊 الگوهای مکرر: ${patterns.length} الگو شناسایی شد
🔤 مسائل گرامری: ${grammarIssues.length} مورد
💭 انسجام احساسی: ${avgSentimentConsistency.toFixed(1)}%
🎯 انسجام کلی: ${coherenceCheck.consistency.toFixed(1)}%

⭐ پیشنهادات:
${coherenceCheck.suggestions.slice(0, 3).map(s => `• ${s}`).join('\n')}

${grammarIssues.length > 0 ? `\n⚠️ مسائل گرامری:
${grammarIssues.slice(0, 3).map(issue => `• ${issue.suggestion}`).join('\n')}` : ''}

${patterns.length > 0 ? `\n🔄 الگوهای مکرر:
${patterns.slice(0, 3).map(p => `• "${p.pattern}" (${p.frequency} بار)`).join('\n')}` : ''}`;
  }
}
