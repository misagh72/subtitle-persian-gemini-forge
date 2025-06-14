
import React from 'react';
import FileUpload from '@/components/FileUpload';

interface MinimalFileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
}

const MinimalFileUpload: React.FC<MinimalFileUploadProps> = ({
  selectedFile,
  onFileSelect,
  onRemoveFile
}) => (
  <FileUpload
    onFileSelect={onFileSelect}
    selectedFile={selectedFile}
    onRemoveFile={onRemoveFile}
  />
);

export default MinimalFileUpload;
