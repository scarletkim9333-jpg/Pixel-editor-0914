import React, { useState } from 'react';
import { OutputViewer } from '../OutputViewer';
import { HistoryPanel } from '../HistoryPanel';
import { useTranslations } from '../../contexts/LanguageContext';
import type { HistoryItem } from '../../types';

interface OutputPanelProps {
  generatedImages: string[];
  isLoading: boolean;
  lastGenerationInfo: {
    model: string;
    iterations: number;
    cost: number;
  } | null;
  lastUpscaleInfo: {
    model: string;
    cost: number;
    count: number;
  } | null;
  history: HistoryItem[];
  activeTab: 'results' | 'history';
  onTabChange: (tab: 'results' | 'history') => void;
  onHistoryItemSelect: (item: HistoryItem) => void;
  onHistoryItemDelete: (id: string) => void;
  onUpscale?: (imageUrl: string) => void;
  onDownload?: (imageUrl: string) => void;
  skeletonCount: number;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedImages,
  isLoading,
  lastGenerationInfo,
  lastUpscaleInfo,
  history,
  activeTab,
  onTabChange,
  onHistoryItemSelect,
  onHistoryItemDelete,
  onUpscale,
  onDownload,
  skeletonCount
}) => {
  const { t } = useTranslations();

  return (
    <div className="pixel-panel h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="pixel-panel-header">
        <div className="flex items-center justify-between">
          <h2>🖼️ OUTPUT</h2>

          {/* 탭 전환 */}
          <div className="flex space-x-1 bg-white bg-opacity-30 p-1 rounded">
            <button
              onClick={() => onTabChange('results')}
              className={`px-3 py-1 text-sm font-semibold rounded transition-all ${
                activeTab === 'results'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              {t('results')}
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`px-3 py-1 text-sm font-semibold rounded transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              {t('history')}
            </button>
          </div>
        </div>
      </div>

      <div className="pixel-panel-content flex-1 overflow-hidden">
        {activeTab === 'results' ? (
          <div className="h-full flex flex-col">
            {/* 결과 이미지 영역 */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="pixel-loader h-full">
                  <div className="pixel-heart animate-pulse text-6xl mb-4">❤️</div>
                  <div className="loading-text text-xl">
                    {t('generating')}
                    <span className="dots">...</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 font-neodgm">
                    AI가 픽셀 아트를 만들고 있어요!
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="space-y-4">
                  {/* 생성된 이미지들 */}
                  <div className="grid gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="pixel-card">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-auto pixel-image"
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-neodgm">
                            #{index + 1}
                          </div>
                        </div>

                        {/* 이미지 액션 버튼들 */}
                        <div className="p-4 border-t-2 border-gray-200">
                          <div className="flex space-x-2">
                            {onDownload && (
                              <button
                                onClick={() => onDownload(imageUrl)}
                                className="pixel-button pixel-button-green flex-1"
                              >
                                📥 {t('download')}
                              </button>
                            )}
                            {onUpscale && (
                              <button
                                onClick={() => onUpscale(imageUrl)}
                                className="pixel-button pixel-button-blue flex-1"
                              >
                                🔍 {t('upscale')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 생성 정보 */}
                  {lastGenerationInfo && (
                    <div className="pixel-border p-4 bg-gray-50">
                      <h4 className="font-bold text-sm mb-2 font-neodgm">생성 정보</h4>
                      <div className="text-xs space-y-1 font-neodgm">
                        <div>모델: {lastGenerationInfo.model}</div>
                        <div>반복: {lastGenerationInfo.iterations}회</div>
                        <div>토큰 사용: {lastGenerationInfo.cost}</div>
                      </div>
                    </div>
                  )}

                  {/* 업스케일 정보 */}
                  {lastUpscaleInfo && (
                    <div className="pixel-border p-4 bg-blue-50">
                      <h4 className="font-bold text-sm mb-2 font-neodgm">업스케일 정보</h4>
                      <div className="text-xs space-y-1 font-neodgm">
                        <div>모델: {lastUpscaleInfo.model}</div>
                        <div>개수: {lastUpscaleInfo.count}개</div>
                        <div>토큰 사용: {lastUpscaleInfo.cost}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-bold mb-2 font-neodgm">
                      {t('noImagesYet')}
                    </h3>
                    <p className="text-gray-600 font-neodgm">
                      왼쪽에서 프롬프트를 입력하고 이미지를 생성해보세요!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full">
            <HistoryPanel
              history={history}
              onItemSelect={onHistoryItemSelect}
              onItemDelete={onHistoryItemDelete}
              isLoading={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};