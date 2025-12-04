export type GenerationType = 'text-to-video' | 'image-to-video' | 'text-to-image';
export type GenerationStatus = 'processing' | 'completed' | 'failed';

export interface GenerationParams {
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  quality?: 'standard' | 'high';
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

export interface JobStatus {
  jobId: string;
  status: GenerationStatus;
  progress?: number;
  mediaUrl?: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  type: GenerationType;
  prompt: string;
  sourceFileUrl?: string;
  mediaUrl: string;
  mediaType: string;
  status: GenerationStatus;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}
