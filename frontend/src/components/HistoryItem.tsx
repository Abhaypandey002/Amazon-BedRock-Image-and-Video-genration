import { HistoryItem as HistoryItemType } from '../types/api.types';
import { useState } from 'react';

interface HistoryItemProps {
  item: HistoryItemType;
  onSelect: () => void;
  onDelete: () => void;
}

export default function HistoryItem({ item, onSelect, onDelete }: HistoryItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getTypeIcon = () => {
    switch (item.type) {
      case 'text-to-video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'image-to-video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'text-to-image':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'text-to-video':
        return 'Text to Video';
      case 'image-to-video':
        return 'Image to Video';
      case 'text-to-image':
        return 'Text to Image';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Content */}
          <div className="flex-1 cursor-pointer" onClick={onSelect}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-blue-600 dark:text-blue-400">{getTypeIcon()}</div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getTypeLabel()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(item.createdAt)}
              </span>
            </div>

            <p className="text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
              {item.prompt}
            </p>

            {item.status === 'completed' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </div>
            )}

            {item.status === 'failed' && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Failed
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className={`flex-shrink-0 p-2 rounded transition-colors ${
              showDeleteConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
