import { GenerationResult } from '../types/api.types';

interface MediaViewerProps {
  media: GenerationResult;
  sourceImageUrl?: string;
  onDownload: () => void;
}

export default function MediaViewer({ media, sourceImageUrl, onDownload }: MediaViewerProps) {
  const isVideo = media.mediaType?.startsWith('video/');
  const isImage = media.mediaType?.startsWith('image/');
  
  // Construct full media URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const fullMediaUrl = media.mediaUrl?.startsWith('http') 
    ? media.mediaUrl 
    : `${API_BASE_URL}${media.mediaUrl}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Generated Content
        </h3>
        <button
          onClick={onDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>

      {/* Source Image (for image-to-video) */}
      {sourceImageUrl && (
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Original Image:
          </p>
          <img
            src={sourceImageUrl}
            alt="Source"
            className="max-h-48 rounded border border-gray-200 dark:border-gray-600"
          />
        </div>
      )}

      {/* Video Player */}
      {isVideo && fullMediaUrl && (
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            controls
            className="w-full max-h-96"
            src={fullMediaUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Image Viewer */}
      {isImage && fullMediaUrl && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center p-4">
          <img
            src={fullMediaUrl}
            alt="Generated"
            className="max-w-full max-h-96 rounded"
          />
        </div>
      )}

      {/* Metadata */}
      {media.metadata && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Details:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {media.metadata.size && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Size:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {(media.metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
            {media.metadata.duration && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {media.metadata.duration}s
                </span>
              </div>
            )}
            {media.metadata.dimensions && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {media.metadata.dimensions.width} x {media.metadata.dimensions.height}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
