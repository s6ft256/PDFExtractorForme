import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, CheckCircle2, ListFilter, Trash2 } from 'lucide-react';
import Dropzone from './components/Dropzone';
import DataTable from './components/DataTable';
import { ProcessingFile, ProcessingStatus, CandidateData } from './types';
import { extractTextFromPdf } from './utils/pdfUtils';
import { extractResumeData } from './services/geminiService';

const App: React.FC = () => {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newFiles: ProcessingFile[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: ProcessingStatus.IDLE,
      progress: 0
    }));
    setProcessingFiles(prev => [...prev, ...newFiles]);
  };

  const processFile = async (processingFile: ProcessingFile) => {
    setProcessingFiles(prev => prev.map(f => 
      f.id === processingFile.id ? { ...f, status: ProcessingStatus.READING, progress: 10 } : f
    ));

    try {
      const text = await extractTextFromPdf(processingFile.file);
      
      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.EXTRACTING, progress: 50 } : f
      ));

      const result = await extractResumeData(text);

      const candidate: CandidateData = {
        id: Math.random().toString(36).substring(7),
        name: result.name,
        email: result.email,
        filename: processingFile.file.name,
        processedAt: new Date()
      };

      setCandidates(prev => {
        const exists = prev.some(c => c.email.toLowerCase() === candidate.email.toLowerCase() && candidate.email !== 'Unknown');
        if (exists) return prev;
        return [candidate, ...prev];
      });

      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.COMPLETED, progress: 100, result: candidate } : f
      ));
    } catch (err: any) {
      console.error(`Error processing ${processingFile.file.name}:`, err);
      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.FAILED, error: err.message || 'Processing failed' } : f
      ));
    }
  };

  useEffect(() => {
    const idleFiles = processingFiles.filter(f => f.status === ProcessingStatus.IDLE);
    if (idleFiles.length > 0 && !isProcessingBatch) {
      const processBatch = async () => {
        setIsProcessingBatch(true);
        const concurrentLimit = 3;
        for (let i = 0; i < idleFiles.length; i += concurrentLimit) {
          const batch = idleFiles.slice(i, i + concurrentLimit);
          await Promise.all(batch.map(processFile));
        }
        setIsProcessingBatch(false);
      };
      processBatch();
    }
  }, [processingFiles, isProcessingBatch]);

  const removeProcessedFile = (id: string) => {
    setProcessingFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setProcessingFiles(prev => prev.filter(f => f.status !== ProcessingStatus.COMPLETED && f.status !== ProcessingStatus.FAILED));
  };

  const deleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const clearAllCandidates = () => {
    if (window.confirm('Clear all extracted data?')) {
      setCandidates([]);
    }
  };

  const stats = {
    total: processingFiles.length,
    completed: processingFiles.filter(f => f.status === ProcessingStatus.COMPLETED).length,
    failed: processingFiles.filter(f => f.status === ProcessingStatus.FAILED).length,
    processing: processingFiles.filter(f => f.status === ProcessingStatus.READING || f.status === ProcessingStatus.EXTRACTING).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
          PDF Extractor
        </h1>
        <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
          Bulk extraction of resume data using Gemini AI.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-morphism rounded-2xl overflow-hidden shadow-2xl">
            <Dropzone 
              onFilesSelected={handleFilesSelected} 
              isProcessing={isProcessingBatch} 
            />
          </section>

          {candidates.length > 0 && (
            <section className="glass-morphism rounded-2xl overflow-hidden shadow-2xl p-1">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ListFilter size={20} className="text-blue-600" />
                  Extracted Data
                </h2>
              </div>
              <DataTable 
                data={candidates} 
                onDelete={deleteCandidate} 
                onClearAll={clearAllCandidates} 
              />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-morphism rounded-2xl shadow-2xl border border-white/30 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
              Status
              {isProcessingBatch && <Loader2 size={18} className="animate-spin text-blue-500" />}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Queue</span>
                <span className="font-semibold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Processing</span>
                <span className="font-semibold text-blue-600">{stats.processing}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Success</span>
                <span className="font-semibold text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Errors</span>
                <span className="font-semibold text-red-600">{stats.failed}</span>
              </div>
            </div>

            {processingFiles.length > 0 && (
              <button 
                onClick={clearCompleted}
                className="w-full mt-6 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Trash2 size={14} />
                Clear Queue
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {processingFiles.map((pf) => (
              <div key={pf.id} className="bg-white/95 border border-gray-100 rounded-xl p-3 shadow-md flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
                {pf.status === ProcessingStatus.COMPLETED && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                {pf.status === ProcessingStatus.FAILED && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold truncate text-gray-700">{pf.file.name}</span>
                  </div>
                  <button 
                    onClick={() => removeProcessedFile(pf.id)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      pf.status === ProcessingStatus.FAILED ? 'bg-red-500' : 
                      pf.status === ProcessingStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pf.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="mt-12 text-center text-white/60 text-xs">
        <p>&copy; {new Date().getFullYear()} PDF Extractor.</p>
      </footer>
    </div>
  );
};

export default App;