
import { supabase } from '../src/lib/supabase';
import { Language } from "../translations";
import type { GeminiEditRequest, GeminiEditResponse } from '../types';

// 인증 토큰 가져오기
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// 기존 함수들은 백엔드로 이동되었습니다.


export const editImageWithGemini = async (request: GeminiEditRequest): Promise<GeminiEditResponse> => {
  try {
    // 인증 토큰 획득
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('로그인이 필요합니다.');
    }

    // 백엔드 API 호출을 위한 FormData 준비
    const formData = new FormData();

    // 메인 이미지 추가
    if (request.mainImage) {
      formData.append('image', request.mainImage);
    }

    // 참조 이미지들 추가
    if (request.referenceImages && request.referenceImages.length > 0) {
      request.referenceImages.forEach((refImage, index) => {
        formData.append(`referenceImage${index}`, refImage);
      });
    }

    // 요청 파라미터들 추가
    formData.append('prompt', request.prompt);
    formData.append('model', request.model || 'nanobanana');
    formData.append('creativity', request.creativity?.toString() || '0.7');
    formData.append('numberOfOutputs', request.numberOfOutputs?.toString() || '1');
    formData.append('aspectRatio', request.aspectRatio || '1:1');
    formData.append('resolution', request.resolution || '1k');

    // 프리셋 정보 추가
    if (request.selectedPresets && request.selectedPresets.length > 0) {
      formData.append('selectedPresets', JSON.stringify(request.selectedPresets));
    }

    if (request.selectedPresetOptionIds && request.selectedPresetOptionIds.length > 0) {
      formData.append('selectedPresetOptionIds', JSON.stringify(request.selectedPresetOptionIds));
    }

    // 백엔드 API 호출
    const response = await fetch('http://localhost:3001/api/generation/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Generation failed');
    }

    const result = await response.json();

    // 응답 데이터를 GeminiEditResponse 형식으로 변환
    return {
      images: result.images || [],
      text: result.text || null,
      usage: result.usage || null
    };

  } catch (error) {
    console.error('이미지 생성 API 호출 실패:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('이미지 생성 중 오류가 발생했습니다.');
  }
};


export const getPromptSuggestion = async (currentPrompt: string, mainImage: File | null, referenceImages: File[], language: Language): Promise<string> => {
  try {
    // 인증 토큰 획득
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('로그인이 필요합니다.');
    }

    // 백엔드 API 호출을 위한 FormData 준비
    const formData = new FormData();
    formData.append('currentPrompt', currentPrompt);
    formData.append('language', language);

    // 메인 이미지 추가
    if (mainImage) {
      formData.append('mainImage', mainImage);
    }

    // 참조 이미지들 추가
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((refImage, index) => {
        formData.append(`referenceImage${index}`, refImage);
      });
    }

    // 백엔드 API 호출
    const response = await fetch('http://localhost:3001/api/generation/suggest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Suggestion failed');
    }

    const result = await response.json();
    return result.suggestion || (language === 'ko' ? "해질녘 미래 도시 스카이라인을 그린 생생한 추상화." : "A vibrant abstract painting of a futuristic city skyline at dusk.");

  } catch (error) {
    console.error('프롬프트 제안 API 호출 실패:', error);
    return language === 'ko' ? "해질녘 미래 도시 스카이라인을 그린 생생한 추상화." : "A vibrant abstract painting of a futuristic city skyline at dusk.";
  }
};
