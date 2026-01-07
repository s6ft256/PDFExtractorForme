
import { CandidateData } from '../types';

declare const XLSX: any;
declare const jspdf: any;

export const exportToCSV = (data: CandidateData[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    Name: item.name,
    Email: item.email,
    'Source File': item.filename,
    'Processed Date': item.processedAt.toLocaleString()
  })));
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `extracto_candidates_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: CandidateData[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    Name: item.name,
    Email: item.email,
    'Source File': item.filename,
    'Processed Date': item.processedAt.toLocaleString()
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
  XLSX.writeFile(workbook, `extracto_candidates_${Date.now()}.xlsx`);
};

export const exportToPDF = (data: CandidateData[]) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Extracted Candidate Data", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

  const tableData = data.map(item => [
    item.name,
    item.email,
    item.filename,
    item.processedAt.toLocaleDateString()
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Name', 'Email', 'Source File', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`extracto_candidates_${Date.now()}.pdf`);
};
