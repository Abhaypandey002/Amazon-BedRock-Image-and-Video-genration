# Nova Reel Media Generator

A professional web application for generating videos and images using Amazon Nova Reel (amazon.nova-reel-v1:0). Create stunning media content from text prompts or transform images into dynamic videos with an intuitive interface.

## Features

- **Text-to-Video Generation**: Create videos from descriptive text prompts
- **Image-to-Video Generation**: Transform static images into dynamic video content
- **Text-to-Image Generation**: Generate images from text descriptions
- **Generation History**: Track and manage all your generated content
- **Media Download**: Download generated videos and images
- **Professional UI**: Clean, modern interface with dark mode support
- **Responsive Design**: Works seamlessly on desktop and tablet devices

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **AWS Account**: With access to Amazon Bedrock and Nova Reel service

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nova-reel-media-generator
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both the frontend and backend workspaces.

## Configuration

### AWS Credentials Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and add your AWS credentials:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=iwrnirnrn.........
AWS_SECRET_ACCESS_KEY=LQVwS4b8rXbLAU7mDOX............
AWS_REGION=us-east-1
# ASSUME_ROLE_ARN is not needed for root accounts - commented out
# ASSUME_ROLE_ARN=..............

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5174

# Storage Configuration
MEDIA_STORAGE_PATH=./media
DATABASE_PATH=./data/app.db
# S3 bucket for temporary video storage (Nova Reel requirement)
# Create an S3 bucket in your AWS account and add the name here
# Do NOT include s3:// prefix - it will be added automatically
# Format: just-bucket-name OR bucket-name/optional-prefix
OUTPUT_S3_BUCKET=nova-reel-output-videos-abhay

# Generation Configuration
MAX_FILE_SIZE_MB=10
MAX_PROMPT_TOKENS=512
GENERATION_TIMEOUT_MS=300000

```

### Frontend Configuration (Optional)

If you need to customize the API URL:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit if needed (default is http://localhost:3000):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

3. Serve the frontend build (use a static file server like nginx or serve):
   ```bash
   npx serve frontend/dist
   ```

## Project Structure

```
nova-reel-media-generator/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── api/               # API routes
│   │   ├── config/            # Configuration
│   │   ├── database/          # Database setup
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── app.ts             # Express app setup
│   │   └── index.ts           # Server entry point
│   ├── .env.example           # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # React context
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .gitignore
├── package.json               # Root package.json
├── README.md
└── .prettierrc.json
```

## Usage

### Generating Content

1. **Select Generation Mode**:
   - Text to Video: Generate videos from text descriptions
   - Image to Video: Upload an image and add a prompt to create a video
   - Text to Image: Generate images from text descriptions

2. **Enter Your Prompt**:
   - Be specific and descriptive for best results
   - Maximum 512 tokens (~2000 characters)

3. **Upload File** (for Image-to-Video):
   - Drag and drop or click to select
   - Supported formats: JPEG, PNG, WebP, GIF, PDF
   - Maximum file size: 10MB

4. **Configure Parameters** (Optional):
   - Aspect Ratio: 16:9, 9:16, or 1:1
   - Quality: Standard or High

5. **Generate**:
   - Click the Generate button
   - Wait for the generation to complete
   - View and download your content

### Viewing History

1. Navigate to the History page
2. Browse your previous generations
3. Click on any item to view details
4. Download or delete items as needed

## API Endpoints

### Generation Endpoints

- `POST /api/generate/text-to-video` - Generate video from text
- `POST /api/generate/image-to-video` - Generate video from image
- `POST /api/generate/text-to-image` - Generate image from text
- `GET /api/generate/status/:jobId` - Check generation status

### History Endpoints

- `GET /api/history` - Get generation history
- `DELETE /api/history/:id` - Delete history item

### Media Endpoints

- `GET /api/media/:filename` - Serve generated media files

### Health Check

- `GET /health` - Server health check

## Troubleshooting

### AWS Credentials Error

**Problem**: Server fails to start with AWS credentials error

**Solution**:
1. Verify your `.env` file in the backend directory
2. Ensure all AWS credentials are correct
3. Check that your AWS account has access to Amazon Bedrock
4. Verify the ASSUME_ROLE_ARN is correct

### Port Already in Use

**Problem**: Port 3000 or 5173 is already in use

**Solution**:
1. Change the port in backend/.env (PORT=3001)
2. Update frontend/.env (VITE_API_URL=http://localhost:3001)
3. Or kill the process using the port

### Generation Timeout

**Problem**: Generation takes too long and times out

**Solution**:
1. Try a simpler prompt
2. Increase GENERATION_TIMEOUT_MS in backend/.env
3. Check your internet connection
4. Verify AWS service status

### File Upload Fails

**Problem**: Cannot upload files

**Solution**:
1. Check file size (must be under 10MB)
2. Verify file format is supported
3. Ensure backend has write permissions for media directory

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests for specific workspace
npm test --workspace=backend
npm test --workspace=frontend
```

### Linting

```bash
# Lint all code
npm run lint

# Format code
npm run format
```

### Building

```bash
# Build both frontend and backend
npm run build

# Build specific workspace
npm run build --workspace=frontend
npm run build --workspace=backend
```

## Technologies Used

### Backend
- Node.js & TypeScript
- Express.js
- AWS SDK v3 (Bedrock Runtime)
- SQLite3
- Multer (file uploads)
- pdf-parse (PDF processing)

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Axios

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review AWS Bedrock documentation
3. Check application logs in the console

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Powered by Amazon Nova Reel (amazon.nova-reel-v1:0)
- Built with modern web technologies
