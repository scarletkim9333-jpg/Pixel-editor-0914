import React, { useState } from 'react';
import { Controls } from '../Controls';
import { ImageUploader } from '../ImageUploader';
import { DrawingCanvas } from '../DrawingCanvas';
import { useTranslations } from '../../contexts/LanguageContext';
import type {
  ModelId,
  AspectRatio,
  Resolution,
  Preset,
  GenerateImageRequest
} from '../../types';

interface InputPanelProps {
  mode: 'create' | 'edit';
  images: File[];
  onImagesChange: (images: File[]) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  creativity: number;
  onCreativityChange: (creativity: number) => void;
  selectedPresets: Preset[];
  onPresetsChange: (presets: Preset[]) => void;
  selectedPresetOptionIds: string[];
  onPresetOptionIdsChange: (ids: string[]) => void;
  numberOfOutputs: number;
  onNumberOfOutputsChange: (count: number) => void;
  model: ModelId;
  onModelChange: (model: ModelId) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  resolution: Resolution;
  onResolutionChange: (resolution: Resolution) => void;
  onGenerate: (request: GenerateImageRequest) => void;
  isLoading: boolean;
  requiredTokens: number;
  onDrawingCanvasToggle: () => void;
  isDrawingCanvasOpen: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  mode,
  images,
  onImagesChange,
  prompt,
  onPromptChange,
  creativity,
  onCreativityChange,
  selectedPresets,
  onPresetsChange,
  selectedPresetOptionIds,
  onPresetOptionIdsChange,
  numberOfOutputs,
  onNumberOfOutputsChange,
  model,
  onModelChange,
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
  onGenerate,
  isLoading,
  requiredTokens,
  onDrawingCanvasToggle,
  isDrawingCanvasOpen
}) => {
  const { t } = useTranslations();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mainImage = images[0] || null;

  return (
    <div className="pixel-panel h-full flex flex-col">
      {/* 패널 헤더 */}
      <div className="pixel-panel-header">
        <h2>📝 INPUT</h2>
      </div>

      <div className="pixel-panel-content flex-1 overflow-y-auto">
        {/* 프롬프트 입력 영역 */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 font-neodgm">
            {t('prompt')}
          </label>
          <div className="speech-bubble">
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={mode === 'create' ? t('promptPlaceholder') : t('editPromptPlaceholder')}
              className="pixel-input w-full h-24 resize-none border-0 bg-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 이미지 업로드 영역 */}
        {mode === 'edit' && (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 font-neodgm">
              {t('uploadImage')}
            </label>
            <div className="pixel-border p-4 rounded-lg">
              <ImageUploader
                images={images}
                onImagesChange={onImagesChange}
                disabled={isLoading}
                maxImages={mode === 'edit' ? 2 : 0}
              />

              {/* 그리기 도구 토글 */}
              <div className="mt-4 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={onDrawingCanvasToggle}
                  className="pixel-button pixel-button-blue w-full"
                  disabled={isLoading}
                >
                  {isDrawingCanvasOpen ? t('closeDrawing') : t('openDrawing')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 기본 설정 */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 모델 선택 */}
            <div>
              <label className="block text-sm font-bold mb-2 font-neodgm">
                {t('model')}
              </label>
              <select
                value={model}
                onChange={(e) => onModelChange(e.target.value as ModelId)}
                className="pixel-dropdown w-full"
                disabled={isLoading}
              >
                <option value="nanobanana">NanoBanana</option>
                <option value="seedream">Seedream</option>
              </select>
            </div>

            {/* 출력 크기 */}
            <div>
              <label className="block text-sm font-bold mb-2 font-neodgm">
                {t('outputSize')}
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => onAspectRatioChange(e.target.value as AspectRatio)}
                className="pixel-dropdown w-full"
                disabled={isLoading}
              >
                <option value="auto">{t('auto')}</option>
                <option value="square">{t('square')}</option>
                <option value="portrait">{t('portrait')}</option>
                <option value="landscape">{t('landscape')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 고급 설정 토글 */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="pixel-button pixel-button-yellow w-full mb-4"
            disabled={isLoading}
          >
            {showAdvanced ? '▼ ' : '▶ '}{t('advancedSettings')}
          </button>

          {showAdvanced && (
            <div className="pixel-border p-4 space-y-4">
              <Controls
                prompt={prompt}
                onPromptChange={onPromptChange}
                creativity={creativity}
                onCreativityChange={onCreativityChange}
                selectedPresets={selectedPresets}
                onPresetsChange={onPresetsChange}
                selectedPresetOptionIds={selectedPresetOptionIds}
                onPresetOptionIdsChange={onPresetOptionIdsChange}
                numberOfOutputs={numberOfOutputs}
                onNumberOfOutputsChange={onNumberOfOutputsChange}
                model={model}
                onModelChange={onModelChange}
                aspectRatio={aspectRatio}
                onAspectRatioChange={onAspectRatioChange}
                resolution={resolution}
                onResolutionChange={onResolutionChange}
                onGenerate={onGenerate}
                isLoading={isLoading}
                mainImage={mainImage}
                requiredTokens={requiredTokens}
                mode={mode}
                hidePrompt={true}
                hideGenerateButton={true}
              />
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => {
              const request: GenerateImageRequest = {
                prompt,
                model,
                aspectRatio,
                resolution,
                creativity,
                numberOfOutputs,
                selectedPresets,
                selectedPresetOptionIds,
                mainImage,
                referenceImages: images.slice(1)
              };
              onGenerate(request);
            }}
            disabled={isLoading || !prompt.trim() || (mode === 'edit' && !mainImage)}
            className="pixel-button w-full py-4 text-lg font-bold"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="pixel-heart animate-pulse">❤️</div>
                <span>{t('generating')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🎨</span>
                <span>
                  {mode === 'create' ? t('generateImage') : t('editImage')}
                  {requiredTokens > 0 && ` (${requiredTokens} ${t('tokens')})`}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 그리기 캔버스 모달 */}
      {isDrawingCanvasOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-neodgm">{t('drawingCanvas')}</h3>
              <button
                onClick={onDrawingCanvasToggle}
                className="pixel-button pixel-button-blue"
              >
                {t('close')}
              </button>
            </div>
            <DrawingCanvas
              onImageCreated={(file) => {
                onImagesChange([file, ...images.slice(1)]);
                onDrawingCanvasToggle();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};