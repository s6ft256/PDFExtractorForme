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
      className={`relative rounded-3xl p-16 transition-all duration-300 text-center cursor-pointer border-2 border-dashed
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/40 hover:border-white/60 bg-transparent'}
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
      
      <div className="flex flex-col items-center gap-6">
        <div className={`p-6 rounded-2xl transition-all duration-300 ${isDragging ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-white/40 text-blue-600'}`}>
          <Upload size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Upload Resumes</h3>
          <p className="text-gray-700 mt-2 font-medium">Drag and drop PDF files here, or click to browse</p>
          <p className="text-xs text-gray-600 mt-3 font-semibold uppercase tracking-wider opacity-60">PDF files only • Unlimited Bulk Processing</p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;