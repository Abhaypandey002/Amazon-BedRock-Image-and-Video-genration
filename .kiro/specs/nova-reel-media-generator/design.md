# Design Document: Nova Reel Media Generator

## Overview

The Nova Reel Media Generator is a full-stack web application built with a modern architecture that separates concerns between the frontend UI, backend API, and AWS Bedrock integration. The system provides a professional interface for generating videos and images using Amazon Nova Reel (amazon.nova-reel-v1:0).

The application follows a client-server architecture where:
- **Frontend**: React-based single-page application (SPA) providing the user interface
- **Backend**: Node.js/Express API server handling business logic and AWS integration
- **Storage**: Local file system for generated media and SQLite for metadata/history
- **External Service**: AWS Bedrock Nova Reel for media generation

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Frontend (Web UI)                     │  │
│  │  - Generation Forms                                   │  │
│  │  - Media Preview & Playback                          │  │
│  │  - History Management                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js/Express)          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Layer                                            │  │
│  │  - Request Validation                                 │  │
│  │  - File Upload Handling                              │  │
│  │  - Response Formatting                               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Service Layer                                        │  │
│  │  - Generation Service                                 │  │
│  │  - History Service                                    │  │
│  │  - File Service                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AWS Integration Layer                                │  │
│  │  - Bedrock Client                                     │  │
│  │  - Credential Management                              │  │
│  │  - Role Assumption                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Data Layer                                           │  │
│  │  - SQLite Database (History/Metadata)                │  │
│  │  - File System (Generated Media)                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    AWS SDK (Bedrock)
                            │
┌─────────────────────────────────────────────────────────────┐
│              AWS Bedrock - Nova Reel Service                 │
│              (amazon.nova-reel-v1:0)                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Axios for HTTP requests
- React Router for navigation

**Backend:**
- Node.js 18+ with TypeScript
- Express.js for API framework
- AWS SDK v3 (@aws-sdk/client-bedrock-runtime)
- Multer for file uploads
- SQLite3 for database
- dotenv for configuration

**Development Tools:**
- ESLint and Prettier for code quality
- Vitest for testing
- fast-check for property-based testing

## Components and Interfaces

### Frontend Components

#### 1. GenerationForm Component
Handles user input for media generation requests.

**Props:**
```typescript
interface GenerationFormProps {
  mode: 'text-to-video' | 'image-to-video' | 'text-to-image';
  onSubmit: (request: GenerationRequest) => Promise<void>;
}
```

**Responsibilities:**
- Collect prompt text input
- Handle file uploads for image-to-video mode
- Validate inputs before submission
- Display preview of inputs
- Show loading state during generation

#### 2. MediaViewer Component
Displays generated media with playback controls.

**Props:**
```typescript
interface MediaViewerProps {
  media: GeneratedMedia;
  onDownload: () => void;
}
```

**Responsibilities:**
- Render video player for video content
- Display images with zoom capability
- Provide download functionality
- Show metadata (timestamp, prompt)

#### 3. HistoryList Component
Displays user's generation history.

**Props:**
```typescript
interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}
```

**Responsibilities:**
- List all historical generations
- Filter and search history
- Handle item selection and deletion
- Paginate large history lists

### Backend API Endpoints

#### POST /api/generate/text-to-video
Generate video from text prompt.

**Request:**
```typescript
{
  prompt: string;  // Max 512 tokens
  parameters?: {
    duration?: number;
    aspectRatio?: string;
  }
}
```

**Response:**
```typescript
{
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  error?: string;
}
```

#### POST /api/generate/image-to-video
Generate video from uploaded image.

**Request:** Multipart form data
- `file`: Image file
- `prompt`: Text prompt
- `parameters`: Optional generation parameters

**Response:** Same as text-to-video

#### POST /api/generate/text-to-image
Generate image from text prompt.

**Request/Response:** Similar structure to text-to-video

#### GET /api/generate/status/:jobId
Check generation job status.

**Response:**
```typescript
{
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  mediaUrl?: string;
  error?: string;
}
```

#### GET /api/history
Retrieve generation history.

**Response:**
```typescript
{
  items: Array<{
    id: string;
    type: 'text-to-video' | 'image-to-video' | 'text-to-image';
    prompt: string;
    mediaUrl: string;
    createdAt: string;
  }>;
  total: number;
}
```

#### DELETE /api/history/:id
Delete a history item.

#### GET /api/media/:filename
Serve generated media files.

### Service Layer Interfaces

