
import React, { useState, useMemo } from 'react';
import { CandidateData } from '../types';
// Added CheckCircle2 to the imports from lucide-react
import { Search, Download, Copy, Trash2, ArrowUpDown, Check, Mail, FileText, ChevronDown, CheckCircle2 } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

interface DataTableProps {
  data: CandidateData[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onDelete, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof CandidateData, direction: 'asc' | 'desc' } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-transparent overflow-hidden">
      <div className="p-6 border-b border-white/20 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidates..."
            className="w-full pl-12 pr-4 py-2.5 bg-white/40 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all text-sm font-medium placeholder-gray-500"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all w-full text-sm font-bold shadow-lg shadow-blue-600/20"
            >
              <Download size={18} />
              Export
              <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => { exportToCSV(filteredData); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 font-semibold text-gray-700 transition-colors"
                >
                  <FileText size={18} className="text-gray-500" /> Export CSV
                </button>
                <button 
                  onClick={() => { exportToExcel(filteredData); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left text-sm hover:bg-green-50 flex items-center gap-3 font-semibold text-gray-700 transition-colors border-t border-gray-100"
                >
                  <FileText size={18} className="text-green-600" /> Export Excel
                </button>
                <button 
                  onClick={() => { exportToPDF(filteredData); setShowExportMenu(false); }}
                  className="w-full px-5 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 font-semibold text-gray-700 transition-colors border-t border-gray-100"
                >
                  <FileText size={18} className="text-red-500" /> Export PDF
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onClearAll}
            className="px-6 py-2.5 bg-white/40 text-gray-700 hover:text-red-600 hover:bg-red-50/50 border border-white/40 rounded-xl transition-all text-sm font-bold flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/20 text-gray-600 text-[10px] font-bold uppercase tracking-widest border-b border-white/20">
              <th className="px-8 py-5 cursor-pointer hover:bg-white/30 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">Name <ArrowUpDown size={14} className="opacity-50" /></div>
              </th>
              <th className="px-8 py-5 cursor-pointer hover:bg-white/30 transition-colors" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-2">Email <ArrowUpDown size={14} className="opacity-50" /></div>
              </th>
              <th className="px-8 py-5 cursor-pointer hover:bg-white/30 transition-colors" onClick={() => handleSort('filename')}>
                <div className="flex items-center gap-2">Source <ArrowUpDown size={14} className="opacity-50" /></div>
              </th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 text-sm">
            {filteredData.length > 0 ? (
              filteredData.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-white/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/20">
                        {candidate.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-gray-700 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-blue-500 opacity-60" />
                      {candidate.email}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-gray-600 font-medium opacity-80 italic">
                    {candidate.filename}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => copyToClipboard(`${candidate.name} <${candidate.email}>`, candidate.id)}
                        className="p-2.5 text-gray-500 hover:text-blue-600 bg-white/50 hover:bg-white rounded-xl transition-all shadow-sm border border-white/20"
                        title="Copy contact"
                      >
                        {copiedId === candidate.id ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => onDelete(candidate.id)}
                        className="p-2.5 text-gray-500 hover:text-red-600 bg-white/50 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-white/20"
                        title="Remove candidate"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-gray-600">
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <Search size={48} className="text-gray-400" />
                    <p className="font-bold text-lg">{searchTerm ? 'No results found.' : 'Waiting for resumes...'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-5 border-t border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-widest text-gray-600 flex justify-between items-center">
        <span>{filteredData.length} Candidates Loaded</span>
        {/* Fixed missing CheckCircle2 reference */}
        <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-600" /> AI-Powered Deduplication</span>
      </div>
    </div>
  );
};

export default DataTable;
