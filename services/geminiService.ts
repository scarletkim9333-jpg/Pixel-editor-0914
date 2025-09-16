import { generationApi } from '../src/services/api';
import { Language } from "../translations";
import type { GeminiEditRequest, GeminiEditResponse } from '../types';

/**
 * 이미지 생성 서비스
 * 백엔드 API와 통신하여 AI 모델을 통한 이미지 편집 및 생성을 처리합니다.
 */

export const editImageWithGemini = async (request: GeminiEditRequest): Promise<GeminiEditResponse> => {
  try {
    console.log('이미지 생성 요청:', request);

    // 임시로 목업 응답 반환
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기

    // 한글을 안전하게 인코딩하기 위한 함수
    const encodeBase64 = (str: string) => {
      return btoa(unescape(encodeURIComponent(str)));
    };

    return {
      images: [
        'data:image/svg+xml;base64,' + encodeBase64(`
          <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" fill="#90EE90"/>
            <text x="256" y="230" font-family="Arial" font-size="24" text-anchor="middle" dy=".3em" fill="black">
              Generated Image 1
            </text>
            <text x="256" y="280" font-family="Arial" font-size="18" text-anchor="middle" dy=".3em" fill="black">
              ${request.prompt}
            </text>
            <text x="256" y="320" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="gray">
              Model: ${request.model}
            </text>
          </svg>
        `),
        'data:image/svg+xml;base64,' + encodeBase64(`
          <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" fill="#FFB6C1"/>
            <text x="256" y="230" font-family="Arial" font-size="24" text-anchor="middle" dy=".3em" fill="black">
              Generated Image 2
            </text>
            <text x="256" y="280" font-family="Arial" font-size="18" text-anchor="middle" dy=".3em" fill="black">
              ${request.prompt}
            </text>
            <text x="256" y="320" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="gray">
              Creativity: ${request.creativity}
            </text>
          </svg>
        `)
      ],
      text: `임시 응답: "${request.prompt}" 프롬프트로 생성된 이미지`,
      usage: {
        promptTokenCount: 10,
        candidatesTokenCount: 50,
        totalTokenCount: 60
      }
    };

    // 원래 백엔드 호출 코드 (임시 비활성화)
    /*
    // FormData 준비
    const formData = new FormData();

    // 필수: 메인 이미지
    if (!request.mainImage) {
      throw new Error('메인 이미지가 필요합니다.');
    }
    formData.append('image', request.mainImage);

    // 필수: 프롬프트 (일부 모델은 선택사항)
    if (request.prompt) {
      formData.append('prompt', request.prompt);
    }

    // 필수: 모델 선택
    formData.append('model', request.model || 'nanobanana');

    // 선택적 파라미터들
    if (request.creativity !== undefined) {
      formData.append('creativity', request.creativity.toString());
    }

    if (request.numberOfOutputs !== undefined) {
      formData.append('numberOfOutputs', request.numberOfOutputs.toString());
    }

    if (request.aspectRatio) {
      formData.append('aspectRatio', request.aspectRatio);
    }

    if (request.resolution) {
      formData.append('resolution', request.resolution);
    }

    // 참조 이미지들 추가
    if (request.referenceImages && request.referenceImages.length > 0) {
      request.referenceImages.forEach((refImage, index) => {
        formData.append(`referenceImage${index}`, refImage);
      });
    }

    // 프리셋 정보 추가
    if (request.selectedPresets && request.selectedPresets.length > 0) {
      formData.append('selectedPresets', JSON.stringify(request.selectedPresets));
    }

    if (request.selectedPresetOptionIds && request.selectedPresetOptionIds.length > 0) {
      formData.append('selectedPresetOptionIds', JSON.stringify(request.selectedPresetOptionIds));
    }

    // 백엔드 API 호출
    const result = await generationApi.generate(formData);

    // 응답 검증
    if (!result.success) {
      throw new Error(result.error || 'Image generation failed');
    }
    */

  } catch (error) {
    console.error('이미지 생성 실패:', error);

    // 구체적인 에러 메시지 처리
    if (error instanceof Error) {
      // 토큰 부족 에러
      if (error.message.includes('토큰이 부족') || error.message.includes('Insufficient token')) {
        throw new Error('토큰이 부족합니다. 토큰을 구매해주세요.');
      }

      // 인증 에러
      if (error.message.includes('인증') || error.message.includes('Authorization') || error.message.includes('401')) {
        throw new Error('로그인이 필요합니다.');
      }

      // 모델 지원 에러
      if (error.message.includes('Invalid model') || error.message.includes('Unsupported model')) {
        throw new Error('지원하지 않는 모델입니다.');
      }

      // 파일 크기 에러
      if (error.message.includes('File too large') || error.message.includes('파일 크기')) {
        throw new Error('이미지 파일 크기가 너무 큽니다. (최대 50MB)');
      }

      throw error;
    }

    throw new Error('이미지 생성 중 오류가 발생했습니다.');
  }
};

