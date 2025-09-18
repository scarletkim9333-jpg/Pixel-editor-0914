import React, { useState, useRef, useLayoutEffect } from 'react';
import type { GenerateImageRequest, Preset, ModelId, AspectRatio, Resolution } from '../types';
import type { SidebarMode } from './Sidebar';
import { getPresets } from '../translations';
import { SparklesIcon, ChevronDownIcon } from './Icons';
import { useTranslations } from '../contexts/LanguageContext';
import { getModelTokenCost, getTotalTokenCost, getAspectRatioTokenCost } from '../services/geminiService';
import { OutputSizeDropdown } from './OutputSizeDropdown';

interface ControlsProps {
  onGenerate: () => void;
  onSuggest: (prompt: string) => Promise<string>;
  isLoading: boolean;
  disabledReason: string | null;

  prompt: string;
  setPrompt: (value: string) => void;
  creativity: number;
  setCreativity: (value: number) => void;
  selectedPresets: Preset[];
  setSelectedPresets: (value: Preset[] | ((prev: Preset[]) => Preset[])) => void;
  numberOfOutputs: number;
  setNumberOfOutputs: (value: number) => void;
  selectedPresetOptionIds: string[];
  setSelectedPresetOptionIds: (value: string[] | ((prev: string[]) => string[])) => void;
  model: ModelId;
  setModel: (value: ModelId) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (value: AspectRatio) => void;
  resolution: Resolution;
  setResolution: (value: Resolution) => void;
  generateBtnRef?: React.RefObject<HTMLButtonElement>;
  mode?: SidebarMode;
}

const PixelButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={`border-2 border-black shadow-[3px_3px_0_0_#000] transition-all duration-100 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-800 disabled:border-gray-600 disabled:shadow-[3px_3px_0_0_#666] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${className}`}
        {...props}
    />
  )
);
PixelButton.displayName = 'PixelButton';

const OptionButton: React.FC<{isActive: boolean} & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({isActive, className, ...props}) => (
    <button
      type="button"
      className={`p-2 border-2 font-semibold transition font-neodgm text-base ${
        isActive
          ? 'bg-[#2E7D73] text-white border-black'
          : 'bg-transparent text-black border-black hover:bg-gray-100'
      } ${className}`}
      {...props}
    />
);

