import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiClient } from '../services/api.client';
import HistoryList from '../components/HistoryList';
import LoadingIndicator from '../components/LoadingIndicator';
import ErrorDisplay from '../components/ErrorDisplay';
import MediaViewer from '../components/MediaViewer';
import { HistoryItem } from '../types/api.types';
import { downloadFile, generateFilename, getExtensionFromMimeType } from '../utils/download';

export default function HistoryPage() {
  const {
    history,
    historyLoading,
    historyError,
    setHistory,
    setHistoryLoading,
    setHistoryError,
    removeHistoryItem,
  } = useAppContext();

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await apiClient.getHistory();
      setHistory(response.items);
    } catch (error) {
      const err = error as Error;
      setHistoryError(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteHistoryItem(id);
      removeHistoryItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!selectedItem?.mediaUrl) return;

    try {
      const extension = getExtensionFromMimeType(selectedItem.mediaType);
      const filename = generateFilename('nova-reel', extension);
      await downloadFile(selectedItem.mediaUrl, filename);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generation History</h1>
        <button
          onClick={loadHistory}
          disabled={historyLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {historyError && (
        <ErrorDisplay
          error={historyError}
          onRetry={loadHistory}
          onDismiss={() => setHistoryError(null)}
        />
      )}

      {historyLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <LoadingIndicator message="Loading history..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* History List */}
          <div>
            <HistoryList
              items={history}
              onSelect={setSelectedItem}
              onDelete={handleDelete}
            />
          </div>

          {/* Selected Item Detail */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    Prompt
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedItem.prompt}</p>
                </div>

                <MediaViewer
                  media={{
                    jobId: selectedItem.id,
                    status: selectedItem.status,
                    mediaUrl: selectedItem.mediaUrl,
                    mediaType: selectedItem.mediaType,
                    metadata: selectedItem.metadata,
                  }}
                  sourceImageUrl={selectedItem.sourceFileUrl}
                  onDownload={handleDownload}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Select an item to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
