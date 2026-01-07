
import React, { useState, useMemo } from 'react';
import { CandidateData } from '../types';
import { Search, Download, Copy, Trash2, ArrowUpDown, Check, Mail, FileText, ChevronDown } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidates, emails, or files..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full text-sm font-medium"
            >
              <Download size={18} />
              Export Data
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                <button 
                  onClick={() => { exportToCSV(filteredData); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText size={16} className="text-gray-500" /> Export as CSV
                </button>
                <button 
                  onClick={() => { exportToExcel(filteredData); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText size={16} className="text-green-600" /> Export as Excel
                </button>
                <button 
                  onClick={() => { exportToPDF(filteredData); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText size={16} className="text-red-500" /> Export as PDF
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onClearAll}
            className="px-4 py-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-2">
                  Email
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('filename')}>
                <div className="flex items-center gap-2">
                  Source File
                  <ArrowUpDown size={14} className="text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredData.length > 0 ? (
              filteredData.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {candidate.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {candidate.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic">
                    {candidate.filename}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(`${candidate.name} <${candidate.email}>`, candidate.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors title='Copy contact'"
                      >
                        {copiedId === candidate.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => onDelete(candidate.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="opacity-20" />
                    <p>{searchTerm ? 'No matches found for your search.' : 'No candidates processed yet.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <span>Showing {filteredData.length} of {data.length} candidates</span>
        <span>Deduplication active (based on email)</span>
      </div>
    </div>
  );
};

export default DataTable;
