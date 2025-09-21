/**
 * 예시 시스템 설정
 * Create/Edit 모드별 예시 데이터를 정의합니다.
 */

import type { ModelId, AspectRatio, Resolution } from '../../types';

export interface ExampleConfig {
  id: string;
  mode: 'create' | 'edit';
  title: {
    ko: string;
    en: string;
  };
  description: {
    ko: string;
    en: string;
  };
  prompt: string;
  settings: {
    model: ModelId;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    creativity: number;
    numberOfOutputs?: number;
  };
  preset?: {
    id: string;
    optionIds: string[];
  };
  images: {
    original?: string; // Edit 모드에서만 사용
    result: string;
    thumbnail: string;
  };
  category: 'character' | 'landscape' | 'style' | 'preset';
}

export const EXAMPLES: ExampleConfig[] = [
  // Create 모드 예시
  {
    id: 'fantasy-character',
    mode: 'create',
    title: {
      ko: '판타지 캐릭터 생성',
      en: 'Fantasy Character Creation'
    },
    description: {
      ko: '마법사, 전사, 엘프 등 판타지 캐릭터를 생성해보세요',
      en: 'Create fantasy characters like wizards, warriors, elves'
    },
    prompt: 'A mystical elf mage with glowing blue eyes, wearing ornate robes, holding a crystal staff, fantasy art style, detailed character design',
    settings: {
      model: 'nanobanana',
      aspectRatio: '3:4',
      resolution: '1k',
      creativity: 0.7,
      numberOfOutputs: 1
    },
    images: {
      result: '/examples/create/fantasy-character.jpg',
      thumbnail: '/examples/thumbnails/fantasy-character-thumb.jpg'
    },
    category: 'character'
  },
  {
    id: 'landscape-art',
    mode: 'create',
    title: {
      ko: '풍경 아트 생성',
      en: 'Landscape Art Creation'
    },
    description: {
      ko: '아름다운 자연 풍경과 환상적인 배경을 만들어보세요',
      en: 'Create beautiful natural landscapes and fantastic backgrounds'
    },
    prompt: 'A serene mountain lake at sunset, surrounded by pine trees, golden hour lighting, peaceful atmosphere, digital art style',
    settings: {
      model: 'seedream',
      aspectRatio: '16:9',
      resolution: '2k',
      creativity: 0.6,
      numberOfOutputs: 1
    },
    images: {
      result: '/examples/create/landscape-art.jpg',
      thumbnail: '/examples/thumbnails/landscape-art-thumb.jpg'
    },
    category: 'landscape'
  },
  {
    id: 'abstract-art',
    mode: 'create',
    title: {
      ko: '추상 아트 생성',
      en: 'Abstract Art Creation'
    },
    description: {
      ko: '독창적인 추상 미술 작품을 AI로 생성해보세요',
      en: 'Generate unique abstract art pieces with AI'
    },
    prompt: 'Abstract geometric composition with vibrant colors, flowing shapes, modern art style, dynamic movement, colorful gradients',
    settings: {
      model: 'nanobanana',
      aspectRatio: '1:1',
      resolution: '1k',
      creativity: 0.8,
      numberOfOutputs: 1
    },
    images: {
      result: '/examples/create/abstract-art.jpg',
      thumbnail: '/examples/thumbnails/abstract-art-thumb.jpg'
    },
    category: 'style'
  },

  // Edit 모드 예시 (기존 프리셋 활용)
  {
    id: 'multi-angle',
    mode: 'edit',
    title: {
      ko: '멀티 앵글 변환',
      en: 'Multi-Angle Transformation'
    },
    description: {
      ko: '하나의 이미지를 6가지 다른 앵글로 변환해보세요',
      en: 'Transform one image into 6 different angles'
    },
    prompt: 'Show this character from multiple angles: front view, back view, side view, three-quarter view',
    settings: {
      model: 'nanobanana',
      aspectRatio: 'auto',
      resolution: '1k',
      creativity: 0.4,
      numberOfOutputs: 6
    },
    preset: {
      id: 'angle_changer',
      optionIds: ['front', 'back', 'left_side', 'right_side', 'three_quarter_left', 'three_quarter_right']
    },
    images: {
      original: '/examples/edit/multi-angle-original.jpg',
      result: '/examples/edit/multi-angle-result.jpg',
      thumbnail: '/examples/thumbnails/multi-angle-thumb.jpg'
    },
    category: 'preset'
  },
  {
    id: 'figurine',
    mode: 'edit',
    title: {
      ko: '피규어화 스타일',
      en: 'Figurine Style'
    },
    description: {
      ko: '캐릭터를 다양한 피규어 스타일로 변환해보세요',
      en: 'Transform characters into various figurine styles'
    },
    prompt: 'Transform this character into collectible figurine styles',
    settings: {
      model: 'nanobanana',
      aspectRatio: 'auto',
      resolution: '1k',
      creativity: 0.5,
      numberOfOutputs: 3
    },
    preset: {
      id: 'figurine',
      optionIds: ['nendoroid', 'pop_figure', 'scale_figure']
    },
    images: {
      original: '/examples/edit/figurine-original.jpg',
      result: '/examples/edit/figurine-result.jpg',
      thumbnail: '/examples/thumbnails/figurine-thumb.jpg'
    },
    category: 'preset'
  },
  {
    id: 'style-transfer',
    mode: 'edit',
    title: {
      ko: '스타일 변환',
      en: 'Style Transfer'
    },
    description: {
      ko: '이미지를 다른 예술 스타일로 변환해보세요',
      en: 'Transform images into different art styles'
    },
    prompt: 'Transform this image into anime art style with vibrant colors and clean lines',
    settings: {
      model: 'seedream',
      aspectRatio: 'auto',
      resolution: '2k',
      creativity: 0.6,
      numberOfOutputs: 1
    },
    images: {
      original: '/examples/edit/style-transfer-original.jpg',
      result: '/examples/edit/style-transfer-result.jpg',
      thumbnail: '/examples/thumbnails/style-transfer-thumb.jpg'
    },
    category: 'style'
  }
];

/**
 * 모드별 예시 필터링
 */
export const getExamplesByMode = (mode: 'create' | 'edit'): ExampleConfig[] => {
  return EXAMPLES.filter(example => example.mode === mode);
};

/**
 * 카테고리별 예시 필터링
 */
export const getExamplesByCategory = (category: ExampleConfig['category']): ExampleConfig[] => {
  return EXAMPLES.filter(example => example.category === category);
};

/**
 * ID로 예시 찾기
 */
export const getExampleById = (id: string): ExampleConfig | undefined => {
  return EXAMPLES.find(example => example.id === id);
};

/**
 * 다국어 제목 가져오기
 */
export const getExampleTitle = (example: ExampleConfig, language: 'ko' | 'en'): string => {
  return example.title[language];
};

/**
 * 다국어 설명 가져오기
 */
export const getExampleDescription = (example: ExampleConfig, language: 'ko' | 'en'): string => {
  return example.description[language];
};