import React from 'react';
import { Button } from '@/components/ui/button';

interface TranslationActionsProps {
  selectedFile: File | null;
  isTranslating: boolean;
  onTranslate: () => void;
}

const TranslationActions: React.FC<TranslationActionsProps> = ({
  selectedFile,
  isTranslating,
  onTranslate,
}) => {
  if (!selectedFile || isTranslating) {
    return null;
  }

  return (
    <Button 
      onClick={onTranslate} 
      className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground rounded-md"
    >
      شروع ترجمه
    </Button>
  );
};

export default TranslationActions;