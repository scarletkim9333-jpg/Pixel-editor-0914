
import React, { useState } from 'react';
import { ImageIcon, DownloadIcon } from './Icons';
import type { TokenUsage } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

interface OutputViewerProps {
  isLoading: boolean;
  images: string[];
  error: string | null;
  tokenUsage: TokenUsage | null;
  sessionTokenUsage: TokenUsage;
  onResetSessionUsage: () => void;
  onUpscale: (imageUrl: string) => void;
  skeletonCount: number;
}

const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-full bg-gray-300 border-2 border-black animate-pulse aspect-square"></div>
);

const EmptyState: React.FC = () => {
  const { t } = useTranslations();
  return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-8">
        <ImageIcon className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700">{t.emptyStateTitle}</h3>
        <p className="text-base">{t.emptyStateDescription}</p>
      </div>
  );
};

const TokenStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <span className="text-sm text-gray-600">{label}</span>
    <p className="font-semibold text-black text-xl tracking-tighter">{value.toLocaleString()}</p>
  </div>
);


export const OutputViewer: React.FC<OutputViewerProps> = ({ isLoading, images, error, tokenUsage, sessionTokenUsage, onResetSessionUsage, onUpscale, skeletonCount }) => {
  const { t } = useTranslations();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const content = () => {
    if (isLoading) {
      const gridClasses = skeletonCount === 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';
      return (
        <div className={`grid ${gridClasses} gap-4`}>
          {[...Array(skeletonCount)].map((_, i) => <LoadingSkeleton key={i} />)}
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center text-red-600 bg-red-100 p-4 border-2 border-red-500">
          <p><span className="font-bold">{t.errorLabel}</span> {error}</p>
        </div>
      );
    }
    if (images.length === 0) {
      return <EmptyState />;
    }
    
    const gridClasses = images.length === 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';
    return (
      <div className={`grid ${gridClasses} gap-4`}>
        {images.map((img, index) => (
          <div key={index} className="relative group border-2 border-black">
            <img src={img} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover aspect-square" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button onClick={() => setSelectedImage(img)} className="bg-white/90 text-black font-bold py-2 px-4 border border-black hover:bg-white">
                {t.viewButton}
              </button>
              <button onClick={() => onUpscale(img)} className="bg-white/90 text-black font-bold py-2 px-4 border border-black hover:bg-white">
                {t.upscaleButton}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-grow overflow-y-auto">{content()}</div>
      
      {!isLoading && (tokenUsage || sessionTokenUsage.totalTokenCount > 0) && (
         <div className="mt-6 p-4 border-2 border-black shadow-[4px_4px_0_0_#000]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-semibold text-black">{t.tokenUsageTitle}</h4>
              {sessionTokenUsage.totalTokenCount > 0 && (
                <button onClick={onResetSessionUsage} className="text-sm text-[#2E7D73] hover:underline transition-colors font-semibold">{t.resetSessionButton}</button>
              )}
            </div>
            <div className="space-y-3">
              {sessionTokenUsage && sessionTokenUsage.totalTokenCount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{t.thisSessionLabel}</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                      <TokenStat label={t.totalTokensLabel} value={sessionTokenUsage.totalTokenCount} />
                      <TokenStat label={t.promptTokensLabel} value={sessionTokenUsage.promptTokenCount} />
                      <TokenStat label={t.resultTokensLabel} value={sessionTokenUsage.candidatesTokenCount} />
                    </div>
                  </div>
              )}
              {tokenUsage && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{t.lastGenerationLabel}</p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <TokenStat label={t.totalTokensLabel} value={tokenUsage.totalTokenCount} />
                    <TokenStat label={t.promptTokensLabel} value={tokenUsage.promptTokenCount} />
                    <TokenStat label={t.resultTokensLabel} value={tokenUsage.candidatesTokenCount} />
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative bg-[#FDF6E3] p-6 border-2 border-black shadow-[4px_4px_0_0_#000] flex flex-col gap-4 max-w-4xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedImage} alt="Selected output" className="max-w-[80vw] max-h-[70vh] object-contain"/>
            <div className="text-center">
                <p className="text-sm text-gray-700 mb-2">{t.modalResolutionNote}</p>
                <button
                    onClick={() => handleDownload(selectedImage)}
                    className="inline-flex items-center gap-2 bg-[#2E7D73] text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-[#25645c] transition-all duration-100 ease-in-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                    aria-label={t.highResDownload}
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>{t.highResDownload}</span>
                </button>
            </div>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 bg-white text-black h-8 w-8 flex items-center justify-center border-2 border-black font-bold text-xl hover:bg-gray-200 transition"
              aria-label={t.closeButton}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
