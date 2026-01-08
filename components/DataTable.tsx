import React, { useState, useMemo, useEffect } from 'react';
import { CandidateData } from '../types';
import { 
  Search, Download, Copy, Trash2, ArrowUpDown, Check, Mail, 
  FileText, ChevronDown, CheckCircle2, CopyCheck, Code, Bell,
  AlertTriangle, X
} from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

interface DataTableProps {
  data: CandidateData[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDelete, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof CandidateData, direction: 'asc' | 'desc' } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerSearch) || 
        item.email.toLowerCase().includes(lowerSearch) ||
        item.filename.toLowerCase().includes(lowerSearch)
      );
    }
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key]).toLowerCase();
        const valB = String(b[sortConfig.key]).toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, searchTerm, sortConfig]);

  const handleSort = (key: keyof CandidateData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToast(`${label} copied!`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyAllToClipboard = () => {
    if (filteredData.length === 0) return;
    const text = filteredData.map(c => `${c.name}\t${c.email}`).join('\n');
    navigator.clipboard.writeText(text);
    setToast("Full list copied to clipboard!");
  };

  const exportToJSON = () => {
    const jsonString = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates_${Date.now()}.json`;
    link.click();
    setShowExportMenu(false);
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowClearConfirm(false);
    setToast("Database cleared successfully");
  };

  return (
    <div className="bg-transparent overflow-hidden relative">
      {/* Custom Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative glass-morphism border-red-500/20 rounded-[2.5rem] p-10 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
                <AlertTriangle size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Clear Database?</h3>
                <p className="text-white/40 font-medium">This action will permanently delete all extracted candidate records. This cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmClearAll}
                  className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black transition-all shadow-lg shadow-red-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowClearConfirm(false)}
              className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification System */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl">
            <Bell size={18} className="text-blue-400" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-white/20 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all text-sm font-medium placeholder-white/30 text-white"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={copyAllToClipboard}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-bold border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <Copy size={18} />
            Copy All
          </button>

          <div className="relative flex-1 lg:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all w-full text-sm font-bold shadow-lg shadow-blue-600/20"
            >
              <Download size={18} />
              Export
              <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { exportToCSV(filteredData); setShowExportMenu(false); }} className="w-full px-5 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 font-semibold text-white/70 transition-colors">
                  <FileText size={18} className="text-white/30" /> Export CSV
                </button>
                <button onClick={() => { exportToExcel(filteredData); setShowExportMenu(false); }} className="w-full px-5 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 font-semibold text-white/70 transition-colors border-t border-white/5">
                  <FileText size={18} className="text-blue-400" /> Export Excel
                </button>
                <button onClick={() => { exportToPDF(filteredData); setShowExportMenu(false); }} className="w-full px-5 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 font-semibold text-white/70 transition-colors border-t border-white/5">
                  <FileText size={18} className="text-red-400" /> Export PDF
                </button>
                <button onClick={exportToJSON} className="w-full px-5 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 font-semibold text-white/70 transition-colors border-t border-white/5">
                  <Code size={18} className="text-purple-400" /> Export JSON
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-5 py-2.5 bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-400/10 border border-white/10 rounded-xl transition-all text-sm font-bold flex items-center gap-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
              <th className="px-8 py-5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">Name <ArrowUpDown size={14} className="opacity-30" /></div>
              </th>
              <th className="px-8 py-5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-2">Email <ArrowUpDown size={14} className="opacity-30" /></div>
              </th>
              <th className="px-8 py-5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('filename')}>
                <div className="flex items-center gap-2">Source <ArrowUpDown size={14} className="opacity-30" /></div>
              </th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {filteredData.length > 0 ? (
              filteredData.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-white/5 transition-all group duration-300">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-blue-500/10">
                        {candidate.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white/90">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => copyToClipboard(candidate.email, `e-${candidate.id}`, 'Email')}
                      className="flex items-center gap-2 group/email text-white/70 font-medium hover:text-blue-400 transition-colors"
                    >
                      <Mail size={16} className={`transition-all ${copiedId === `e-${candidate.id}` ? 'text-blue-400 scale-110' : 'text-blue-500 opacity-60'}`} />
                      <span className={copiedId === `e-${candidate.id}` ? 'text-blue-400 font-bold' : ''}>{candidate.email}</span>
                    </button>
                  </td>
                  <td className="px-8 py-5 text-white/40 font-medium italic truncate max-w-[200px]" title={candidate.filename}>
                    {candidate.filename}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => copyToClipboard(`${candidate.name} <${candidate.email}>`, candidate.id, 'Candidate info')}
                        className="p-2.5 text-white/30 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                        title="Copy to clipboard"
                      >
                        {copiedId === candidate.id ? <Check size={18} className="text-blue-400" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => onDelete(candidate.id)}
                        className="p-2.5 text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-xl transition-all border border-white/5"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-6 opacity-20">
                    <div className="p-8 bg-white/5 rounded-full">
                      <Search size={64} className="text-white" />
                    </div>
                    <div>
                      <p className="font-black text-2xl text-white">No data available</p>
                      <p className="text-white/60 mt-2 font-medium">Upload resumes to begin automated extraction</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-5 border-t border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/30 flex justify-between items-center backdrop-blur-md">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          {filteredData.length} records in current view
        </span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-400" /> Enterprise Data Sync Ready</span>
      </div>
    </div>
  );
};

export default DataTable;