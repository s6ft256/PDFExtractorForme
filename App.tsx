
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle, CheckCircle2, ListFilter, Trash2, RefreshCw } from 'lucide-react';
import Dropzone from './components/Dropzone';
import DataTable from './components/DataTable';
import { ProcessingFile, ProcessingStatus, CandidateData } from './types';
import { extractTextFromPdf } from './utils/pdfUtils';
import { extractResumeData } from './services/geminiService';

const App: React.FC = () => {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const processingRef = useRef<Set<string>>(new Set());

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
    if (processingRef.current.has(processingFile.id)) return;
    processingRef.current.add(processingFile.id);

    setProcessingFiles(prev => prev.map(f => 
      f.id === processingFile.id ? { ...f, status: ProcessingStatus.READING, progress: 20 } : f
    ));

    try {
      const text = await extractTextFromPdf(processingFile.file);
      
      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.EXTRACTING, progress: 60 } : f
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
        // More robust deduplication logic
        const exists = prev.some(c => 
          (c.email.toLowerCase() === candidate.email.toLowerCase() && candidate.email !== 'Unknown') ||
          (c.name.toLowerCase() === candidate.name.toLowerCase() && c.email === candidate.email)
        );
        if (exists) return prev;
        return [candidate, ...prev];
      });

      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.COMPLETED, progress: 100, result: candidate } : f
      ));
    } catch (err: any) {
      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.FAILED, error: err.message || 'Processing failed' } : f
      ));
    } finally {
      processingRef.current.delete(processingFile.id);
    }
  };

  const retryFailed = () => {
    setProcessingFiles(prev => prev.map(f => 
      f.status === ProcessingStatus.FAILED ? { ...f, status: ProcessingStatus.IDLE, progress: 0, error: undefined } : f
    ));
  };

  useEffect(() => {
    const idleFiles = processingFiles.filter(f => f.status === ProcessingStatus.IDLE);
    if (idleFiles.length > 0 && !isProcessingBatch) {
      const processBatch = async () => {
        setIsProcessingBatch(true);
        // Faster throughput with higher concurrency (Gemini 3 Flash handles this well)
        const concurrentLimit = 6;
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
    setProcessingFiles(prev => prev.filter(f => 
      f.status !== ProcessingStatus.COMPLETED && f.status !== ProcessingStatus.FAILED
    ));
  };

  const deleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
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
        <h1 className="text-5xl font-black text-white tracking-tight mb-4 shadow-text">
          PDF Extractor
        </h1>
        <p className="text-xl text-white font-medium max-w-2xl mx-auto shadow-text opacity-90">
          Professional Bulk Resume Processing Engine
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-morphism rounded-3xl overflow-hidden transition-all duration-500">
            <Dropzone 
              onFilesSelected={handleFilesSelected} 
              isProcessing={isProcessingBatch} 
            />
          </section>

          {candidates.length > 0 && (
            <section className="glass-morphism rounded-3xl overflow-hidden p-1 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ListFilter size={20} className="text-blue-600" />
                  Extracted Candidates
                </h2>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase text-gray-500 bg-white/30 px-2 py-1 rounded-md">
                     Live Updates Enabled
                   </span>
                </div>
              </div>
              <DataTable 
                data={candidates} 
                onDelete={deleteCandidate} 
                onClearAll={() => setCandidates([])} 
              />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-morphism rounded-3xl p-6 sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between border-b border-white/20 pb-4">
              Queue Status
              {isProcessingBatch && <Loader2 size={20} className="animate-spin text-blue-600" />}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-600">Pending</span>
                <span className="text-gray-900 bg-white/50 px-2.5 py-0.5 rounded-lg border border-white/20">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-600">Active Threads</span>
                <span className="text-blue-700 bg-blue-100/50 px-2.5 py-0.5 rounded-lg border border-blue-200/50">{stats.processing}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-600">Extracted</span>
                <span className="text-green-700 bg-green-100/50 px-2.5 py-0.5 rounded-lg border border-green-200/50">{stats.completed}</span>
              </div>
              {stats.failed > 0 && (
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-600">Issues</span>
                  <span className="text-red-700 bg-red-100/50 px-2.5 py-0.5 rounded-lg border border-red-200/50">{stats.failed}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 mt-8">
              {stats.failed > 0 && (
                <button 
                  onClick={retryFailed}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw size={16} />
                  Retry Failed
                </button>
              )}
              {processingFiles.length > 0 && (
                <button 
                  onClick={clearCompleted}
                  className="w-full py-2.5 px-4 bg-white/40 hover:bg-white/60 border border-white/40 rounded-xl text-sm text-gray-700 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
            {processingFiles.map((pf) => (
              <div key={pf.id} className="glass-morphism-dark rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group border border-white/10 hover:border-white/30 transition-all">
                {pf.status === ProcessingStatus.COMPLETED && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                {pf.status === ProcessingStatus.FAILED && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className={`${pf.status === ProcessingStatus.FAILED ? 'text-red-400' : 'text-blue-400'} shrink-0`} />
                    <span className="text-xs font-bold truncate text-white/90">{pf.file.name}</span>
                  </div>
                  <button 
                    onClick={() => removeProcessedFile(pf.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {pf.error ? (
                  <p className="text-[10px] text-red-300 font-medium bg-red-900/20 p-1.5 rounded-lg border border-red-500/20">
                    {pf.error}
                  </p>
                ) : (
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        pf.status === ProcessingStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pf.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="mt-12 text-center text-white/70 font-medium text-xs shadow-text">
        <p>&copy; {new Date().getFullYear()} PDF Extractor. Optimized for Enterprise Performance.</p>
      </footer>
    </div>
  );
};

export default App;
