import { v4 as uuidv4 } from 'uuid';
import { getBedrockClient } from './bedrock.client.js';
import { getFileService } from './file.service.js';
import { config } from '../config/env.js';
import { validatePromptTokens } from '../utils/tokenCounter.js';
import { enhancePrompt, validateAndCleanPrompt } from '../utils/promptEnhancer.js';
import {
  GenerationParams,
  GenerationResult,
  GenerationStatus,
  JobStatus,
} from '../types/generation.types.js';
import path from 'path';
import https from 'https';
import http from 'http';
import fs from 'fs';

// In-memory job tracking (in production, use Redis or similar)
interface JobInfo extends JobStatus {
  createdAt: number;
  invocationArn?: string;
  s3Uri?: string;
  timeout?: NodeJS.Timeout;
}

const jobs = new Map<string, JobInfo>();

export class GenerationService {
  private bedrockClient = getBedrockClient();
  private fileService = getFileService();
  private readonly modelId = 'amazon.nova-reel-v1:0';
  private readonly outputS3Uri = `s3://${config.storage.outputS3Bucket}`;

  /**
   * Generate video from text prompt using async job
   */
  async generateTextToVideo(
    prompt: string,
    params?: GenerationParams
  ): Promise<GenerationResult> {
    console.log('🔵 [SERVICE CHECKPOINT 1] generateTextToVideo called');
    console.log('Prompt:', prompt);
    console.log('Params:', params);

    // Validate and clean prompt
    const validation = validateAndCleanPrompt(prompt);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate prompt tokens
    const tokenValidation = validatePromptTokens(validation.cleaned, config.generation.maxPromptTokens);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error);
    }

    // Generate job ID
    const jobId = uuidv4();
    console.log('🔵 [SERVICE CHECKPOINT 2] Generated jobId:', jobId);

    // Initialize job status
    const timeout = setTimeout(() => {
      this.handleJobTimeout(jobId);
    }, config.generation.timeoutMs);

    jobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
      timeout,
    });

    console.log('🔵 [SERVICE CHECKPOINT 3] Job created in memory');
    console.log('🔵 [SERVICE CHECKPOINT 4] Starting text-to-video generation with Nova Reel...');

    // Start async generation in background
    this.processTextToVideoAsync(jobId, prompt, params).catch((error) => {
      console.error(`❌ Job ${jobId} failed:`, error);
      jobs.set(jobId, {
        ...jobs.get(jobId)!,
        status: 'failed',
        error: error.message,
      });
    });

    // Return immediately with processing status
    return {
      jobId,
      status: 'processing',
    };
  }

  /**
   * Process text-to-video generation asynchronously
   */
  private async processTextToVideoAsync(
    jobId: string,
    prompt: string,
    params?: GenerationParams
  ): Promise<void> {
    try {
      console.log('🔵 [VIDEO GEN 1] Starting Nova Reel text-to-video generation');

      // Enhance the prompt for better results
      const enhancedPrompt = enhancePrompt(prompt, {
        style: 'cinematic',
        quality: params?.quality || 'standard',
        mediaType: 'video',
      });

      // Generate random seed
      const seed = Math.floor(Math.random() * 2147483646);

      // Prepare model input
      const modelInput = {
        taskType: 'TEXT_VIDEO',
        textToVideoParams: {
          text: enhancedPrompt,
        },
        videoGenerationConfig: {
          fps: 24,
          durationSeconds: params?.duration || 6,
          dimension: this.mapAspectRatioToDimension(params?.aspectRatio),
          seed,
        },
      };

      console.log('🔵 [VIDEO GEN 2] Invoking Nova Reel model...');
      console.log('Model config:', {
        taskType: modelInput.taskType,
        duration: modelInput.videoGenerationConfig.durationSeconds,
        dimension: modelInput.videoGenerationConfig.dimension,
        seed,
      });

      // Start async invocation
      const invocationArn = await this.bedrockClient.startAsyncInvoke(
        this.modelId,
        modelInput,
        this.outputS3Uri
      );

      console.log('✅ [VIDEO GEN 3] Async invocation started, ARN:', invocationArn);

      // Update job with invocation ARN
      const job = jobs.get(jobId);
      if (job) {
        jobs.set(jobId, {
          ...job,
          invocationArn,
        });
      }

      console.log('🔵 [VIDEO GEN 4] Starting polling for completion...');

      // Poll for completion
      await this.pollJobCompletion(jobId, invocationArn);
    } catch (error) {
      console.error('❌ [VIDEO GEN ERROR]:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion
   */
  private async pollJobCompletion(jobId: string, invocationArn: string): Promise<void> {
    const maxAttempts = 120; // 30 minutes with 15 second intervals
    let attempts = 0;

    console.log(`🔵 [POLL 1] Starting polling for job ${jobId}`);

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds
      attempts++;

      try {
        console.log(`🔵 [POLL ${attempts}] Checking job status...`);
        const jobStatus = await this.bedrockClient.getAsyncInvokeStatus(invocationArn);
        console.log(`🔵 [POLL ${attempts}] Status:`, jobStatus.status);

        if (jobStatus.status === 'Completed') {
          console.log('✅ [POLL] Job completed!');
          
          // Download video from S3 and save locally
          const s3Uri = jobStatus.outputDataConfig.s3OutputDataConfig.s3Uri;
          const videoUrl = `${s3Uri}/output.mp4`;
          
          console.log('🔵 [DOWNLOAD 1] Starting video download from S3:', videoUrl);

          // Download and save video
          const localPath = await this.downloadVideoFromS3(videoUrl, jobId);

          console.log('✅ [DOWNLOAD 2] Video downloaded successfully:', localPath);

          // Update job status
          const job = jobs.get(jobId);
          if (job) {
            this.clearJobTimeout(jobId);
            jobs.set(jobId, {
              ...job,
              status: 'completed',
              progress: 100,
              mediaUrl: `/api/media/${path.basename(localPath)}`,
              mediaType: 'video/mp4',
            });
            console.log('✅ [POLL] Job status updated to completed');
          }
          return;
        } else if (jobStatus.status === 'Failed') {
          console.error('❌ [POLL] Job failed:', jobStatus.failureMessage);
          throw new Error(jobStatus.failureMessage || 'Video generation failed');
        }

        // Update progress
        const job = jobs.get(jobId);
        if (job) {
          const progress = Math.min(90, attempts * 2);
          jobs.set(jobId, {
            ...job,
            progress,
          });
          console.log(`🔵 [POLL ${attempts}] Progress updated: ${progress}%`);
        }
      } catch (error) {
        console.error(`❌ [POLL ${attempts}] Error:`, error);
        throw error;
      }
    }

    console.error('❌ [POLL] Polling timed out after', maxAttempts, 'attempts');
    throw new Error('Job polling timed out');
  }

  /**
   * Download video from S3 URL and save locally
   */
  private async downloadVideoFromS3(s3Url: string, jobId: string): Promise<string> {
    console.log('🔵 [S3 DOWNLOAD 1] Preparing to download video from S3');
    console.log('🔵 [S3 DOWNLOAD 2] S3 URL:', s3Url);
    
    const videoPath = path.join(config.storage.mediaPath, 'videos', `${jobId}.mp4`);
    console.log('🔵 [S3 DOWNLOAD 3] Target path:', videoPath);

    // Ensure directory exists
    const dir = path.dirname(videoPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('🔵 [S3 DOWNLOAD 4] Created directory:', dir);
    }

    try {
      // Parse S3 URI: s3://bucket-name/path/to/file.mp4
      const s3UriMatch = s3Url.match(/s3:\/\/([^\/]+)\/(.+)/);
      if (!s3UriMatch) {
        throw new Error(`Invalid S3 URI format: ${s3Url}`);
      }

      const bucketName = s3UriMatch[1];
      const objectKey = s3UriMatch[2];

      console.log('🔵 [S3 DOWNLOAD 5] Bucket:', bucketName);
      console.log('🔵 [S3 DOWNLOAD 6] Object key:', objectKey);

      // Use AWS SDK to get the object
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      const s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      });

      console.log('🔵 [S3 DOWNLOAD 7] Fetching object from S3...');

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      console.log('🔵 [S3 DOWNLOAD 8] Streaming to local file...');

      // Stream the response body to file
      const writeStream = fs.createWriteStream(videoPath);
      
      // Convert response body to Node.js stream
      const bodyStream = response.Body as any;
      
      return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        
        bodyStream.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          writeStream.write(chunk);
        });

        bodyStream.on('end', () => {
          writeStream.end();
          console.log('✅ [S3 DOWNLOAD 9] Download complete, size:', downloadedBytes, 'bytes');
          resolve(videoPath);
        });

        bodyStream.on('error', (error: Error) => {
          console.error('❌ [S3 DOWNLOAD ERROR]:', error);
          writeStream.end();
          fs.unlink(videoPath, () => {}); // Delete partial file
          reject(error);
        });

        writeStream.on('error', (error: Error) => {
          console.error('❌ [S3 WRITE ERROR]:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ [S3 DOWNLOAD ERROR]:', error);
      throw error;
    }
  }

  /**
   * Map aspect ratio to dimension string
   */
  private mapAspectRatioToDimension(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9':
        return '1280x720';
      case '9:16':
        return '720x1280';
      case '1:1':
        return '1024x1024';
      default:
        return '1280x720';
    }
  }

  /**
   * Generate video from image using Amazon Nova Reel
   */
  async generateImageToVideo(
    imageBuffer: Buffer,
    prompt: string,
    params?: GenerationParams
  ): Promise<GenerationResult> {
    console.log('🔵 [SERVICE CHECKPOINT 1] generateImageToVideo called');
    console.log('Prompt:', prompt);
    console.log('Image buffer size:', imageBuffer.length, 'bytes');
    console.log('Params:', params);

    // Validate and clean prompt
    const validation = validateAndCleanPrompt(prompt);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate prompt tokens
    const tokenValidation = validatePromptTokens(validation.cleaned, config.generation.maxPromptTokens);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error);
    }

    // Generate job ID
    const jobId = uuidv4();
    console.log('🔵 [SERVICE CHECKPOINT 2] Generated jobId:', jobId);

    // Initialize job status
    const timeout = setTimeout(() => {
      this.handleJobTimeout(jobId);
    }, config.generation.timeoutMs);

    jobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
      timeout,
    });

    console.log('🔵 [SERVICE CHECKPOINT 3] Job created in memory');
    console.log('🔵 [SERVICE CHECKPOINT 4] Starting image-to-video generation with Nova Reel...');

    // Start async generation in background
    this.processImageToVideoAsync(jobId, imageBuffer, prompt, params).catch((error) => {
      console.error(`❌ Job ${jobId} failed:`, error);
      jobs.set(jobId, {
        ...jobs.get(jobId)!,
        status: 'failed',
        error: error.message,
      });
    });

    // Return immediately with processing status
    return {
      jobId,
      status: 'processing',
    };
  }

  /**
   * Process image-to-video generation asynchronously
   */
  private async processImageToVideoAsync(
    jobId: string,
    imageBuffer: Buffer,
    prompt: string,
    params?: GenerationParams
  ): Promise<void> {
    try {
      console.log('🔵 [VIDEO GEN 1] Starting Nova Reel image-to-video generation');

      // Enhance the prompt for better results
      const enhancedPrompt = enhancePrompt(prompt, {
        style: 'cinematic',
        quality: params?.quality || 'standard',
        mediaType: 'video',
      });

      // Generate random seed
      const seed = Math.floor(Math.random() * 2147483646);

      // Convert image buffer to base64
      const imageBase64 = imageBuffer.toString('base64');
      console.log('🔵 [VIDEO GEN 2] Image converted to base64');

      // Prepare model input for image-to-video
      const modelInput = {
        taskType: 'IMAGE_VIDEO',
        imageToVideoParams: {
          text: enhancedPrompt,
          images: [imageBase64],
        },
        videoGenerationConfig: {
          fps: 24,
          durationSeconds: params?.duration || 6,
          dimension: this.mapAspectRatioToDimension(params?.aspectRatio),
          seed,
        },
      };

      console.log('🔵 [VIDEO GEN 3] Invoking Nova Reel model...');
      console.log('Model config:', {
        taskType: modelInput.taskType,
        prompt,
        duration: modelInput.videoGenerationConfig.durationSeconds,
        dimension: modelInput.videoGenerationConfig.dimension,
      });

      // Start async invocation
      const invocationArn = await this.bedrockClient.startAsyncInvoke(
        this.modelId,
        modelInput,
        this.outputS3Uri
      );

      console.log('✅ [VIDEO GEN 4] Async invocation started, ARN:', invocationArn);

      // Update job with invocation ARN
      const job = jobs.get(jobId);
      if (job) {
        jobs.set(jobId, {
          ...job,
          invocationArn,
        });
      }

      console.log('🔵 [VIDEO GEN 5] Starting polling for completion...');

      // Poll for completion
      await this.pollJobCompletion(jobId, invocationArn);
    } catch (error) {
      console.error('❌ [VIDEO GEN ERROR]:', error);
      throw error;
    }
  }

  /**
   * Generate image from text prompt using Amazon Nova Canvas
   */
  async generateTextToImage(
    prompt: string,
    params?: GenerationParams
  ): Promise<GenerationResult> {
    console.log('🔵 [SERVICE CHECKPOINT 1] generateTextToImage called');
    console.log('Prompt:', prompt);
    console.log('Params:', params);
    
    // Validate and clean prompt
    const validation = validateAndCleanPrompt(prompt);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const jobId = uuidv4();
    console.log('🔵 [SERVICE CHECKPOINT 2] Generated jobId:', jobId);

    // Validate prompt tokens
    const tokenValidation = validatePromptTokens(validation.cleaned, config.generation.maxPromptTokens);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error);
    }

    // Initialize job status
    jobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
    });

    console.log('🔵 [SERVICE CHECKPOINT 3] Job created in memory');
    console.log('🔵 [SERVICE CHECKPOINT 4] Starting image generation with Nova Canvas...');

    // Start async generation in background
    this.processTextToImageAsync(jobId, prompt, params).catch((error) => {
      console.error(`❌ Job ${jobId} failed:`, error);
      jobs.set(jobId, {
        ...jobs.get(jobId)!,
        status: 'failed',
        error: error.message,
      });
    });

    // Return immediately with processing status
    return {
      jobId,
      status: 'processing',
    };
  }

  /**
   * Process text-to-image generation asynchronously using Amazon Nova Canvas
   */
  private async processTextToImageAsync(
    jobId: string,
    prompt: string,
    params?: GenerationParams
  ): Promise<void> {
    try {
      console.log('🔵 [IMAGE GEN 1] Starting Nova Canvas image generation');
      
      // Enhance the prompt for better results
      const enhancedPrompt = enhancePrompt(prompt, {
        style: 'photorealistic',
        quality: params?.quality || 'standard',
        mediaType: 'image',
      });
      
      // Use Amazon Nova Canvas model for image generation
      const modelId = 'amazon.nova-canvas-v1:0';
      
      // Prepare model input for Nova Canvas
      const modelInput = {
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: enhancedPrompt,
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: params?.quality || 'standard',
          height: params?.height || 1024,
          width: params?.width || 1024,
          cfgScale: params?.cfgScale || 8.0,
          seed: Math.floor(Math.random() * 2147483646),
        },
      };

      console.log('🔵 [IMAGE GEN 2] Invoking Nova Canvas model...');
      console.log('Model input:', JSON.stringify(modelInput, null, 2));

      // Invoke the model synchronously (Nova Canvas supports sync invocation)
      const response = await this.bedrockClient.invokeModel(modelId, modelInput);

      console.log('✅ [IMAGE GEN 3] Model invocation successful');

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('🔵 [IMAGE GEN 4] Response parsed:', responseBody);

      if (!responseBody.images || responseBody.images.length === 0) {
        throw new Error('No images returned from model');
      }

      // Get the base64 image data
      const imageBase64 = responseBody.images[0];
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      console.log('🔵 [IMAGE GEN 5] Image data received, size:', imageBuffer.length, 'bytes');

      // Save image to local storage
      const imagePath = path.join(config.storage.mediaPath, 'images', `${jobId}.png`);
      
      // Ensure directory exists
      const dir = path.dirname(imagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(imagePath, imageBuffer);
      console.log('✅ [IMAGE GEN 6] Image saved to:', imagePath);

      // Update job status
      const job = jobs.get(jobId);
      if (job) {
        jobs.set(jobId, {
          ...job,
          status: 'completed',
          progress: 100,
          mediaUrl: `/api/media/${path.basename(imagePath)}`,
          mediaType: 'image/png',
          metadata: {
            model: modelId,
            seed: modelInput.imageGenerationConfig.seed,
          },
        });
        console.log('✅ [IMAGE GEN 7] Job status updated to completed');
      }
    } catch (error) {
      console.error('❌ [IMAGE GEN ERROR]:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = jobs.get(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    return {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      mediaUrl: job.mediaUrl,
      error: job.error,
    };
  }

  /**
   * Handle job timeout
   */
  private handleJobTimeout(jobId: string): void {
    const job = jobs.get(jobId);
    if (job && job.status === 'processing') {
      jobs.set(jobId, {
        ...job,
        status: 'failed',
        error: 'Generation timed out. Please try again with a simpler prompt.',
      });
    }
  }

  /**
   * Clear job timeout
   */
  private clearJobTimeout(jobId: string): void {
    const job = jobs.get(jobId);
    if (job?.timeout) {
      clearTimeout(job.timeout);
    }
  }

  /**
   * Clean up old jobs from memory
   */
  cleanupOldJobs(maxAgeMs: number = 3600000): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [jobId, job] of jobs.entries()) {
      if (now - job.createdAt > maxAgeMs) {
        this.clearJobTimeout(jobId);
        jobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
let generationServiceInstance: GenerationService | null = null;

export function getGenerationService(): GenerationService {
  if (!generationServiceInstance) {
    generationServiceInstance = new GenerationService();
  }
  return generationServiceInstance;
}
