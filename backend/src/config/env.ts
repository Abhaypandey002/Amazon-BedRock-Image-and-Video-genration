import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    assumeRoleArn: process.env.ASSUME_ROLE_ARN || '',
  },

  // Application Configuration
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // Storage Configuration
  storage: {
    mediaPath: path.resolve(process.env.MEDIA_STORAGE_PATH || './media'),
    databasePath: path.resolve(process.env.DATABASE_PATH || './data/app.db'),
    outputS3Bucket: process.env.OUTPUT_S3_BUCKET || 'nova-reel-output-videos',
  },

  // Generation Configuration
  generation: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    maxPromptTokens: parseInt(process.env.MAX_PROMPT_TOKENS || '512', 10),
    timeoutMs: parseInt(process.env.GENERATION_TIMEOUT_MS || '300000', 10),
  },
};

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
        'Please create a .env file in the backend directory with the following variables:\n' +
        required.map((key) => `${key}=<your-value>`).join('\n') +
        '\n\nNote: ASSUME_ROLE_ARN is optional for root accounts'
    );
  }
}
