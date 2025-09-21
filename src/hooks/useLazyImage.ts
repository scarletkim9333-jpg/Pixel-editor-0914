/**
 * 이미지 레이지 로딩 훅
 * Intersection Observer API를 사용하여 성능 최적화
 * Session 7: 성능 최적화
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getCachedImageUrl, cacheImageUrl } from '../services/cacheService';
import { measureImageLoad } from '../utils/performance';

// ==================== 타입 정의 ====================

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  fallbackDelay?: number;
  retryCount?: number;
}

interface LazyImageState {
  src: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  retryCount: number;
}

// ==================== 훅 ====================

export const useLazyImage = (
  imageSrc: string,
  options: UseLazyImageOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackDelay = 3000,
    retryCount: maxRetries = 2
  } = options;

  const [state, setState] = useState<LazyImageState>({
    src: null,
    isLoading: false,
    isLoaded: false,
    hasError: false,
    retryCount: 0
  });

  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 이미지 로드 시작
  const startLoading = useCallback(() => {
    // 캐시된 이미지 URL 먼저 확인
    const cachedUrl = getCachedImageUrl(imageSrc);
    if (cachedUrl) {
      // 캐시 히트 - 즉시 성능 기록
      const timer = measureImageLoad(imageSrc, true);
      timer.start();
      timer.end();

      setState(prev => ({
        ...prev,
        src: cachedUrl,
        isLoading: false,
        isLoaded: true,
        hasError: false
      }));
      return;
    }

    // 성능 측정 시작
    const timer = measureImageLoad(imageSrc, false);

    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false
    }));

    const img = new Image();
    timer.start();

    img.onload = () => {
      // 이미지 로드 성공 시 캐시에 저장
      cacheImageUrl(imageSrc, imageSrc, 30 * 60 * 1000); // 30분간 캐시

      // 성능 측정 완료
      timer.end({ width: img.width, height: img.height });

      setState(prev => ({
        ...prev,
        src: imageSrc,
        isLoading: false,
        isLoaded: true,
        hasError: false
      }));
    };

    img.onerror = () => {
      setState(prev => {
        const newRetryCount = prev.retryCount + 1;

        if (newRetryCount <= maxRetries) {
          // 재시도
          setTimeout(() => startLoading(), 1000 * newRetryCount);
          return {
            ...prev,
            isLoading: false,
            retryCount: newRetryCount
          };
        } else {
          // 최대 재시도 횟수 초과
          return {
            ...prev,
            isLoading: false,
            hasError: true,
            retryCount: newRetryCount
          };
        }
      });
    };

    img.src = imageSrc;

    // fallback 타이머 설정
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!state.isLoaded) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true
        }));
      }
    }, fallbackDelay);

  }, [imageSrc, maxRetries, fallbackDelay, state.isLoaded]);

  // Intersection Observer 설정
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageSrc) return;

    // 이미 로드되었거나 로딩 중이면 skip
    if (state.isLoaded || state.isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startLoading();
            observerRef.current?.unobserve(element);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element);
      }
    };
  }, [imageSrc, threshold, rootMargin, startLoading, state.isLoaded, state.isLoading]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 수동 재시도 함수
  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: 0,
      hasError: false
    }));
    startLoading();
  }, [startLoading]);

  return {
    elementRef,
    src: state.src,
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    hasError: state.hasError,
    retryCount: state.retryCount,
    retry
  };
};

// ==================== 유틸리티 ====================

// 플레이스홀더 이미지 생성 (base64)
export const generatePlaceholder = (width: number, height: number, color = '#f3f4f6') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#9ca3af"
            text-anchor="middle" dominant-baseline="middle">
        이미지 로딩 중...
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// 이미지 사이즈 감지 유틸리티
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = src;
  });
};