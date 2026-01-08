import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  FileText, Loader2, CheckCircle2, ListFilter, Trash2, 
  RefreshCw, ShieldCheck, Globe, Zap, Cpu, AlertCircle
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
    // Check if the API key environment variable exists
    if (process.env.API_KEY && process.env.API_KEY.length > 10) {
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
        const concurrentLimit = 5; 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <header className="mb-16 text-center relative">
        {apiStatus === 'error' && (
          <div className="absolute top-0 right-0 flex items-center gap-3 glass-morphism px-4 py-2 rounded-2xl border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              API Error
            </span>
          </div>
        )}

        <div className={`inline-block p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 transition-all duration-700 ${isProcessingBatch ? 'animate-spin-custom shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'animate-float'}`}>
          <Cpu className={`${isProcessingBatch ? 'text-blue-300' : 'text-blue-400'}`} size={48} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 shadow-glow">
          Resume<span className="text-blue-500">Extract</span>
        </h1>
        <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto uppercase tracking-[0.3em] text-[11px]">
          Industrial Grade Document Intelligence
        </p>
      </header>

      {apiStatus === 'error' && (
        <div className="mb-8 p-6 glass-morphism border-red-500/30 rounded-3xl flex items-center gap-4 text-red-200">
          <AlertCircle className="text-red-500 shrink-0" size={32} />
          <div>
            <h4 className="font-bold text-lg">API Key Not Found</h4>
            <p className="text-sm opacity-80">Please ensure you have set the <code className="bg-black/40 px-2 py-0.5 rounded text-red-400">API_KEY</code> environment variable in your deployment dashboard.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="glass-morphism rounded-[3rem] overflow-hidden transition-all duration-500 hover:border-white/20">
            <Dropzone 
              onFilesSelected={handleFilesSelected} 
              isProcessing={isProcessingBatch} 
            />
          </section>

          {candidates.length > 0 && (
            <section className="glass-morphism rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center justify-between p-10 border-b border-white/10">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Globe size={24} className="text-blue-500" />
                  Extracted Database
                </h2>
                <div className="hidden sm:flex items-center gap-2">
                   <Zap size={14} className="text-yellow-400" />
                   <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                     Neural Processing Active
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

        <aside className="space-y-8">
          <div className="glass-morphism rounded-[2.5rem] p-10 sticky top-10 border border-white/10">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <ShieldCheck className="text-blue-400" size={24} />
                Real-time Stats
              </h3>
              {isProcessingBatch && <Loader2 size={24} className="animate-spin text-blue-500" />}
            </div>
            
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Files in Queue</span>
                <span className="text-2xl font-black text-white">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center relative">
                <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Active Pipeline</span>
                <div className="relative">
                  {stats.processing > 0 && (
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl processing-pulse rounded-full" />
                  )}
                  <span className={`text-2xl font-black relative z-10 ${stats.processing > 0 ? 'text-blue-400' : 'text-white/40'}`}>
                    {stats.processing}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Successful</span>
                <span className="text-2xl font-black text-white">{stats.completed}</span>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              {stats.failed > 0 && (
                <button 
                  onClick={retryFailed}
                  className="w-full py-5 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] text-sm transition-all flex items-center justify-center gap-3 font-black shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  <RefreshCw size={20} />
                  Retry Failures
                </button>
              )}
              {processingFiles.length > 0 && (
                <button 
                  onClick={() => setProcessingFiles(prev => prev.filter(f => f.status !== ProcessingStatus.COMPLETED && f.status !== ProcessingStatus.FAILED))}
                  className="w-full py-5 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.5rem] text-sm transition-all flex items-center justify-center gap-3 font-bold active:scale-[0.98]"
                >
                  <Trash2 size={20} />
                  Clear History
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {processingFiles.map((pf) => (
              <div key={pf.id} className="glass-morphism-dark rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group border border-white/5 hover:border-white/20 transition-all">
                {(pf.status === ProcessingStatus.READING || pf.status === ProcessingStatus.EXTRACTING) && (
                  <div className="absolute inset-0 bg-blue-500/5 animate-scan pointer-events-none" />
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-3 rounded-2xl relative ${pf.status === ProcessingStatus.FAILED ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                      <FileText size={20} className={pf.status === ProcessingStatus.FAILED ? 'text-red-400' : 'text-blue-400'} />
                      {(pf.status === ProcessingStatus.READING || pf.status === ProcessingStatus.EXTRACTING) && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                      )}
                    </div>
                    <span className="text-sm font-bold truncate text-white/80">{pf.file.name}</span>
                  </div>
                  <button 
                    onClick={() => setProcessingFiles(prev => prev.filter(f => f.id !== pf.id))}
                    className="text-white/20 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {pf.error ? (
                  <p className="text-[10px] text-red-400 font-bold bg-red-950/20 p-4 rounded-2xl border border-red-500/10 italic">
                    {pf.error}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-white/30 tracking-widest">
                      <span>{pf.status}</span>
                      <span>{pf.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out bg-blue-500 ${pf.status === ProcessingStatus.EXTRACTING ? 'animate-pulse' : ''}`}
                        style={{ width: `${pf.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="mt-24 text-center text-white/20 font-black text-[10px] uppercase tracking-[0.6em]">
        <p>@Elius 2026</p>
      </footer>
    </div>
  );
};

export default App;