export const getPromptSuggestion = async (
  currentPrompt: string,
  mainImage: File | null,
  referenceImages: File[],
  language: Language
): Promise<string> => {
  try {
    // FormData 준비
    const formData = new FormData();
    formData.append('currentPrompt', currentPrompt);
    formData.append('language', language);

    // 메인 이미지 추가 (선택사항)
    if (mainImage) {
      formData.append('mainImage', mainImage);
    }

    // 참조 이미지들 추가 (선택사항)
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((refImage, index) => {
        formData.append(`referenceImage${index}`, refImage);
      });
    }

    // 백엔드 API 호출
    const result = await generationApi.suggest(formData);

    return result.suggestion || getDefaultSuggestion(language);

  } catch (error) {
    console.error('프롬프트 제안 실패:', error);

    // 에러가 발생해도 기본 제안을 반환
    return getDefaultSuggestion(language);
  }
};

/**
 * 기본 프롬프트 제안 반환
 */
function getDefaultSuggestion(language: Language): string {
  const defaultSuggestions = {
    ko: [
      "해질녘 미래 도시 스카이라인을 그린 생생한 추상화",
      "네온 색상의 사이버펑크 도시 풍경",
      "원시 마법의 숲 속 빛나는 요정 마을",
      "어두운 하늘 아래 빛나는 오로라로 이루어진 드래곤",
      "수채화 스타일의 평화로운 호수와 산",
      "디지털 아트 스타일의 우주 정거장",
      "빈티지 포스터 스타일의 로봇과 도시"
    ],
    en: [
      "A vibrant abstract painting of a futuristic city skyline at dusk",
      "Cyberpunk cityscape with neon colors and rain",
      "Mystical forest with glowing fairy village",
      "Majestic dragon made of aurora lights against dark sky",
      "Watercolor style peaceful lake with mountains",
      "Digital art style space station",
      "Vintage poster style robot and city"
    ]
  };

  const suggestions = defaultSuggestions[language] || defaultSuggestions.en;
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

/**
 * 지원되는 AI 모델 목록과 정보
 */
export const getSupportedModels = () => [
  {
    id: 'nanobanana',
    name: 'NanoBanana Edit',
    description: 'AI-powered image editing with prompts',
    tokenCost: 2,
    requiresPrompt: true,
    supportsUpscale: false,
  },
  {
    id: 'nanobanana-upscale',
    name: 'NanoBanana Upscale',
    description: 'High-quality image upscaling',
    tokenCost: 1,
    requiresPrompt: false,
    supportsUpscale: true,
  },
  {
    id: 'seedream',
    name: 'Seedream Edit',
    description: 'Advanced AI image generation and editing',
    tokenCost: 4,
    requiresPrompt: true,
    supportsUpscale: false,
  },
  {
    id: 'topaz-upscale',
    name: 'Topaz Upscale',
    description: 'Professional-grade image upscaling',
    tokenCost: 5,
    requiresPrompt: false,
    supportsUpscale: true,
  },
];

/**
 * 모델별 토큰 비용 계산
 */
export const getModelTokenCost = (modelId: string): number => {
  const models = getSupportedModels();
  const model = models.find(m => m.id === modelId);
  return model?.tokenCost || 2;
};

/**
 * 모델이 프롬프트를 필요로 하는지 확인
 */
export const modelRequiresPrompt = (modelId: string): boolean => {
  const models = getSupportedModels();
  const model = models.find(m => m.id === modelId);
  return model?.requiresPrompt || false;
};

/**
 * 모델이 업스케일링을 지원하는지 확인
 */
export const modelSupportsUpscale = (modelId: string): boolean => {
  const models = getSupportedModels();
  const model = models.find(m => m.id === modelId);
  return model?.supportsUpscale || false;
};