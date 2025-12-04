import { useState } from 'react';
import { GenerationType } from '../types/api.types';
import { useAppContext } from '../context/AppContext';
import GenerationForm from '../components/GenerationForm';
import LoadingIndicator from '../components/LoadingIndicator';
import MediaViewer from '../components/MediaViewer';
import ErrorDisplay from '../components/ErrorDisplay';
import { downloadFile, generateFilename, getExtensionFromMimeType } from '../utils/download';

export default function GenerationPage() {
  const [mode, setMode] = useState<GenerationType>('text-to-video');
  const { isGenerating, currentGeneration, generationError, clearGeneration } = useAppContext();

  const handleDownload = async () => {
    if (!currentGeneration?.mediaUrl) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = currentGeneration.mediaUrl.startsWith('http') 
        ? currentGeneration.mediaUrl 
        : `${API_BASE_URL}${currentGeneration.mediaUrl}`;
      
      const extension = getExtensionFromMimeType(currentGeneration.mediaType || '');
      const filename = generateFilename('nova-reel', extension);
      await downloadFile(fullUrl, filename);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Select Generation Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setMode('text-to-video')}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'text-to-video'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="font-medium text-gray-800 dark:text-white">Text to Video</span>
            </div>
          </button>

          <button
            onClick={() => setMode('image-to-video')}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'image-to-video'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-800 dark:text-white">Image to Video</span>
            </div>
          </button>

          <button
            onClick={() => setMode('text-to-image')}
            className={`p-4 rounded-lg border-2 transition-all ${
              mode === 'text-to-image'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-800 dark:text-white">Text to Image</span>
            </div>
          </button>
        </div>
      </div>

      {/* Generation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <GenerationForm mode={mode} />
      </div>

      {/* Error Display */}
      {generationError && (
        <ErrorDisplay
          error={generationError}
          onDismiss={clearGeneration}
        />
      )}

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <LoadingIndicator message="Generating your content..." />
        </div>
      )}

      {/* Result Display */}
      {currentGeneration && currentGeneration.status === 'completed' && (
        <MediaViewer
          media={currentGeneration}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
