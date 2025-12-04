import { createApp } from './app.js';
import { config, validateConfig } from './config/env.js';
import { initializeDatabase } from './database/connection.js';
import fs from 'fs';
import path from 'path';

async function startServer(): Promise<void> {
  try {
    // Validate environment configuration
    console.log('Validating configuration...');
    validateConfig();

    // Create necessary directories
    const dirs = [config.storage.mediaPath, path.dirname(config.storage.databasePath)];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    // Initialize database
    console.log('Initializing database...');
    initializeDatabase();

    // Validate AWS credentials
    console.log('Validating AWS credentials...');
    const { getBedrockClient } = await import('./services/bedrock.client.js');
    const bedrockClient = getBedrockClient();
    const credentialsValid = await bedrockClient.validateCredentials();

    if (!credentialsValid) {
      console.error('\n❌ AWS credentials validation failed!\n');
      console.error('Please ensure the following environment variables are set correctly:');
      console.error('  - AWS_ACCESS_KEY_ID');
      console.error('  - AWS_SECRET_ACCESS_KEY');
      console.error('  - AWS_REGION\n');
      console.error('Note: ASSUME_ROLE_ARN is optional. If role assumption fails,');
      console.error('the application will use direct credentials.\n');
      console.error('Check the backend/.env.example file for reference.\n');
      process.exit(1);
    }

    console.log('✓ AWS credentials configured');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.app.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Nova Reel Media Generator - Backend Server               ║
║                                                            ║
║   Status: Running                                          ║
║   Port: ${config.app.port}                                 ║
║   Environment: ${config.app.nodeEnv}                       ║
║   Frontend URL: ${config.app.frontendUrl}                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
