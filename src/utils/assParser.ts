export interface AssLine {
  type: 'dialogue' | 'style' | 'info' | 'other';
  content: string;
  text?: string;
  inlineTags?: InlineTag[];
  originalLine: string;
}

export interface InlineTag {
  tag: string;
  position: number;
  type: 'opening' | 'closing' | 'standalone';
}

export class AssParser {
  static parseAssFile(content: string): AssLine[] {
    const lines = content.split('\n');
    const parsedLines: AssLine[] = [];

    console.log(`🔍 Parsing ASS file with ${lines.length} total lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Dialogue:')) {
        const dialoguePart = this.extractDialogueText(trimmedLine);
        
        // More thorough check for valid dialogue
        if (dialoguePart && dialoguePart.trim().length > 0) {
          const inlineTags = this.extractInlineTagsWithPositions(dialoguePart);
          const cleanText = this.removeInlineTags(dialoguePart);
          
          // Only include if there's actual text content
          if (cleanText && cleanText.trim().length > 0) {
            console.log(`📝 Found dialogue line ${i + 1}: "${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}"`);
            parsedLines.push({
              type: 'dialogue',
              content: trimmedLine,
              text: cleanText.trim(),
              inlineTags,
              originalLine: line
            });
          } else {
            console.log(`⚠️ Skipping empty dialogue line ${i + 1}: "${dialoguePart}"`);
          }
        } else {
          console.log(`⚠️ Skipping invalid dialogue line ${i + 1}: "${trimmedLine}"`);
        }
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

    const dialogueCount = parsedLines.filter(line => line.type === 'dialogue').length;
    console.log(`✅ Successfully parsed ${dialogueCount} dialogue lines out of ${lines.length} total lines`);

    return parsedLines;
  }

  static extractDialogueText(dialogueLine: string): string {
    // Extract text part from dialogue line (after the 9th comma)
    const parts = dialogueLine.split(',');
    if (parts.length >= 10) {
      return parts.slice(9).join(',').trim();
    }
    return '';
  }

  static extractInlineTagsWithPositions(text: string): InlineTag[] {
    const tags: InlineTag[] = [];
    const tagRegex = /\{[^}]*\}/g;
    let match;
    let offset = 0;

    // Create a copy without tags to calculate clean text positions
    let cleanText = '';
    let lastIndex = 0;

    while ((match = tagRegex.exec(text)) !== null) {
      // Add text before this tag to clean text
      cleanText += text.substring(lastIndex, match.index);
      
      // Calculate position in clean text
      const position = cleanText.length;
      
      // Determine tag type
      const tagContent = match[0];
      let type: 'opening' | 'closing' | 'standalone' = 'standalone';
      
      if (tagContent.includes('\\r') || tagContent.includes('\\i') || tagContent.includes('\\b') || tagContent.includes('\\u')) {
        type = 'opening';
      } else if (tagContent.includes('\\r0') || tagContent.includes('\\i0') || tagContent.includes('\\b0') || tagContent.includes('\\u0')) {
        type = 'closing';
      }

      tags.push({
        tag: tagContent,
        position,
        type
      });

      lastIndex = match.index + match[0].length;
    }

    console.log('🏷️ Extracted tags with positions:', tags);
    return tags;
  }

  static extractInlineTags(text: string): string[] {
    const tagRegex = /\{[^}]*\}/g;
    const matches = text.match(tagRegex);
    return matches || [];
  }

  static removeInlineTags(text: string): string {
    return text.replace(/\{[^}]*\}/g, '').trim();
  }

  static reconstructDialogue(originalLine: string, translatedText: string, inlineTags: InlineTag[]): string {
    const parts = originalLine.split(',');
    if (parts.length >= 10) {
      let finalText = translatedText;
      
      if (inlineTags && inlineTags.length > 0) {
        console.log('🔧 Reconstructing dialogue with tags:', { translatedText, inlineTags });
        
        // Sort tags by position (descending) to insert from end to start
        const sortedTags = [...inlineTags].sort((a, b) => b.position - a.position);
        
        // Calculate position mapping ratio
        const originalLength = this.removeInlineTags(this.extractDialogueText(originalLine)).length;
        const translatedLength = translatedText.length;
        const ratio = translatedLength / Math.max(originalLength, 1);
        
        console.log('📏 Length mapping:', { originalLength, translatedLength, ratio });
        
        // Insert tags at proportional positions
        sortedTags.forEach(tagInfo => {
          const newPosition = Math.min(
            Math.round(tagInfo.position * ratio),
            translatedText.length
          );
          
          console.log(`🎯 Placing tag "${tagInfo.tag}" at position ${newPosition} (original: ${tagInfo.position})`);
          
          // Insert tag at calculated position
          finalText = finalText.slice(0, newPosition) + tagInfo.tag + finalText.slice(newPosition);
        });
        
        console.log('✨ Final text with tags:', finalText);
      }
      
      const newParts = [...parts.slice(0, 9), finalText];
      return newParts.join(',');
    }
    return originalLine;
  }

  static reconstructAssFile(parsedLines: AssLine[], translations: Map<string, string>): string {
    console.log('🔄 Reconstructing ASS file with', translations.size, 'translations');
    console.log('📊 Available translations:', Array.from(translations.keys()).slice(0, 5));
    
    return parsedLines.map((line, index) => {
      if (line.type === 'dialogue' && line.text && translations.has(line.text)) {
        const translatedText = translations.get(line.text)!;
        console.log(`📝 Reconstructing line ${index + 1}:`, { 
          original: line.text.substring(0, 30) + '...', 
          translated: translatedText.substring(0, 30) + '...', 
          tags: line.inlineTags?.length || 0 
        });
        
        return this.reconstructDialogue(line.originalLine, translatedText, line.inlineTags || []);
      } else if (line.type === 'dialogue' && line.text) {
        console.log(`⚠️ No translation found for line ${index + 1}: "${line.text.substring(0, 30)}..."`);
      }
      return line.originalLine;
    }).join('\n');
  }
}
