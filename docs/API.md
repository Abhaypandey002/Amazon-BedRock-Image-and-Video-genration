# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. For production use, implement appropriate authentication mechanisms.

## Error Response Format

All errors follow this consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "retryable": true
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request parameters (400)
- `NOT_FOUND` - Resource not found (404)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `INTERNAL_ERROR` - Server error (500)
- `AWS_ERROR` - AWS service error (varies)
- `NETWORK_ERROR` - Network connectivity issue (503)

## Endpoints

### Health Check

#### GET /health

Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

---

### Text-to-Video Generation

#### POST /api/generate/text-to-video

Generate a video from a text prompt.

**Request Body:**
```json
{
  "prompt": "A serene sunset over the ocean with waves gently crashing",
  "parameters": {
    "duration": 6,
    "aspectRatio": "16:9",
    "quality": "standard"
  }
}
```

**Parameters:**
- `prompt` (string, required): Text description of the video (max 512 tokens)
- `parameters` (object, optional):
  - `duration` (number): Video duration in seconds
  - `aspectRatio` (string): "16:9", "9:16", or "1:1"
  - `quality` (string): "standard" or "high"

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "mediaUrl": "/api/media/550e8400-e29b-41d4-a716-446655440000.mp4",
  "mediaType": "video/mp4",
  "metadata": {
    "size": 2048576,
    "duration": 6
  }
}
```

**Status Codes:**
- `200 OK` - Generation successful
- `400 Bad Request` - Invalid prompt or parameters
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Generation failed

---

### Image-to-Video Generation

#### POST /api/generate/image-to-video

Generate a video from an uploaded image and text prompt.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (file, required): Image file (JPEG, PNG, WebP, GIF, PDF)
  - `prompt` (string, required): Text description (max 512 tokens)
  - `parameters` (JSON string, optional): Generation parameters

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/generate/image-to-video \
  -F "file=@image.jpg" \
  -F "prompt=Transform this image into a dynamic video" \
  -F 'parameters={"aspectRatio":"16:9","quality":"high"}'
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "mediaUrl": "/api/media/550e8400-e29b-41d4-a716-446655440001.mp4",
  "mediaType": "video/mp4",
  "metadata": {
    "size": 3145728
  }
}
```

**Status Codes:**
- `200 OK` - Generation successful
- `400 Bad Request` - Invalid file or prompt
- `413 Payload Too Large` - File exceeds size limit
- `500 Internal Server Error` - Generation failed

---

### Text-to-Image Generation

#### POST /api/generate/text-to-image

Generate an image from a text prompt.

**Request Body:**
```json
{
  "prompt": "A futuristic cityscape at night with neon lights",
  "parameters": {
    "quality": "high"
  }
}
```

**Parameters:**
- `prompt` (string, required): Text description (max 512 tokens)
- `parameters` (object, optional):
  - `quality` (string): "standard" or "high"

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "completed",
  "mediaUrl": "/api/media/550e8400-e29b-41d4-a716-446655440002.png",
  "mediaType": "image/png",
  "metadata": {
    "size": 1048576,
    "dimensions": {
      "width": 1024,
      "height": 1024
    }
  }
}
```

**Status Codes:**
- `200 OK` - Generation successful
- `400 Bad Request` - Invalid prompt
- `500 Internal Server Error` - Generation failed

---

### Job Status

#### GET /api/generate/status/:jobId

Check the status of a generation job.

**Parameters:**
- `jobId` (string, required): Job ID from generation response

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 45
}
```

**Status Values:**
- `processing` - Generation in progress
- `completed` - Generation successful
- `failed` - Generation failed

**Status Codes:**
- `200 OK` - Status retrieved
- `404 Not Found` - Job not found

---

### Get History

#### GET /api/history

Retrieve generation history.

**Query Parameters:**
- `limit` (number, optional): Number of items to return (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Example:**
```
GET /api/history?limit=20&offset=0
```

**Response:**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "text-to-video",
      "prompt": "A serene sunset over the ocean",
      "mediaUrl": "/api/media/550e8400-e29b-41d4-a716-446655440000.mp4",
      "mediaType": "video/mp4",
      "status": "completed",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "metadata": {
        "size": 2048576
      }
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Status Codes:**
- `200 OK` - History retrieved
- `500 Internal Server Error` - Failed to retrieve history

---

### Delete History Item

#### DELETE /api/history/:id

Delete a history item and its associated media.

**Parameters:**
- `id` (string, required): History item ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Item deleted
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Deletion failed

---

### Get Media File

#### GET /api/media/:filename

Retrieve a generated media file.

**Parameters:**
- `filename` (string, required): Media filename

**Response:**
- Binary file data with appropriate Content-Type header

**Status Codes:**
- `200 OK` - File retrieved
- `404 Not Found` - File not found

---

## Rate Limits

The API respects AWS Bedrock rate limits. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response with a `RATE_LIMIT_EXCEEDED` error code.

**Recommended practices:**
- Implement exponential backoff for retries
- Cache results when possible
- Monitor your usage

## Timeouts

- **API Requests**: 30 seconds
- **Generation Requests**: 5 minutes (configurable via `GENERATION_TIMEOUT_MS`)

## File Upload Limits

- **Maximum File Size**: 10MB (configurable via `MAX_FILE_SIZE_MB`)
- **Supported Formats**:
  - Images: JPEG, PNG, WebP, GIF
  - Documents: PDF

## Prompt Guidelines

- **Maximum Length**: 512 tokens (~2000 characters)
- **Best Practices**:
  - Be specific and descriptive
  - Include details about style, mood, and composition
  - Avoid ambiguous language
  - Use clear, concise sentences

## Examples

### Generate a Video

```javascript
const response = await fetch('http://localhost:3000/api/generate/text-to-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A time-lapse of a blooming flower in a garden',
    parameters: {
      aspectRatio: '16:9',
      quality: 'high',
    },
  }),
});

const result = await response.json();
console.log(result);
```

### Upload Image and Generate Video

```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('prompt', 'Make this image come alive with motion');
formData.append('parameters', JSON.stringify({ quality: 'high' }));

const response = await fetch('http://localhost:3000/api/generate/image-to-video', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

### Get History

```javascript
const response = await fetch('http://localhost:3000/api/history?limit=10&offset=0');
const history = await response.json();
console.log(history.items);
```

## Webhooks (Future Feature)

Webhook support for generation completion notifications is planned for a future release.
