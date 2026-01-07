
export enum ProcessingStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface CandidateData {
  id: string;
  name: string;
  email: string;
  filename: string;
  processedAt: Date;
}

export interface ProcessingFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  result?: Partial<CandidateData>;
}

export interface ExtractionResult {
  name: string;
  email: string;
}
