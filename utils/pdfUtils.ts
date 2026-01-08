// @ts-ignore - Global pdfjsLib from script tag in index.html
const pdfjsLib = window.pdfjsLib;

if (pdfjsLib) {
  // Explicitly setting the worker source to match the library version from index.html
  // This prevents the library from trying to find the worker file in the local 'dist' folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export async function extractTextFromPdf(file: File): Promise<string> {
  if (!pdfjsLib) {
    throw new Error("PDF processing library is unavailable. Please check your internet connection and reload.");
  }
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    // We use a loading task to have better control over the promise lifecycle
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Prevents some worker-related 404 warnings in specific environments
      disableAutoFetch: true,
      disableStream: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    // Extract text from the first 3 pages (usually enough for header/contact info)
    const pagesToScan = Math.min(pdf.numPages, 3);
    
    for (let i = 1; i <= pagesToScan; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Could not parse PDF. The file might be encrypted or corrupted.");
  }
}