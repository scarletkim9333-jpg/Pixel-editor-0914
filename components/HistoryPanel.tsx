
import React from 'react';
import type { HistoryItem } from '../types';
import { ImageIcon, TrashIcon, UploadIcon as LoadIcon } from './Icons';
import { useTranslations } from '../contexts/LanguageContext';

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: number) => void;
}

const EmptyHistoryState: React.FC = () => {
  const { t } = useTranslations();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-8">
      <ImageIcon className="w-16 h-16 mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold text-gray-700">{t.historyEmptyTitle}</h3>
      <p className="text-base">{t.historyEmptyDescription}</p>
    </div>
  );
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onDelete }) => {
  const { t } = useTranslations();
  if (history.length === 0) {
    return <EmptyHistoryState />;
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="p-4 flex gap-4 items-start border-2 border-black shadow-[2px_2px_0_0_#000]">
          <img src={item.images[0]} alt="History thumbnail" className="w-24 h-24 object-cover flex-shrink-0 bg-gray-200 border-2 border-black" />
          <div className="flex-grow min-w-0">
            <p className="text-sm text-gray-600 mb-1">{new Date(item.timestamp).toLocaleString()}</p>
            <p className="text-base text-black line-clamp-2 mb-2 bg-white p-2 border border-gray-400 overflow-hidden text-ellipsis">
              {item.request.prompt || t.historyNoPrompt}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onLoad(item)}
                className="flex items-center gap-2 text-base bg-[#2E7D73] hover:bg-[#25645c] text-white font-semibold py-1.5 px-3 border border-black transition"
                aria-label="Load generation"
              >
                <LoadIcon className="w-4 h-4" />
                <span>{t.loadButton}</span>
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex items-center gap-2 text-base bg-gray-300 hover:bg-red-400 text-black hover:text-white font-semibold py-1.5 px-3 border border-black transition"
                aria-label="Delete generation"
              >
                <TrashIcon className="w-4 h-4" />
                <span>{t.deleteButton}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};