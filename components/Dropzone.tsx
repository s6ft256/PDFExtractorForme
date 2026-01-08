import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2, Cpu } from 'lucide-react';

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

    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = (Array.from(e.target.files) as File[]).filter(f => f.type === 'application/pdf');
      onFilesSelected(files);
      e.target.value = ''; 
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-[3rem] p-16 transition-all duration-500 text-center cursor-pointer border-2 border-dashed
        ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' : 'border-white/10 hover:border-white/20 bg-transparent'}
        ${isProcessing ? 'cursor-wait border-blue-500/30' : ''}
        group overflow-hidden
      `}
      onClick={() => !isProcessing && document.getElementById('fileInput')?.click()}
    >
      {/* Processing Motion Overlay */}
      {isProcessing && (
        <>
          <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        </>
      )}

      <input
        type="file"
        id="fileInput"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className={`p-8 rounded-[2rem] transition-all duration-500 
          ${isDragging ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-blue-500 border border-white/10'}
          ${isProcessing ? 'animate-pulse' : 'group-hover:scale-110 group-hover:rotate-3'}
        `}>
          {isProcessing ? (
            <div className="relative">
              <Cpu size={48} className="animate-spin-custom opacity-20" />
              <Loader2 size={48} className="animate-spin absolute inset-0 text-blue-400" />
            </div>
          ) : (
            <Upload size={48} />
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-white tracking-tight">
            {isProcessing ? 'Analyzing Documents...' : 'Upload Resumes'}
          </h3>
          <p className="text-white/40 font-medium text-sm">
            {isProcessing ? 'Neural engine is extracting structural data' : 'Drag and drop PDF files here, or click to browse'}
          </p>
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              PDF Only
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Bulk Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;