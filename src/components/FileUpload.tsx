
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onRemoveFile }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setIsDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.ass', '.ssa'],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  if (selectedFile) {
    return (
      <Card className="p-6 glass-effect animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer glass-effect hover-glow ${
        isDragActive 
          ? 'border-primary bg-primary/5 scale-105' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center animate-fade-in">
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
          isDragActive ? 'text-primary animate-pulse-glow' : 'text-muted-foreground'
        }`} />
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          آپلود فایل زیرنویس ASS
        </h3>
        <p className="text-muted-foreground mb-4">
          فایل .ass یا .ssa خود را اینجا بکشید یا کلیک کنید
        </p>
        <Button variant="outline" size="sm" className="hover-glow">
          انتخاب فایل
        </Button>
      </div>
    </Card>
  );
};

export default FileUpload;