#### GenerationService
```typescript
interface GenerationService {
  generateTextToVideo(prompt: string, params?: GenerationParams): Promise<GenerationResult>;
  generateImageToVideo(imageBuffer: Buffer, prompt: string, params?: GenerationParams): Promise<GenerationResult>;
  generateTextToImage(prompt: string, params?: GenerationParams): Promise<GenerationResult>;
  getJobStatus(jobId: string): Promise<JobStatus>;
}
```

#### BedrockClient
```typescript
interface BedrockClient {
  invokeModel(modelId: string, payload: any): Promise<BedrockResponse>;
  assumeRole(roleArn: string): Promise<Credentials>;
  validateCredentials(): Promise<boolean>;
}
```

#### HistoryService
```typescript
interface HistoryService {
  saveGeneration(generation: GenerationRecord): Promise<string>;
  getHistory(userId?: string, limit?: number, offset?: number): Promise<HistoryItem[]>;
  getById(id: string): Promise<HistoryItem | null>;
  deleteById(id: string): Promise<boolean>;
}
```

## Data Models

### GenerationRequest
```typescript
interface GenerationRequest {
  type: 'text-to-video' | 'image-to-video' | 'text-to-image';
  prompt: string;
  sourceFile?: File;
  parameters?: {
    duration?: number;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    quality?: 'standard' | 'high';
  };
}
```

### GenerationResult
```typescript
interface GenerationResult {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  mediaUrl?: string;
  mediaType?: 'video/mp4' | 'image/png';
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
```

### HistoryItem
```typescript
interface HistoryItem {
  id: string;
  type: 'text-to-video' | 'image-to-video' | 'text-to-image';
  prompt: string;
  sourceFileUrl?: string;
  mediaUrl: string;
  mediaType: string;
  status: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
```

### Database Schema (SQLite)

