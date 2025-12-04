import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { config } from '../config/env.js';

export interface BedrockCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface BedrockResponse {
  body: Uint8Array;
  contentType?: string;
}

export class BedrockClient {
  private client: BedrockRuntimeClient | null = null;
  private credentials: BedrockCredentials | null = null;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize the Bedrock client with credentials
   */
  private initializeClient(): void {
    this.client = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  /**
   * Assume an IAM role and update credentials
   */
  async assumeRole(roleArn: string): Promise<BedrockCredentials> {
    const stsClient = new STSClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });

    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: 'nova-reel-media-generator',
      DurationSeconds: 3600, // 1 hour
    });

    try {
      const response = await stsClient.send(command);

      if (!response.Credentials) {
        throw new Error('Failed to assume role: No credentials returned');
      }

      this.credentials = {
        accessKeyId: response.Credentials.AccessKeyId!,
        secretAccessKey: response.Credentials.SecretAccessKey!,
        sessionToken: response.Credentials.SessionToken,
      };

      // Reinitialize client with new credentials
      this.client = new BedrockRuntimeClient({
        region: config.aws.region,
        credentials: this.credentials,
      });

      return this.credentials;
    } catch (error) {
      console.error('Error assuming role:', error);
      throw new Error(`Failed to assume role: ${(error as Error).message}`);
    }
  }

  /**
   * Validate that credentials are configured and working
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // If role ARN is configured, try to assume the role
      if (config.aws.assumeRoleArn) {
        try {
          await this.assumeRole(config.aws.assumeRoleArn);
          console.log('✓ Successfully assumed role');
        } catch (roleError) {
          console.warn('⚠ Failed to assume role, will use direct credentials:', (roleError as Error).message);
          // Continue with direct credentials instead of failing
        }
      }

      // Validate that we have a client initialized
      return this.client !== null;
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Invoke a Bedrock model
   */
  async invokeModel(modelId: string, payload: unknown): Promise<BedrockResponse> {
    if (!this.client) {
      throw new Error('Bedrock client not initialized');
    }

    const input: InvokeModelCommandInput = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      return {
        body: response.body,
        contentType: response.contentType,
      };
    } catch (error) {
      console.error('Error invoking model:', error);
      
      // Parse AWS SDK errors
      const err = error as any;
      if (err.name === 'ValidationException') {
        throw new Error(`Invalid request: ${err.message}`);
      } else if (err.name === 'ThrottlingException') {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (err.name === 'AccessDeniedException') {
        throw new Error('Access denied. Please check your AWS credentials and permissions.');
      } else {
        throw new Error(`Failed to invoke model: ${err.message}`);
      }
    }
  }

  /**
   * Start an async invocation for video generation
   */
  async startAsyncInvoke(
    modelId: string,
    modelInput: unknown,
    outputS3Uri: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Bedrock client not initialized');
    }

    try {
      const command = new StartAsyncInvokeCommand({
        modelId,
        modelInput,
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: outputS3Uri,
          },
        },
      });

      const response = await this.client.send(command);
      return response.invocationArn!;
    } catch (error) {
      console.error('Error starting async invoke:', error);
      const err = error as any;
      throw new Error(`Failed to start async invocation: ${err.message}`);
    }
  }

  /**
   * Get async invocation status
   */
  async getAsyncInvokeStatus(invocationArn: string): Promise<any> {
    if (!this.client) {
      throw new Error('Bedrock client not initialized');
    }

    try {
      const command = new GetAsyncInvokeCommand({
        invocationArn,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error getting async invoke status:', error);
      const err = error as any;
      throw new Error(`Failed to get async invocation status: ${err.message}`);
    }
  }

  /**
   * Get the current credentials (for testing purposes)
   */
  getCredentials(): BedrockCredentials | null {
    return this.credentials;
  }
}

// Singleton instance
let bedrockClientInstance: BedrockClient | null = null;

export function getBedrockClient(): BedrockClient {
  if (!bedrockClientInstance) {
    bedrockClientInstance = new BedrockClient();
  }
  return bedrockClientInstance;
}
