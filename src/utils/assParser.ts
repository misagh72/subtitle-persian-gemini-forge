
export interface AssLine {
  type: 'dialogue' | 'style' | 'info' | 'other';
  content: string;
  text?: string;
  inlineTags?: string[];
  originalLine: string;
}

export class AssParser {
  static parseAssFile(content: string): AssLine[] {
    const lines = content.split('\n');
    const parsedLines: AssLine[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Dialogue:')) {
        const dialoguePart = this.extractDialogueText(trimmedLine);
        const inlineTags = this.extractInlineTags(dialoguePart);
        const cleanText = this.removeInlineTags(dialoguePart);
        
        parsedLines.push({
          type: 'dialogue',
          content: trimmedLine,
          text: cleanText,
          inlineTags,
          originalLine: line
        });
      } else if (trimmedLine.startsWith('Style:')) {
        parsedLines.push({
          type: 'style',
          content: trimmedLine,
          originalLine: line
        });
      } else if (trimmedLine.startsWith('[') || trimmedLine.includes(':')) {
        parsedLines.push({
          type: 'info',
          content: trimmedLine,
          originalLine: line
        });
      } else {
        parsedLines.push({
          type: 'other',
          content: trimmedLine,
          originalLine: line
        });
      }
    }

    return parsedLines;
  }

  static extractDialogueText(dialogueLine: string): string {
    // Extract text part from dialogue line (after the 9th comma)
    const parts = dialogueLine.split(',');
    if (parts.length >= 10) {
      return parts.slice(9).join(',');
    }
    return '';
  }

  static extractInlineTags(text: string): string[] {
    const tagRegex = /\{[^}]*\}/g;
    const matches = text.match(tagRegex);
    return matches || [];
  }

  static removeInlineTags(text: string): string {
    return text.replace(/\{[^}]*\}/g, '').trim();
  }

  static reconstructDialogue(originalLine: string, translatedText: string, inlineTags: string[]): string {
    const parts = originalLine.split(',');
    if (parts.length >= 10) {
      // Distribute inline tags across translated words if needed
      let finalText = translatedText;
      
      if (inlineTags.length > 0) {
        const words = translatedText.split(' ');
        const tagsPerWord = Math.ceil(inlineTags.length / Math.max(words.length, 1));
        
        let tagIndex = 0;
        const wordsWithTags = words.map(word => {
          let result = word;
          for (let i = 0; i < tagsPerWord && tagIndex < inlineTags.length; i++) {
            result = inlineTags[tagIndex] + result;
            tagIndex++;
          }
          return result;
        });
        
        // Add remaining tags to the last word
        while (tagIndex < inlineTags.length) {
          wordsWithTags[wordsWithTags.length - 1] += inlineTags[tagIndex];
          tagIndex++;
        }
        
        finalText = wordsWithTags.join(' ');
      }
      
      const newParts = [...parts.slice(0, 9), finalText];
      return newParts.join(',');
    }
    return originalLine;
  }

  static reconstructAssFile(parsedLines: AssLine[], translations: Map<string, string>): string {
    return parsedLines.map(line => {
      if (line.type === 'dialogue' && line.text && translations.has(line.text)) {
        const translatedText = translations.get(line.text)!;
        return this.reconstructDialogue(line.originalLine, translatedText, line.inlineTags || []);
      }
      return line.originalLine;
    }).join('\n');
  }
}
