import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  retryable?: boolean;
}

/**
 * Parse AWS SDK errors to user-friendly messages
 */
function parseAwsError(err: any): { message: string; code: string; statusCode: number; retryable: boolean } {
  const errorName = err.name || '';
  const errorMessage = err.message || '';

  // AWS Bedrock specific errors
  if (errorName === 'ValidationException') {
    return {
      message: 'Invalid request parameters. Please check your input and try again.',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      retryable: false,
    };
  }

  if (errorName === 'ThrottlingException' || errorName === 'TooManyRequestsException') {
    return {
      message: 'Rate limit exceeded. Please wait a moment and try again.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryable: true,
    };
  }

  if (errorName === 'AccessDeniedException') {
    return {
      message: 'Access denied. Please check your AWS credentials and permissions.',
      code: 'ACCESS_DENIED',
      statusCode: 403,
      retryable: false,
    };
  }

  if (errorName === 'ResourceNotFoundException') {
    return {
      message: 'The requested resource was not found.',
      code: 'RESOURCE_NOT_FOUND',
      statusCode: 404,
      retryable: false,
    };
  }

  if (errorName === 'ServiceUnavailableException') {
    return {
      message: 'The service is temporarily unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
      retryable: true,
    };
  }

  if (errorName === 'ModelTimeoutException') {
    return {
      message: 'The model request timed out. Please try again with a simpler prompt.',
      code: 'MODEL_TIMEOUT',
      statusCode: 504,
      retryable: true,
    };
  }

  // Network errors
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
    return {
      message: 'Network connection failed. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      statusCode: 503,
      retryable: true,
    };
  }

  // Default AWS error
  if (err.$metadata || errorName.includes('Exception')) {
    return {
      message: 'An error occurred while processing your request. Please try again.',
      code: 'AWS_ERROR',
      statusCode: 500,
      retryable: true,
    };
  }

  return {
    message: errorMessage,
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    retryable: true,
  };
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error details server-side (with full stack trace)
  console.error('❌ [ERROR HANDLER CHECKPOINT] Error caught:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    name: err.name,
    fullError: err,
  });

  // Check if it's an AWS error
  let statusCode = err.statusCode || 500;
  let message = err.message;
  let code = err.code || 'INTERNAL_ERROR';
  let retryable = err.retryable !== false;

  // Parse AWS errors
  if ((err as any).$metadata || (err as any).name?.includes('Exception')) {
    const parsed = parseAwsError(err);
    statusCode = parsed.statusCode;
    message = parsed.message;
    code = parsed.code;
    retryable = parsed.retryable;
  } else if (statusCode === 500) {
    // Sanitize internal errors
    message = 'An unexpected error occurred. Please try again later.';
  }

  // Send error response (without stack trace or sensitive info)
  res.status(statusCode).json({
    error: {
      code,
      message,
      retryable,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      retryable: false,
    },
  });
}
