import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  FileText, Loader2, CheckCircle2, ListFilter, Trash2, 
  RefreshCw, ShieldCheck, Globe, Zap, Cpu
} from 'lucide-react';
import Dropzone from './components/Dropzone';
import DataTable from './components/DataTable';
import { ProcessingFile, ProcessingStatus, CandidateData } from './types';
import { extractTextFromPdf } from './utils/pdfUtils';
import { extractResumeData } from './services/geminiService';

const App: React.FC = () => {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Simple verification check
    if (process.env.API_KEY) {
      setApiStatus('connected');
    } else {
      setApiStatus('error');
    }
  }, []);

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
        const isDuplicate = prev.some(c => 
          (c.email.toLowerCase() === candidate.email.toLowerCase() && candidate.email !== 'Unknown') ||
          (c.name.toLowerCase() === candidate.name.toLowerCase() && c.email === candidate.email)
        );
        if (isDuplicate) return prev;
        return [candidate, ...prev];
      });

      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.COMPLETED, progress: 100, result: candidate } : f
      ));
    } catch (err: any) {
      setProcessingFiles(prev => prev.map(f => 
        f.id === processingFile.id ? { ...f, status: ProcessingStatus.FAILED, error: err.message || 'Processing error' } : f
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
        const concurrentLimit = 8; // Higher concurrency for Flash model
        for (let i = 0; i < idleFiles.length; i += concurrentLimit) {
          const batch = idleFiles.slice(i, i + concurrentLimit);
          await Promise.all(batch.map(processFile));
        }
        setIsProcessingBatch(false);
      };
      processBatch();
    }
  }, [processingFiles, isProcessingBatch]);

  const stats = {
    total: processingFiles.length,
    completed: processingFiles.filter(f => f.status === ProcessingStatus.COMPLETED).length,
    failed: processingFiles.filter(f => f.status === ProcessingStatus.FAILED).length,
    processing: processingFiles.filter(f => f.status === ProcessingStatus.READING || f.status === ProcessingStatus.EXTRACTING).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center relative">
        {/* Status Indicator for Render/Hosting */}
        <div className="absolute top-0 right-0 hidden md:flex items-center gap-3 glass-morphism px-4 py-2 rounded-2xl border border-white/20">
          <div className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
            {apiStatus === 'connected' ? 'API Active' : 'API Missing'}
          </span>
        </div>

        <h1 className="text-6xl font-black text-white tracking-tight mb-4 shadow-text flex items-center justify-center gap-4">
          <Cpu className="text-blue-400" size={48} />
          PDF Extractor
        </h1>
        <p className="text-xl text-white font-medium max-w-2xl mx-auto shadow-text opacity-80 uppercase tracking-[0.2em] text-[12px]">
          Next-Gen Intelligence for Talent Acquisition
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-morphism rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:shadow-3xl group">
            <Dropzone 
              onFilesSelected={handleFilesSelected} 
              isProcessing={isProcessingBatch} 
            />
          </section>

          {candidates.length > 0 && (
            <section className="glass-morphism rounded-[2.5rem] overflow-hidden p-1 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center justify-between p-8 border-b border-white/20 bg-white/5">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Globe size={24} className="text-blue-600" />
                  Candidate Database
                </h2>
                <div className="flex items-center gap-2">
                   <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                   <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                     Supercharged by Gemini 3 Flash
                   </span>
                </div>
              </div>
              <DataTable 
                data={candidates} 
                onDelete={(id) => setCandidates(prev => prev.filter(c => c.id !== id))} 
                onClearAll={() => setCandidates([])} 
              />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-morphism rounded-[2rem] p-8 sticky top-8 border-t border-white/60">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/5">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={20} />
                System Health
              </h3>
              {isProcessingBatch && <Loader2 size={24} className="animate-spin text-blue-600" />}
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Queue Size</span>
                <span className="text-xl font-black text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active</span>
                <span className="text-xl font-black text-blue-600">{stats.processing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Verified</span>
                <span className="text-xl font-black text-green-600">{stats.completed}</span>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              {stats.failed > 0 && (
                <button 
                  onClick={retryFailed}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm transition-all flex items-center justify-center gap-3 font-black shadow-xl shadow-blue-600/30 active:scale-95"
                >
                  <RefreshCw size={20} />
                  Retry Failed Jobs
                </button>
              )}
              {processingFiles.length > 0 && (
                <button 
                  onClick={() => setProcessingFiles(prev => prev.filter(f => f.status !== ProcessingStatus.COMPLETED && f.status !== ProcessingStatus.FAILED))}
                  className="w-full py-4 px-6 bg-white/50 hover:bg-white text-gray-800 border border-white/60 rounded-2xl text-sm transition-all flex items-center justify-center gap-3 font-bold active:scale-95"
                >
                  <Trash2 size={20} />
                  Flush History
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {processingFiles.map((pf) => (
              <div key={pf.id} className="glass-morphism-dark rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group border border-white/10 hover:border-white/40 transition-all hover:-translate-y-1">
                {pf.status === ProcessingStatus.COMPLETED && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500" />}
                {pf.status === ProcessingStatus.FAILED && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-xl ${pf.status === ProcessingStatus.FAILED ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                      <FileText size={18} className={pf.status === ProcessingStatus.FAILED ? 'text-red-400' : 'text-blue-400'} />
                    </div>
                    <span className="text-sm font-black truncate text-white/90">{pf.file.name}</span>
                  </div>
                  <button 
                    onClick={() => setProcessingFiles(prev => prev.filter(f => f.id !== pf.id))}
                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {pf.error ? (
                  <p className="text-[10px] text-red-300 font-bold bg-red-950/40 p-3 rounded-xl border border-red-500/20 italic">
                    {pf.error}
                  </p>
                ) : (
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${
                        pf.status === ProcessingStatus.COMPLETED ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
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

      <footer className="mt-16 text-center text-white/50 font-black text-[10px] uppercase tracking-[0.4em] shadow-text">
        <p>&copy; {new Date().getFullYear()} PDF EXTRACTOR PRO • HOSTING READY • CLOUD OPTIMIZED</p>
      </footer>
    </div>
  );
};

export default App;