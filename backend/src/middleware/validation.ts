import { Request, Response, NextFunction } from 'express';
import { validatePromptTokens } from '../utils/tokenCounter.js';
import { config } from '../config/env.js';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  retryable = false;
  fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Validate prompt middleware
 */
export function validatePrompt(req: Request, res: Response, next: NextFunction): void {
  const { prompt } = req.body;

  if (!prompt) {
    return next(new ValidationError('Prompt is required', { prompt: 'Prompt is required' }));
  }

  if (typeof prompt !== 'string') {
    return next(
      new ValidationError('Prompt must be a string', { prompt: 'Prompt must be a string' })
    );
  }

  if (prompt.trim().length === 0) {
    return next(
      new ValidationError('Prompt cannot be empty', { prompt: 'Prompt cannot be empty' })
    );
  }

  // Validate token count
  const validation = validatePromptTokens(prompt, config.generation.maxPromptTokens);
  if (!validation.valid) {
    return next(new ValidationError(validation.error!, { prompt: validation.error! }));
  }

  next();
}

/**
 * Validate file upload middleware
 */
export function validateFileUpload(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    return next(new ValidationError('File is required', { file: 'File is required' }));
  }

  const file = req.file;

  // File size validation (Multer already handles this, but we can add custom message)
  const maxSize = config.generation.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return next(
      new ValidationError(
        `File size exceeds maximum allowed size of ${config.generation.maxFileSizeMB}MB`,
        {
          file: `File size exceeds maximum allowed size of ${config.generation.maxFileSizeMB}MB`,
        }
      )
    );
  }

  next();
}

/**
 * Handle multer errors
 */
export function handleMulterError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(
      new ValidationError(
        `File size exceeds maximum allowed size of ${config.generation.maxFileSizeMB}MB`,
        {
          file: `File size exceeds maximum allowed size of ${config.generation.maxFileSizeMB}MB`,
        }
      )
    );
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return next(
      new ValidationError('Unexpected file field', { file: 'Unexpected file field' })
    );
  }

  next(err);
}
