import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GenerationResult,
  GenerationParams,
  JobStatus,
  HistoryResponse,
  ApiError,
} from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds for API calls
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth tokens here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error: ApiError }>) => {
        // Handle network errors
        if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        }

        // Extract error from response
        const apiError = error.response.data?.error;
        if (apiError) {
          const err = new Error(apiError.message) as Error & { code?: string; retryable?: boolean };
          err.code = apiError.code;
          err.retryable = apiError.retryable;
          throw err;
        }

        throw error;
      }
    );
  }

  /**
   * Generate video from text prompt
   */
  async generateTextToVideo(
    prompt: string,
    parameters?: GenerationParams
  ): Promise<GenerationResult> {
    const response = await this.client.post<GenerationResult>('/generate/text-to-video', {
      prompt,
      parameters,
    });
    return response.data;
  }

  /**
   * Generate video from image
   */
  async generateImageToVideo(
    file: File,
    prompt: string,
    parameters?: GenerationParams
  ): Promise<GenerationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', prompt);
    if (parameters) {
      formData.append('parameters', JSON.stringify(parameters));
    }

    const response = await this.client.post<GenerationResult>(
      '/generate/image-to-video',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for generation
      }
    );
    return response.data;
  }

  /**
   * Generate image from text prompt
   */
  async generateTextToImage(
    prompt: string,
    parameters?: GenerationParams
  ): Promise<GenerationResult> {
    const response = await this.client.post<GenerationResult>('/generate/text-to-image', {
      prompt,
      parameters,
    });
    return response.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await this.client.get<JobStatus>(`/generate/status/${jobId}`);
    return response.data;
  }

  /**
   * Get generation history
   */
  async getHistory(limit: number = 50, offset: number = 0): Promise<HistoryResponse> {
    const response = await this.client.get<HistoryResponse>('/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  /**
   * Delete history item
   */
  async deleteHistoryItem(id: string): Promise<void> {
    await this.client.delete(`/history/${id}`);
  }

  /**
   * Get media URL
   */
  getMediaUrl(filename: string): string {
    return `${API_BASE_URL}/api/media/${filename}`;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
