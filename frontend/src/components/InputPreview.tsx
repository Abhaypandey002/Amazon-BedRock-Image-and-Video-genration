interface InputPreviewProps {
  prompt: string;
  fileUrl?: string | null;
  fileName?: string;
}

export default function InputPreview({ prompt, fileUrl, fileName }: InputPreviewProps) {
  if (!prompt && !fileUrl) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Preview</h3>

      {/* Prompt Preview */}
      {prompt && (
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Prompt:</p>
          <p className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            {prompt}
          </p>
        </div>
      )}

      {/* File Preview */}
      {fileUrl && (
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Uploaded File:
          </p>
          <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <img
              src={fileUrl}
              alt="Upload preview"
              className="max-h-32 rounded mx-auto"
            />
            {fileName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                {fileName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
