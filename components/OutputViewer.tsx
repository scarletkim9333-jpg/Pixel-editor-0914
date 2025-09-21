
import React, { useState } from 'react';
import { PhotoIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { TokenUsage } from '../types';
import { useTranslations } from '../contexts/LanguageContext';
import { LoadingAnimation } from './LoadingAnimation';

interface OutputViewerProps {
  isLoading: boolean;
  images: string[];
  error: string | null;
  tokenUsage: TokenUsage | null;
  sessionTokenUsage: TokenUsage;
  onResetSessionUsage: () => void;
  onUpscale: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
  skeletonCount: number;
  lastGenerationInfo?: {
    model: string;
    iterations: number;
    cost: number;
  };
  lastUpscaleInfo?: {
    model: string;
    cost: number;
    count: number;
  };
}

const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-full bg-gray-300 border-2 border-black animate-pulse aspect-square"></div>
);

const EmptyState: React.FC = () => {
  const { t } = useTranslations();
  return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-8">
        <PhotoIcon className="w-16 h-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700 font-neodgm">{t.emptyStateTitle}</h3>
        <p className="text-base">{t.emptyStateDescription}</p>
      </div>
  );
};

const TokenStat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div>
    <span className="text-sm text-gray-600" style={{ fontFamily: "'Noto Sans KR', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}>{label}</span>
    <p className="font-semibold text-black text-lg tracking-tighter font-neodgm">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);


export const OutputViewer: React.FC<OutputViewerProps> = ({ isLoading, images, error, tokenUsage, sessionTokenUsage, onResetSessionUsage, onUpscale, onEditImage, skeletonCount, lastGenerationInfo, lastUpscaleInfo }) => {
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
      const model = lastGenerationInfo?.model || 'nanobanana';
      return (
        <LoadingAnimation model={model} />
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
              <button onClick={() => setSelectedImage(img)} className="bg-white/90 text-black font-bold py-2 px-4 border border-black hover:bg-white font-neodgm">
                {t.viewButton}
              </button>
              <button onClick={() => onUpscale(img)} className="bg-white/90 text-black font-bold py-2 px-4 border border-black hover:bg-white font-neodgm">
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
              <h4 className="text-base font-semibold text-black font-neodgm">{t.tokenUsageTitle}</h4>
              {sessionTokenUsage.totalTokenCount > 0 && (
                <button onClick={onResetSessionUsage} className="text-sm text-[#2E7D73] hover:underline transition-colors font-semibold font-neodgm">{t.resetSessionButton}</button>
              )}
            </div>
            <div className="space-y-3">
              {lastGenerationInfo && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">📊 이번 생성 정보</p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <TokenStat label="🤖 모델" value={lastGenerationInfo.model} />
                    <TokenStat label="🪙 비용" value={lastGenerationInfo.cost} />
                    <TokenStat label="🔄 시행횟수" value={lastGenerationInfo.iterations} />
                  </div>
                </div>
              )}
              {lastUpscaleInfo && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">🔍 업스케일 정보</p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <TokenStat label="⚡ 모델" value={lastUpscaleInfo.model} />
                    <TokenStat label="🪙 비용" value={lastUpscaleInfo.cost} />
                    <TokenStat label="🔢 횟수" value={lastUpscaleInfo.count} />
                  </div>
                </div>
              )}
              {sessionTokenUsage && sessionTokenUsage.totalTokenCount > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">📈 세션 누적</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <TokenStat label="🪙 총 사용" value={sessionTokenUsage.totalTokenCount} />
                      <TokenStat label="🔢 생성 횟수" value={Math.floor(sessionTokenUsage.totalTokenCount / (lastGenerationInfo?.cost || 1))} />
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
                <div className="flex gap-3 justify-center">
                  <button
                      onClick={() => handleDownload(selectedImage)}
                      className="inline-flex items-center gap-2 bg-[#2E7D73] text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-[#25645c] transition-all duration-100 ease-in-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                      aria-label={t.highResDownload}
                  >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>{t.highResDownload}</span>
                  </button>
                  {onEditImage && (
                    <button
                        onClick={() => {
                          onEditImage(selectedImage);
                          setSelectedImage(null);
                        }}
                        className="inline-flex items-center gap-2 bg-[#E57A77] text-white font-bold py-2 px-4 border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-[#d66966] transition-all duration-100 ease-in-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                        aria-label="이 이미지 편집하기"
                    >
                        ✏️
                        <span>이 이미지 편집하기</span>
                    </button>
                  )}
                </div>
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
