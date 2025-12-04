export type GenerationType = 'text-to-video' | 'image-to-video' | 'text-to-image';
export type GenerationStatus = 'processing' | 'completed' | 'failed';

export interface GenerationParams {
  // Video parameters
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  
  // Image parameters
  width?: number;
  height?: number;
  quality?: 'standard' | 'high';
  cfgScale?: number;
}

export interface GenerationResult {
  jobId: string;
  status: GenerationStatus;
  mediaUrl?: string;
  mediaType?: string;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    duration?: number;
    size?: number;
    dimensions?: { width: number; height: number };
  };
}

export interface GenerationRecord {
  id: string;
  type: GenerationType;
  prompt: string;
  sourceFilePath?: string;
  mediaFilePath: string;
  mediaType: string;
  status: GenerationStatus;
  errorMessage?: string;
  metadata?: string;
  createdAt: Date;
}

export interface JobStatus {
  jobId: string;
  status: GenerationStatus;
  progress?: number;
  mediaUrl?: string;
  error?: string;
}