export const Controls: React.FC<ControlsProps> = ({
  onGenerate,
  onSuggest,
  isLoading,
  disabledReason,
  prompt,
  setPrompt,
  creativity,
  setCreativity,
  selectedPresets,
  setSelectedPresets,
  numberOfOutputs,
  setNumberOfOutputs,
  selectedPresetOptionIds,
  setSelectedPresetOptionIds,
  model,
  setModel,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  generateBtnRef,
  mode = 'edit',
}) => {
  const { t } = useTranslations();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const PRESETS = getPresets(t);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to allow shrinking
      textarea.style.height = 'auto';
      // Set height to the full content height
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  const handlePresetToggle = (preset: Preset) => {
    setSelectedPresets(prev => {
      const isCurrentlySelected = prev[0]?.id === preset.id;
  
      if (isCurrentlySelected) {
        // Deselect the current preset
        setNumberOfOutputs(1);
        setSelectedPresetOptionIds([]);
        return [];
      } else {
        // Select a new preset
        if (preset.options) {
          // It's a preset with style cards, like Figurine
          setSelectedPresetOptionIds([]); // Start with no selections
          setNumberOfOutputs(1);
        } else {
          // It's a preset without options, like Multi-Angle
          setSelectedPresetOptionIds([]);
          setNumberOfOutputs(preset.id === 'angle_changer' ? 4 : 1);
        }
        return [preset]; // Replace current selection with the new one
      }
    });
  };
  
  const handleOptionClick = (optionId: string) => {
    setSelectedPresetOptionIds(prev => {
        if (prev.includes(optionId)) {
            return prev.filter(id => id !== optionId);
        } else {
            return [...prev, optionId];
        }
    });
  };


  const handleSuggestClick = async () => {
    setIsSuggesting(true);
    const suggestion = await onSuggest(prompt);
    setPrompt(suggestion);
    setIsSuggesting(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };
  
  const handleModelClick = (targetModel: ModelId) => {
    setModel(targetModel);
    if (targetModel === 'seedream' && resolution === '1k') {
        setResolution('2k');
    } else if (targetModel === 'nanobanana') {
        setResolution('1k');
    }
  };

  const selectedPreset = selectedPresets[0];
  let buttonDisabledReason = disabledReason;
  if (!buttonDisabledReason && selectedPreset?.id === 'figurine' && selectedPresetOptionIds.length === 0) {
      buttonDisabledReason = t.figurineNoStyleSelected;
  }
  const isActionDisabled = isLoading || !!buttonDisabledReason;

  // Create 모드일 때는 간단한 프롬프트 입력창만 표시
  if (mode === 'create') {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="prompt" className="font-medium text-black text-base">{t.promptLabel}</label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.promptPlaceholder}
              className="w-full p-2 pr-10 border-2 border-black focus:outline-2 focus:outline-offset-2 focus:outline-black transition bg-[#FFFBF2] text-black placeholder-gray-500 placeholder:text-sm resize-none overflow-y-hidden"
              rows={2}
            />
            <button
              type="button"
              onClick={handleSuggestClick}
              disabled={isSuggesting || isActionDisabled}
              className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-black hover:scale-125 transition-transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label={t.suggestButtonAriaLabel}
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <PixelButton
          ref={generateBtnRef}
          type="submit"
          disabled={isActionDisabled}
          className="w-full bg-[#E57A77] text-white font-bold py-2 px-3 flex items-center justify-center text-lg font-neodgm"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.generateButtonLoading}
            </>
          ) : buttonDisabledReason ? (
            buttonDisabledReason
          ) : (
            <div className="flex items-center justify-center gap-3">
              <span>{t.generateButton}</span>
              <span className="text-xl font-bold bg-black bg-opacity-25 px-3 py-1 rounded border border-white border-opacity-30" style={{ fontFamily: "'Noto Sans KR', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}>
                {getTotalTokenCost(model, aspectRatio, numberOfOutputs)} 🪙
              </span>
            </div>
          )}
        </PixelButton>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="prompt" className="font-medium text-black text-base">{t.promptLabel}</label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.promptPlaceholder}
            className="w-full p-2 pr-10 border-2 border-black focus:outline-2 focus:outline-offset-2 focus:outline-black transition bg-[#FFFBF2] text-black placeholder-gray-500 placeholder:text-sm resize-none overflow-y-hidden"
            rows={2}
          />
          <button
            type="button"
            onClick={handleSuggestClick}
            disabled={isSuggesting || isActionDisabled}
            className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-black hover:scale-125 transition-transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={t.suggestButtonAriaLabel}
          >
            <SparklesIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="w-full flex justify-between items-center py-1"
        >
          <span className="font-medium text-black text-base">{t.presetsLabel}</span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
        </button>

        {showPresets && (
          <div className="space-y-2 pt-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetToggle(preset)}
                className={`w-full p-2 border-2 text-left transition ${
                  selectedPresets.some(p => p.id === preset.id)
                    ? 'bg-[#a4d8d2] border-black ring-2 ring-black'
                    : 'bg-[#FFFBF2] hover:bg-gray-100 border-black'
                }`}
              >
                <p className="font-semibold text-black text-lg font-neodgm">{preset.name}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{preset.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPreset?.id === 'figurine' && selectedPreset.options && (
        <div className="space-y-2">
          <label className="font-medium text-black text-base">{t.styleLabel} ({selectedPresetOptionIds.length})</label>
          <div className="grid grid-cols-2 gap-3">
            {selectedPreset.options.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option.id)}
                className={`p-2 border-2 text-center transition h-full ${
                  selectedPresetOptionIds.includes(option.id)
                  ? 'bg-[#2E7D73] text-white border-black'
                  : 'bg-transparent text-black border-black hover:bg-gray-100'
                }`}
              >
                <p className="font-semibold text-base font-neodgm">{t[option.nameKey]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPreset?.id === 'angle_changer' && (
        <div className="space-y-2">
          <label className="font-medium text-black text-base">{t.outputsLabel}</label>
          <div className="grid grid-cols-2 gap-2">
              {[4, 6].map(num => (
                <OptionButton
                    key={num}
                    onClick={() => setNumberOfOutputs(num)}
                    isActive={numberOfOutputs === num}
                    className="text-xl"
                >
                    {num}
                </OptionButton>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
          <label className="font-medium text-black text-base">{t.modelLabel}</label>
          <div className="grid grid-cols-2 gap-2">
              <OptionButton onClick={() => handleModelClick('nanobanana')} isActive={model === 'nanobanana'}>
                  NanoBanana
              </OptionButton>
              <OptionButton onClick={() => handleModelClick('seedream')} isActive={model === 'seedream'}>
                  Seedance
              </OptionButton>
          </div>
      </div>
      
      <div className="space-y-2">
        <label className="font-medium text-black text-base">{t.resolutionLabel}</label>
        <div className={`grid ${model === 'nanobanana' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {model === 'nanobanana' && (
              <OptionButton onClick={() => setResolution('1k')} isActive={resolution === '1k'}>
                  1K
              </OptionButton>
            )}
            <OptionButton onClick={() => setResolution('2k')} isActive={resolution === '2k'}>
                2K
            </OptionButton>
            <OptionButton onClick={() => setResolution('4k')} isActive={resolution === '4k'}>
                4K
            </OptionButton>
        </div>
      </div>

      <div className="space-y-2">
          <label className="font-medium text-black text-base">Output Size</label>
          <OutputSizeDropdown
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isActionDisabled}
            model={model}
          />
          {getAspectRatioTokenCost(aspectRatio, model) > 0 && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
              추가 {getAspectRatioTokenCost(aspectRatio, model)}토큰 소모
              {model === 'nanobanana' && ' (NanoBanana 종횡비 선택)'}
            </div>
          )}
      </div>

      {/* 고급설정 섹션 */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex justify-between items-center py-1"
        >
          <span className="font-medium text-black text-base">고급설정</span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2 border-2 border-gray-300 border-dashed p-4 bg-gray-50">
            <div className="space-y-2">
              <label htmlFor="creativity" className="font-medium text-black text-lg font-neodgm">{t.creativityLabel} ({creativity.toFixed(1)})</label>
              <input
                id="creativity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      <PixelButton
        ref={generateBtnRef}
        type="submit"
        disabled={isActionDisabled}
        className="w-full bg-[#E57A77] text-white font-bold py-2 px-3 flex items-center justify-center text-lg font-neodgm"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.generateButtonLoading}
          </>
        ) : buttonDisabledReason ? (
          buttonDisabledReason
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span>{t.generateButton}</span>
            <span className="text-xl font-bold bg-black bg-opacity-25 px-3 py-1 rounded border border-white border-opacity-30" style={{ fontFamily: "'Noto Sans KR', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}>
              {getTotalTokenCost(model, aspectRatio, numberOfOutputs)} 🪙
            </span>
          </div>
        )}
      </PixelButton>
    </form>
  );
};