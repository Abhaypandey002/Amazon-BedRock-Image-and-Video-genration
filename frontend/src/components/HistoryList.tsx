import { HistoryItem } from '../types/api.types';
import HistoryItemComponent from './HistoryItem';

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export default function HistoryList({ items, onSelect, onDelete }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No History Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Your generated content will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HistoryItemComponent
          key={item.id}
          item={item}
          onSelect={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
}
