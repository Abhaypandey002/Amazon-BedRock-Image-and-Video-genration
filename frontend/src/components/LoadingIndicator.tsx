interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
}

export default function LoadingIndicator({ message, progress }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-gray-700 dark:text-gray-300 text-center font-medium">{message}</p>
      )}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            {progress}%
          </p>
        </div>
      )}

      {/* Default message if none provided */}
      {!message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Generating your content, please wait...
        </p>
      )}
    </div>
  );
}
