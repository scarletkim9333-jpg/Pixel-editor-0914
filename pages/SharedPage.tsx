/**
 * 공유된 이미지 표시 페이지
 * /share/:shareCode 경로로 접근하는 공유 페이지
 * Session 6: 공유 기능 구현
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  LinkIcon,
  HeartIcon,
  ShareIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useSharedItem } from '../src/hooks/useShare';
import type { SharedItem } from '../src/services/shareService';
import type { GalleryItem } from '../src/services/galleryService';

// ==================== 타입 정의 ====================

export interface SharedPageProps {
  shareCode: string;
  onNavigateHome: () => void;
}

// ==================== 메인 컴포넌트 ====================

export const SharedPage: React.FC<SharedPageProps> = ({
  shareCode,
  onNavigateHome
}) => {
  const { sharedItem, galleryItem, isLoading, error, isFound, loadSharedItem } = useSharedItem();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  // 공유된 아이템 로드
  useEffect(() => {
    if (shareCode) {
      loadSharedItem(shareCode);
    }
  }, [shareCode, loadSharedItem]);

  // 메타태그 동적 설정
  useEffect(() => {
    if (sharedItem && galleryItem) {
      // 페이지 제목 설정
      document.title = `${sharedItem.title || galleryItem.name} - Pixel Editor AI`;

      // 메타태그 설정
      const setMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      const setMetaName = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      // Open Graph 메타태그
      setMetaTag('og:title', sharedItem.title || galleryItem.name);
      setMetaTag('og:description', sharedItem.description || galleryItem.prompt);
      setMetaTag('og:image', galleryItem.imageUrl);
      setMetaTag('og:url', window.location.href);
      setMetaTag('og:type', 'website');

      // Twitter Card 메타태그
      setMetaName('twitter:card', 'summary_large_image');
      setMetaName('twitter:title', sharedItem.title || galleryItem.name);
      setMetaName('twitter:description', sharedItem.description || galleryItem.prompt);
      setMetaName('twitter:image', galleryItem.imageUrl);

      // 일반 메타태그
      setMetaName('description', sharedItem.description || galleryItem.prompt);

      setViewCount(sharedItem.viewCount);
    }

    // 컴포넌트 언마운트 시 기본 메타태그로 복원
    return () => {
      document.title = 'Pixel Editor AI';
    };
  }, [sharedItem, galleryItem]);

  // 이미지 다운로드
  const handleDownload = () => {
    if (!galleryItem || !sharedItem?.allowDownload) return;

    const link = document.createElement('a');
    link.href = galleryItem.imageUrl;
    link.download = `${sharedItem.title || galleryItem.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 공유하기
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: sharedItem?.title || galleryItem?.name,
          text: sharedItem?.description || galleryItem?.prompt,
          url: window.location.href
        });
      } catch (error) {
        console.log('공유 취소 또는 실패:', error);
      }
    } else {
      // 폴백: 클립보드 복사
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다!');
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
      }
    }
  };

  // 앱으로 이동
  const handleGoToApp = () => {
    onNavigateHome();
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Neo둥근모, sans-serif' }}>
            이미지를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러 또는 찾을 수 없음
  if (error || !isFound || !sharedItem || !galleryItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Neo둥근모, sans-serif' }}>
            이미지를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            {error || '공유된 이미지가 존재하지 않거나 만료되었습니다.'}
          </p>
          <button
            onClick={handleGoToApp}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all duration-200"
            style={{ fontFamily: 'Neo둥근모, sans-serif' }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Pixel Editor로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50" style={{ fontFamily: 'Neo둥근모, sans-serif' }}>
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b-2 border-pink-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoToApp}
              className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Pixel Editor AI</span>
            </button>

            <div className="flex items-center gap-4">
              {/* 조회수 */}
              <div className="flex items-center gap-1 text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span className="text-sm">{viewCount.toLocaleString()}</span>
              </div>

              {/* 공유 버튼 */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                <span className="text-sm">공유</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 이미지 표시 */}
          <div className="space-y-4">
            <div
              className="relative bg-white rounded-xl shadow-lg overflow-hidden"
              style={{ border: '3px solid rgba(255, 182, 193, 0.8)' }}
            >
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              {imageError ? (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>이미지를 불러올 수 없습니다</p>
                  </div>
                </div>
              ) : (
                <img
                  src={galleryItem.imageUrl}
                  alt={sharedItem.title || galleryItem.name}
                  className={`w-full h-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-3">
              {/* 다운로드 버튼 */}
              {sharedItem.allowDownload && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-medium hover:from-pink-500 hover:to-purple-500 transition-all duration-200"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  다운로드
                </button>
              )}

              {/* 좋아요 버튼 */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isLiked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                좋아요
              </button>

              {/* Pixel Editor로 이동 */}
              <button
                onClick={handleGoToApp}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-pink-300 text-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-all duration-200"
              >
                <LinkIcon className="w-4 h-4" />
                에디터에서 열기
              </button>
            </div>
          </div>

          {/* 정보 패널 */}
          <div className="space-y-6">
            {/* 제목과 설명 */}
            <div
              className="bg-white rounded-xl shadow-lg p-6"
              style={{ border: '3px solid rgba(255, 182, 193, 0.8)' }}
            >
              <h1 className="text-2xl font-bold text-gray-800 mb-3">
                {sharedItem.title || galleryItem.name}
              </h1>

              {sharedItem.description && (
                <p className="text-gray-600 leading-relaxed mb-4">
                  {sharedItem.description}
                </p>
              )}

              {/* 프롬프트 */}
              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-pink-700 mb-2">AI 프롬프트</h3>
                <p className="text-gray-700 text-sm">
                  {galleryItem.prompt}
                </p>
              </div>
            </div>

            {/* 생성 정보 */}
            <div
              className="bg-white rounded-xl shadow-lg p-6"
              style={{ border: '3px solid rgba(255, 182, 193, 0.8)' }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">생성 정보</h3>
              <div className="space-y-3">
                {/* 모델 */}
                <div className="flex justify-between">
                  <span className="text-gray-600">AI 모델</span>
                  <span className="font-medium text-gray-800">
                    {galleryItem.model}
                  </span>
                </div>

                {/* 생성 일시 */}
                <div className="flex justify-between">
                  <span className="text-gray-600">생성 일시</span>
                  <span className="font-medium text-gray-800">
                    {new Date(galleryItem.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* 파일 크기 */}
                {galleryItem.fileSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">파일 크기</span>
                    <span className="font-medium text-gray-800">
                      {(galleryItem.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}

                {/* 공유 일시 */}
                <div className="flex justify-between">
                  <span className="text-gray-600">공유 일시</span>
                  <span className="font-medium text-gray-800">
                    {new Date(sharedItem.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* 만료 일시 */}
                {sharedItem.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      만료 일시
                    </span>
                    <span className="font-medium text-red-600">
                      {new Date(sharedItem.expiresAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA 패널 */}
            <div
              className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-xl shadow-lg p-6 text-white text-center"
              style={{ border: '3px solid rgba(255, 182, 193, 0.8)' }}
            >
              <h3 className="text-lg font-semibold mb-2">
                나만의 AI 이미지 만들기
              </h3>
              <p className="text-pink-100 mb-4">
                Pixel Editor AI로 놀라운 이미지를 생성해보세요!
              </p>
              <button
                onClick={handleGoToApp}
                className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
              >
                지금 시작하기
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t-2 border-pink-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            Powered by <span className="font-semibold text-pink-600">Pixel Editor AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
};