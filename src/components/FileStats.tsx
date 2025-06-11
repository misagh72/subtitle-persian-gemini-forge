
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Hash } from 'lucide-react';

interface FileStatsProps {
  selectedFile: File | null;
  dialogueCount?: number;
  estimatedTime?: number;
}

const FileStats: React.FC<FileStatsProps> = ({ 
  selectedFile, 
  dialogueCount = 0, 
  estimatedTime = 0 
}) => {
  if (!selectedFile) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="glass-effect hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="w-5 h-5 text-primary" />
          آمار فایل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <FileText className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">حجم فایل</p>
              <p className="text-sm font-mono text-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <Hash className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">تعداد خطوط</p>
              <p className="text-sm font-mono text-foreground">{dialogueCount}</p>
            </div>
          </div>
          
          {estimatedTime > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">زمان تخمینی</p>
                <p className="text-sm font-mono text-foreground">{formatTime(estimatedTime)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileStats;