**generations table:**
```sql
CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  source_file_path TEXT,
  media_file_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Co
rrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, we have identified the following correctness properties that can be validated through property-based testing. These properties ensure the system behaves correctly across all valid inputs and scenarios.

### Core Generation Properties

**Property 1: Prompt submission triggers API call**
*For any* valid text prompt in text-to-video mode, submitting the prompt should result in an API call to Nova Reel Service with the prompt as payload.
**Validates: Requirements 1.1**

**Property 2: Token limit validation**
*For any* prompt, if the token count exceeds 512, the system should reject the request; if the token count is 512 or below, the system should accept the request.
**Validates: Requirements 1.2**

**Property 3: File format validation**
*For any* uploaded file, if the file format is in the supported formats list (JPEG, PNG, PDF, etc.), the system should accept it; otherwise, the system should reject it with a format error.
**Validates: Requirements 2.2**

**Property 4: File size validation**
*For any* uploaded file, if the file size exceeds the maximum allowed size, the system should reject the upload and display size requirements.
**Validates: Requirements 2.3**

### Persistence and History Properties

**Property 5: Generation persistence**
*For any* completed generation request, storing it to the database and then retrieving the history should return a record containing the same prompt, media reference, and metadata.
**Validates: Requirements 5.1, 5.2**

**Property 6: History deletion**
*For any* history item, after deleting it by ID, subsequent queries for that ID should return null, and the item should not appear in the history list.
**Validates: Requirements 5.4**

**Property 7: Session persistence round-trip**
*For any* set of generation records, saving them to the database, restarting the application, and loading the history should return the same records with matching IDs, prompts, and media URLs.
**Validates: Requirements 5.5**

### Security Properties

**Property 8: Credential isolation**
*For any* API response from the backend, the response body should not contain AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or any credential strings.
**Validates: Requirements 4.4**

**Property 9: Stack trace sanitization**
*For any* error response sent to the client, the response should not contain stack traces, file paths, or internal system details.
**Validates: Requirements 9.5**

### Error Handling Properties

**Property 10: Error message clarity**
*For any* error returned by Nova Reel Service, the system should parse the error and return a user-friendly message that does not expose technical implementation details.
**Validates: Requirements 9.1**

**Property 11: Retry availability after errors**
*For any* generation request that fails, the UI should maintain the original input values and enable the retry/submit button.
**Validates: Requirements 9.4**

### Download Properties

**Property 12: Video format consistency**
*For any* generated video content, the download should provide a file with either .mp4 or .webm extension and the corresponding MIME type.
**Validates: Requirements 7.3**

**Property 13: Image format consistency**
*For any* generated image content, the download should provide a file with either .png or .jpg/.jpeg extension and the corresponding MIME type.
**Validates: Requirements 7.4**

### UI State Properties

**Property 14: Loading indicator during generation**
*For any* generation request in progress, the UI should display a loading indicator, and when the request completes (success or failure), the loading indicator should be hidden.
**Validates: Requirements 1.3, 6.3**

**Property 15: Button state validation**
*For any* form state, if all required inputs are present and valid, the generation button should be enabled; if any required input is missing or invalid, the button should be disabled.
**Validates: Requirements 10.4, 10.5**

**Property 16: Preview reactivity**
*For any* input change (prompt text or file upload), the preview area should update to reflect the new input within the same render cycle.
**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

### Error Categories

**1. AWS Service Errors**
- Authentication failures (invalid credentials, expired tokens)
- Authorization failures (insufficient permissions)
- Service throttling (rate limits exceeded)
- Model invocation errors (invalid parameters, unsupported formats)

**Handling Strategy:**
- Parse AWS SDK error codes and map to user-friendly messages
- Implement exponential backoff for throttling errors
- Log detailed error information server-side for debugging
- Return sanitized error messages to the client

**2. Validation Errors**
- Invalid prompt length (exceeds 512 tokens)
- Unsupported file formats
- File size exceeds limits
- Missing required fields

**Handling Strategy:**
- Validate inputs on both client and server side
- Provide immediate feedback in the UI
- Return 400 Bad Request with clear error descriptions
- Highlight specific fields that need correction

**3. Network Errors**
- Connection timeouts
- DNS resolution failures
- Network unavailability

**Handling Strategy:**
- Implement request timeouts (30s for API calls, 5min for generation)
- Display network error messages with retry options
- Cache generation requests for retry after connectivity restoration
- Provide offline indicators in the UI

**4. File System Errors**
- Disk space exhausted
- Permission denied
- File not found

**Handling Strategy:**
- Check available disk space before saving media
- Implement graceful degradation (disable uploads if storage full)
- Log file system errors for administrator attention
- Clean up temporary files on errors

**5. Unexpected Errors**
- Unhandled exceptions
- Memory errors
- Third-party library failures

**Handling Strategy:**
- Implement global error handlers in both frontend and backend
- Log full error details (stack trace, context) server-side
- Display generic "Something went wrong" message to users
- Provide error ID for support reference
- Ensure application remains stable (no crashes)

### Error Response Format

All API errors follow a consistent format:

```typescript
{
  error: {
    code: string;        // Machine-readable error code
    message: string;     // User-friendly error message
    details?: any;       // Optional additional context
    retryable: boolean;  // Whether the request can be retried
  }
}
```

### Error Logging

**Server-side logging includes:**
- Timestamp
- Error type and code
- Full error message and stack trace
- Request context (endpoint, parameters, user ID if applicable)
- AWS request ID (for Bedrock errors)

**Client-side logging includes:**
- Timestamp
- Error message
- User action that triggered the error
- Application state snapshot

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components and functions:

**Frontend Unit Tests:**
- Component rendering with various props
- Form validation logic
- State management (Redux/Context)
- API client functions
- Utility functions (token counting, file validation)

**Backend Unit Tests:**
- API endpoint request/response handling
- Input validation functions
- File upload processing
- Database operations (CRUD)
- AWS credential loading and validation

**Test Framework:** Vitest with React Testing Library for frontend, Vitest for backend

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs:

**Testing Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Custom generators for domain-specific types (prompts, file uploads, generation results)
- Shrinking enabled to find minimal failing cases

**Property Test Coverage:**

Each correctness property listed above will be implemented as a property-based test with the following format:

```typescript
// Example property test structure
test('Property 2: Token limit validation', () => {
  fc.assert(
    fc.property(
      fc.string(), // Generate random prompts
      (prompt) => {
        const tokenCount = countTokens(prompt);
        const result = validatePrompt(prompt);
        
        if (tokenCount > 512) {
          expect(result.valid).toBe(false);
          expect(result.error).toContain('token limit');
        } else {
          expect(result.valid).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Custom Generators:**
- `arbitraryPrompt()`: Generates prompts of varying lengths
- `arbitraryFile()`: Generates file objects with various formats and sizes
- `arbitraryGenerationResult()`: Generates mock API responses
- `arbitraryHistoryItem()`: Generates history records

### Integration Testing

Integration tests will verify interactions between components:

- Frontend-to-backend API communication
- Backend-to-AWS Bedrock integration
- Database persistence and retrieval
- File upload and storage workflows
- End-to-end generation flows (text-to-video, image-to-video, text-to-image)

**Approach:**
- Use test doubles for AWS Bedrock (mock responses)
- Use in-memory SQLite for database tests
- Test with actual file uploads (small test files)
- Verify complete request-response cycles

### Test Organization

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GenerationForm.tsx
│   │   │   └── GenerationForm.test.tsx
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── validation.test.ts
│   └── tests/
│       ├── properties/
│       │   ├── ui-properties.test.ts
│       │   └── validation-properties.test.ts
│       └── integration/
│           └── generation-flow.test.ts
└── backend/
    ├── src/
    │   ├── services/
    │   │   ├── generation.service.ts
    │   │   └── generation.service.test.ts
    │   └── api/
    │       ├── routes.ts
    │       └── routes.test.ts
    └── tests/
        ├── properties/
        │   ├── persistence-properties.test.ts
        │   ├── security-properties.test.ts
        │   └── error-handling-properties.test.ts
        └── integration/
            └── aws-integration.test.ts
```

## Security Considerations

### Credential Management
- AWS credentials stored in environment variables only
- Never commit credentials to version control
- Use .env files for local development (excluded from git)
- Implement role-based access with ASSUME_ROLE_ARN
- Rotate credentials regularly

### API Security
- Implement rate limiting to prevent abuse
- Validate and sanitize all user inputs
- Use CORS to restrict API access to known origins
- Implement request size limits
- Add authentication/authorization for production use

### File Upload Security
- Validate file types using magic numbers (not just extensions)
- Scan uploaded files for malware (if applicable)
- Limit file sizes to prevent DoS
- Store uploaded files outside web root
- Generate unique filenames to prevent overwrites

### Data Privacy
- Do not log sensitive user data (prompts may contain PII)
- Implement data retention policies
- Provide user data deletion capabilities
- Encrypt sensitive data at rest (if storing user accounts)

## Performance Considerations

### Frontend Optimization
- Lazy load components and routes
- Implement virtual scrolling for history list
- Optimize images and media for web delivery
- Use React.memo for expensive components
- Debounce input validation

### Backend Optimization
- Implement caching for frequently accessed data
- Use streaming for large file uploads
- Implement job queue for generation requests
- Set appropriate timeouts for AWS calls
- Clean up old generated media periodically

### AWS Bedrock Optimization
- Implement request batching where possible
- Monitor and respect rate limits
- Use appropriate model parameters for quality/speed tradeoff
- Implement retry logic with exponential backoff

## Deployment Architecture

### Development Environment
- Frontend: Vite dev server (port 5173)
- Backend: Node.js server (port 3000)
- Database: SQLite file in project directory
- Media storage: Local filesystem

### Production Environment
- Frontend: Static files served by Nginx or CDN
- Backend: Node.js server behind reverse proxy
- Database: SQLite or migrate to PostgreSQL for multi-user
- Media storage: AWS S3 or local filesystem with backup
- Process manager: PM2 for Node.js process management
- Monitoring: Application logs and error tracking

### Environment Variables

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=us-east-1
ASSUME_ROLE_ARN=arn:aws:iam::430118833501:role/role-log-analyzer-bedrock

# Application Configuration
NODE_ENV=development|production
PORT=3000
FRONTEND_URL=http://localhost:5173

# Storage Configuration
MEDIA_STORAGE_PATH=./media
DATABASE_PATH=./data/app.db

# Generation Configuration
MAX_FILE_SIZE_MB=10
MAX_PROMPT_TOKENS=512
GENERATION_TIMEOUT_MS=300000
```

## Future Enhancements

### Phase 2 Features
- User authentication and multi-user support
- Batch generation (multiple prompts at once)
- Generation templates and presets
- Advanced parameter controls (style, mood, etc.)
- Social sharing capabilities

### Phase 3 Features
- Video editing capabilities (trim, merge)
- Custom model fine-tuning
- API access for third-party integrations
- Analytics and usage tracking
- Collaborative workspaces

## Documentation Requirements

The application will include comprehensive documentation:

### README.md
- Project overview and features
- Prerequisites and system requirements
- Installation instructions
- Configuration guide (AWS credentials setup)
- Running the application (dev and prod modes)
- Project structure overview
- Troubleshooting common issues

### API Documentation
- OpenAPI/Swagger specification
- Endpoint descriptions and examples
- Request/response schemas
- Error codes and meanings
- Rate limits and quotas

### Developer Guide
- Architecture overview
- Code organization and conventions
- Adding new features
- Testing guidelines
- Deployment procedures

### User Guide
- Getting started tutorial
- Feature walkthroughs
- Best practices for prompts
- FAQ and troubleshooting
