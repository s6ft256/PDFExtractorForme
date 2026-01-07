
import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      onFilesSelected(files);
      e.target.value = ''; // Reset for same file selection
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 text-center cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !isProcessing && document.getElementById('fileInput')?.click()}
    >
      <input
        type="file"
        id="fileInput"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Upload Resumes</h3>
          <p className="text-gray-500 mt-1">Drag and drop PDF files here, or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">Only PDF files are supported for extraction</p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
