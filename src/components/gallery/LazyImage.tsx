/**
 * 레이지 로딩 이미지 컴포넌트
 * 픽셀 테마 스타일링과 완벽 통합
 * Session 7: 성능 최적화
 */

import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLazyImage, generatePlaceholder } from '../../hooks/useLazyImage';

// ==================== 타입 정의 ====================

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
}

// ==================== 컴포넌트 ====================

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  placeholderColor = '#f8f9fa',
  onLoad,
  onError,
  fallbackSrc,
  objectFit = 'cover'
}) => {
  const {
    elementRef,
    src: loadedSrc,
    isLoading,
    isLoaded,
    hasError,
    retryCount,
    retry
  } = useLazyImage(src, {
    threshold: 0.1,
    rootMargin: '100px',
    fallbackDelay: 5000,
    retryCount: 2
  });

  // 로드 완료 콜백
  React.useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  // 에러 콜백
  React.useEffect(() => {
    if (hasError && onError) {
      onError();
    }
  }, [hasError, onError]);

  // 픽셀 테마 기본 클래스
  const baseClasses = 'pixel-border transition-all duration-300';

  // 상태별 컨테이너 스타일
  const getContainerClasses = () => {
    let classes = `${baseClasses} ${className} relative overflow-hidden`;

    if (isLoading) {
      classes += ' animate-pulse bg-gray-100';
    } else if (hasError) {
      classes += ' bg-red-50 border-red-200';
    } else if (isLoaded) {
      classes += ' bg-white';
    } else {
      classes += ' bg-gray-50';
    }

    return classes;
  };

  // 이미지 스타일
  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease-in-out'
  };

  // 실제 표시할 이미지 소스 결정
  const displaySrc = hasError ? (fallbackSrc || generatePlaceholder(width, height, '#fee2e2')) : loadedSrc;

  return (
    <div
      ref={elementRef}
      className={getContainerClasses()}
      style={{ width, height }}
    >
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="pixel-spinner">
            <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-sm animate-spin"></div>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-500">
          <ExclamationTriangleIcon className="w-8 h-8 mb-2" />
          <p className="text-xs text-center px-2 mb-2">
            이미지 로드 실패
            {retryCount > 0 && <span className="block">({retryCount}회 재시도)</span>}
          </p>
          <button
            onClick={retry}
            className="pixel-button pixel-button-sm bg-red-100 hover:bg-red-200 text-red-600 flex items-center gap-1"
          >
            <ArrowPathIcon className="w-3 h-3" />
            재시도
          </button>
        </div>
      )}

      {/* 실제 이미지 */}
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          style={{
            ...imageStyles,
            opacity: isLoaded ? 1 : 0
          }}
          className="block"
        />
      )}

      {/* 플레이스홀더 (이미지 로드 전) */}
      {!isLoading && !displaySrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-400 text-xs text-center px-2">
            이미지 준비 중...
          </div>
        </div>
      )}

      {/* 로드 성공 인디케이터 (디버깅용) */}
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
      )}
    </div>
  );
};

// ==================== 특화 컴포넌트 ====================

// 갤러리용 섬네일 이미지
export const GalleryThumbnail: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ src, alt, size = 'md', onClick }) => {
  const dimensions = {
    sm: { width: 120, height: 120 },
    md: { width: 200, height: 200 },
    lg: { width: 300, height: 300 }
  };

  const { width, height } = dimensions[size];

  return (
    <div
      className={`cursor-pointer transform hover:scale-105 transition-transform ${
        onClick ? 'hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <LazyImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg"
        objectFit="cover"
      />
    </div>
  );
};

// 예시 쇼케이스용 이미지
export const ExampleImage: React.FC<{
  src: string;
  alt: string;
  title?: string;
  description?: string;
}> = ({ src, alt, title, description }) => {
  return (
    <div className="pixel-card overflow-hidden">
      <LazyImage
        src={src}
        alt={alt}
        width={300}
        height={200}
        className="w-full"
        objectFit="cover"
      />
      {(title || description) && (
        <div className="p-3">
          {title && (
            <h3 className="pixel-text font-bold text-sm mb-1">{title}</h3>
          )}
          {description && (
            <p className="pixel-text text-xs text-gray-600">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};