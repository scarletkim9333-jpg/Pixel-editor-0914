import { useCallback } from 'react';
import {
  EXAMPLES,
  getExamplesByMode,
  getExampleById,
  type ExampleConfig
} from '../config/examples.config';
import { getPresets } from '../../translations';
import type { Preset } from '../../types';

interface UseExamplesReturn {
  examples: ExampleConfig[];
  createExamples: ExampleConfig[];
  editExamples: ExampleConfig[];
  getExample: (id: string) => ExampleConfig | undefined;
  applyExample: (
    example: ExampleConfig,
    callbacks: {
      setCurrentMode: (mode: 'create' | 'edit') => void;
      setPrompt: (prompt: string) => void;
      setCreativity: (creativity: number) => void;
      setModel: (model: 'nanobanana' | 'seedream') => void;
      setAspectRatio: (ratio: 'auto' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16') => void;
      setResolution: (resolution: '1k' | '2k' | '4k') => void;
      setNumberOfOutputs: (count: number) => void;
      setSelectedPresets: (presets: Preset[]) => void;
      setSelectedPresetOptionIds: (ids: string[]) => void;
      setImages?: (files: File[]) => void;
      scrollToTop?: () => void;
    }
  ) => Promise<void>;
}

export const useExamples = (): UseExamplesReturn => {
  const examples = EXAMPLES;
  const createExamples = getExamplesByMode('create');
  const editExamples = getExamplesByMode('edit');

  const getExample = useCallback((id: string) => {
    return getExampleById(id);
  }, []);

  const applyExample = useCallback(async (
    example: ExampleConfig,
    callbacks: UseExamplesReturn['applyExample'] extends (example: ExampleConfig, callbacks: infer T) => Promise<void> ? T : never
  ) => {
    const {
      setCurrentMode,
      setPrompt,
      setCreativity,
      setModel,
      setAspectRatio,
      setResolution,
      setNumberOfOutputs,
      setSelectedPresets,
      setSelectedPresetOptionIds,
      setImages,
      scrollToTop
    } = callbacks;

    try {
      // 1. 모드 설정
      setCurrentMode(example.mode);

      // 2. 프롬프트 설정
      setPrompt(example.prompt);

      // 3. 기본 설정 적용
      setCreativity(example.settings.creativity);
      setModel(example.settings.model);
      setAspectRatio(example.settings.aspectRatio);
      setResolution(example.settings.resolution);
      setNumberOfOutputs(example.settings.numberOfOutputs || 1);

      // 4. 프리셋 설정 (Edit 모드에서만)
      if (example.mode === 'edit' && example.preset) {
        const allPresets = getPresets({} as any); // 실제로는 translation을 받아야 함
        const targetPreset = allPresets.find(p => p.id === example.preset!.id);

        if (targetPreset) {
          setSelectedPresets([targetPreset]);
          setSelectedPresetOptionIds(example.preset.optionIds);
        }
      } else {
        // Create 모드이거나 프리셋이 없는 경우 초기화
        setSelectedPresets([]);
        setSelectedPresetOptionIds([]);
      }

      // 5. 이미지 로드 (Edit 모드에서 원본 이미지가 있는 경우)
      if (example.mode === 'edit' && example.images.original && setImages) {
        try {
          const response = await fetch(example.images.original);
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], 'example-original.jpg', { type: blob.type });
            setImages([file]);
          }
        } catch (error) {
          console.warn('예시 원본 이미지를 로드할 수 없습니다:', error);
          // 이미지 로드 실패해도 다른 설정은 적용
        }
      } else if (example.mode === 'create' && setImages) {
        // Create 모드에서는 이미지 초기화
        setImages([]);
      }

      // 6. 스크롤 이동 (옵션)
      if (scrollToTop) {
        setTimeout(() => {
          scrollToTop();
        }, 100);
      }

      console.log('예시 설정 적용 완료:', {
        id: example.id,
        mode: example.mode,
        model: example.settings.model,
        prompt: example.prompt.substring(0, 50) + '...'
      });

    } catch (error) {
      console.error('예시 적용 중 오류 발생:', error);
      throw new Error('예시 설정을 적용하는데 실패했습니다.');
    }
  }, []);

  return {
    examples,
    createExamples,
    editExamples,
    getExample,
    applyExample
  };
};

export default useExamples;