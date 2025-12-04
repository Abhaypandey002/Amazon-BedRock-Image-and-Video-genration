import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { GenerationType, GenerationParams } from '../types/api.types';
import { apiClient } from '../services/api.client';
import { useAppContext } from '../context/AppContext';

interface GenerationFormProps {
  mode: GenerationType;
}

export default function GenerationForm({ mode }: GenerationFormProps) {
  const { setIsGenerating, setCurrentGeneration, setGenerationError } = useAppContext();
  
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parameters, setParameters] = useState<GenerationParams>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxPromptLength = 512 * 4; // Rough character estimate for 512 tokens
  const isFormValid = prompt.trim().length > 0 && (mode !== 'image-to-video' || file !== null);

  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxPromptLength) {
      setPrompt(value);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const pollJobStatus = async (jobId: string): Promise<void> => {
    const maxAttempts = 120; // 10 minutes with 5 second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await apiClient.getJobStatus(jobId);
        
        console.log(`[Poll ${attempts + 1}] Job status:`, status);

        if (status.status === 'completed') {
          setCurrentGeneration(status);
          setIsGenerating(false);
          return;
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed');
        }

        // Update progress if available
        if (status.progress !== undefined) {
          setCurrentGeneration(status);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        throw error;
      }
    }

    throw new Error('Generation timed out. Please try again.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;

    setIsGenerating(true);
    setGenerationError(null);
    setCurrentGeneration(null);

    try {
      let result;

      if (mode === 'text-to-video') {
        result = await apiClient.generateTextToVideo(prompt, parameters);
      } else if (mode === 'image-to-video' && file) {
        result = await apiClient.generateImageToVideo(file, prompt, parameters);
      } else if (mode === 'text-to-image') {
        result = await apiClient.generateTextToImage(prompt, parameters);
      }

      if (result) {
        console.log('Initial result:', result);
        
        if (result.status === 'processing' && result.jobId) {
          // Start polling for job completion
          console.log('Starting job polling for:', result.jobId);
          await pollJobStatus(result.jobId);
        } else if (result.status === 'completed') {
          // Job completed immediately
          setCurrentGeneration(result);
          setIsGenerating(false);
        }
      }
    } catch (error) {
      const err = error as Error;
      setGenerationError(err.message || 'An error occurred during generation');
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setFile(null);
    setPreviewUrl(null);
    setParameters({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Display */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {mode === 'text-to-video' && 'Text to Video'}
          {mode === 'image-to-video' && 'Image to Video'}
          {mode === 'text-to-image' && 'Text to Image'}
        </h2>
      </div>

      {/* File Upload (for image-to-video mode) */}
      {mode === 'image-to-video' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Image
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">{file?.name}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Drag and drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Supported formats: JPEG, PNG, WebP, GIF, PDF
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Describe what you want to generate..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Be specific and descriptive for best results
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {prompt.length} / {maxPromptLength}
          </p>
        </div>
      </div>

      {/* Parameters (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aspect Ratio
          </label>
          <select
            value={parameters.aspectRatio || '16:9'}
            onChange={(e) =>
              setParameters({ ...parameters, aspectRatio: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quality
          </label>
          <select
            value={parameters.quality || 'standard'}
            onChange={(e) =>
              setParameters({ ...parameters, quality: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="standard">Standard</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!isFormValid}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Generate
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
