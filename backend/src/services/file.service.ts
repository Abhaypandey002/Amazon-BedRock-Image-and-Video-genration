import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface SavedFile {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
}

// Supported file formats for Nova Reel
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const SUPPORTED_DOCUMENT_FORMATS = ['application/pdf'];

const SUPPORTED_FORMATS = [...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_DOCUMENT_FORMATS];

// File extension to MIME type mapping
const MIME_TYPE_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export class FileService {
  private mediaPath: string;
  private maxFileSizeBytes: number;

  constructor() {
    this.mediaPath = config.storage.mediaPath;
    this.maxFileSizeBytes = config.generation.maxFileSizeMB * 1024 * 1024;

    // Ensure media directory exists
    this.ensureDirectoryExists(this.mediaPath);
  }

  /**
   * Ensure a directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Validate file format
   */
  validateFileFormat(mimeType: string): FileValidationResult {
    if (!SUPPORTED_FORMATS.includes(mimeType)) {
      return {
        valid: false,
        error: `Unsupported file format: ${mimeType}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
      };
    }
    return { valid: true };
  }

  /**
   * Validate file size
   */
  validateFileSize(sizeBytes: number): FileValidationResult {
    if (sizeBytes > this.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${config.generation.maxFileSizeMB}MB. File size: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`,
      };
    }
    return { valid: true };
  }

  /**
   * Validate a file (format and size)
   */
  validateFile(mimeType: string, sizeBytes: number): FileValidationResult {
    const formatValidation = this.validateFileFormat(mimeType);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    const sizeValidation = this.validateFileSize(sizeBytes);
    if (!sizeValidation.valid) {
      return sizeValidation;
    }

    return { valid: true };
  }

  /**
   * Save an uploaded file
   */
  async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    subfolder?: string
  ): Promise<SavedFile> {
    // Validate file
    const validation = this.validateFile(mimeType, buffer.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique filename
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;

    // Determine save path
    const savePath = subfolder
      ? path.join(this.mediaPath, subfolder)
      : this.mediaPath;

    this.ensureDirectoryExists(savePath);

    const filePath = path.join(savePath, filename);

    // Save file
    await fs.promises.writeFile(filePath, buffer);

    return {
      filename,
      path: filePath,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Get file path
   */
  getFilePath(filename: string, subfolder?: string): string {
    if (subfolder) {
      return path.join(this.mediaPath, subfolder, filename);
    }
    return path.join(this.mediaPath, filename);
  }

  /**
   * Check if file exists
   */
  fileExists(filename: string, subfolder?: string): boolean {
    const filePath = this.getFilePath(filename, subfolder);
    return fs.existsSync(filePath);
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string, subfolder?: string): Promise<boolean> {
    const filePath = this.getFilePath(filename, subfolder);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get MIME type from file extension
   */
  getMimeTypeFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPE_MAP[ext] || 'application/octet-stream';
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    const files = await fs.promises.readdir(this.mediaPath);

    for (const file of files) {
      const filePath = path.join(this.mediaPath, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isFile() && stats.mtime < cutoffDate) {
        try {
          await fs.promises.unlink(filePath);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting old file ${filePath}:`, error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): {
    images: string[];
    documents: string[];
    all: string[];
  } {
    return {
      images: SUPPORTED_IMAGE_FORMATS,
      documents: SUPPORTED_DOCUMENT_FORMATS,
      all: SUPPORTED_FORMATS,
    };
  }
}

// Singleton instance
let fileServiceInstance: FileService | null = null;

export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}
