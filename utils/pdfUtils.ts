// @ts-ignore - Global pdfjsLib from script tag
const pdfjsLib = window.pdfjsLib;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export async function extractTextFromPdf(file: File): Promise<string> {
  if (!pdfjsLib) {
    throw new Error("PDF.js library not loaded");
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  // Extract text from the first 3 pages usually enough for header info
  const pagesToScan = Math.min(pdf.numPages, 3);
  
  for (let i = 1; i <= pagesToScan; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
}