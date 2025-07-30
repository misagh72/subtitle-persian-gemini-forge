import React from 'react';
import { AssParser } from '@/utils/assParser';

interface UseFileAnalysisProps {
  selectedFile: File | null;
  updateState: (updates: any) => void;
}

export const useFileAnalysis = ({ selectedFile, updateState }: UseFileAnalysisProps) => {
  const [originalContent, setOriginalContent] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedFile) {
      selectedFile.text().then(content => {
        console.log('📁 Analyzing file:', selectedFile.name);
        const parsedLines = AssParser.parseAssFile(content);
        const dialogues = parsedLines.filter(line => line.type === 'dialogue' && line.text && line.text.trim());
        
        console.log('📊 File analysis results:');
        console.log(`  Total lines: ${parsedLines.length}`);
        console.log(`  Dialogue lines: ${dialogues.length}`);
        console.log(`  First few dialogues:`, dialogues.slice(0, 3).map(d => d.text?.substring(0, 30) + '...'));
        
        updateState({
          dialogueCount: dialogues.length
        });
        setOriginalContent(content);
      }).catch(console.error);
    } else {
      setOriginalContent('');
    }
  }, [selectedFile, updateState]);

  return { originalContent };
};