/**
 * 갤러리 모달 컴포넌트
 * 모달 형태로 갤러리를 표시합니다.
 */

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UserGallery } from './UserGallery';
import { ShareModal } from './ShareModal';
import type { GalleryItem } from '../../services/galleryService';

// ==================== 타입 정의 ====================

export interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect?: (item: GalleryItem) => void;
  title?: string;
  showSelectButton?: boolean;
}

// ==================== 메인 컴포넌트 ====================

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  onImageSelect,
  title = "내 갤러리",
  showSelectButton = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedItemForShare, setSelectedItemForShare] = useState<GalleryItem | null>(null);

  // ==================== 이벤트 핸들러 ====================

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // 모달이 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // 모달이 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 모달 외부 클릭시 닫기
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (item: GalleryItem) => {
    if (onImageSelect) {
      onImageSelect(item);
      onClose();
    }
  };

  // 공유 핸들러
  const handleShare = (item: GalleryItem) => {
    setSelectedItemForShare(item);
    setShareModalOpen(true);
  };

  // 공유 모달 닫기
  const handleShareModalClose = () => {
    setShareModalOpen(false);
    setSelectedItemForShare(null);
  };

  // ==================== 렌더링 ====================

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-6xl max-h-[90vh] m-4 bg-gray-900/95 border-3 border-white/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b-3 border-white/20 bg-black/20">
          <h2 className="text-xl font-mono font-bold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors border-2 border-white/20 hover:border-white/40"
            aria-label="갤러리 닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 갤러리 컨텐츠 */}
        <div className="h-[calc(90vh-80px)]">
          <UserGallery
            onImageSelect={handleImageSelect}
            onShare={handleShare}
            showSelectButton={showSelectButton}
            maxHeight="h-full"
          />
        </div>
      </div>

      {/* 공유 모달 */}
      {selectedItemForShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleShareModalClose}
          galleryItem={selectedItemForShare}
        />
      )}
    </div>
  );
};

// ==================== 이미지 세부 정보 모달 ====================

export interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
  onLoad?: (item: GalleryItem) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onLoad,
  onDelete,
  onDuplicate,
  onShare
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // ==================== 이벤트 핸들러 ====================

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    if (!item) return;

    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `${item.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareClick = () => {
    setShareModalOpen(true);
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
  };

  // ==================== 렌더링 ====================

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-gray-900/95 border-3 border-white/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b-3 border-white/20 bg-black/20">
          <h2 className="text-xl font-mono font-bold text-white truncate">
            {item.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors border-2 border-white/20 hover:border-white/40"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* 이미지 섹션 */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black/10">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="max-w-full max-h-full object-contain border-2 border-white/20"
            />
          </div>

          {/* 정보 섹션 */}
          <div className="w-full lg:w-80 p-4 border-l-3 border-white/20 bg-black/20 overflow-y-auto">
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-mono font-bold text-white mb-2">정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">모델:</span>
                    <span className="text-white font-mono">{item.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">크기:</span>
                    <span className="text-white font-mono">{(item.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">생성일:</span>
                    <span className="text-white font-mono">
                      {item.createdAt.toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {item.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">만료일:</span>
                      <span className="text-yellow-400 font-mono">
                        {item.expiresAt.toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 프롬프트 */}
              <div>
                <h3 className="text-lg font-mono font-bold text-white mb-2">프롬프트</h3>
                <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-3 border-2 border-white/10">
                  {item.prompt}
                </p>
              </div>

              {/* 설정 */}
              {item.settings && Object.keys(item.settings).length > 0 && (
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-2">설정</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(item.settings).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{key}:</span>
                        <span className="text-white font-mono">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="space-y-2 pt-4 border-t-2 border-white/20">
                {onLoad && (
                  <button
                    onClick={() => onLoad(item)}
                    className="w-full px-4 py-2 bg-green-500/20 border-2 border-green-300/30 text-green-300 hover:bg-green-500/30 transition-colors font-mono"
                  >
                    에디터로 불러오기
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 bg-blue-500/20 border-2 border-blue-300/30 text-blue-300 hover:bg-blue-500/30 transition-colors font-mono"
                >
                  다운로드
                </button>

                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(item.id)}
                    className="w-full px-4 py-2 bg-yellow-500/20 border-2 border-yellow-300/30 text-yellow-300 hover:bg-yellow-500/30 transition-colors font-mono"
                  >
                    복제
                  </button>
                )}

                <button
                  onClick={handleShareClick}
                  className="w-full px-4 py-2 bg-purple-500/20 border-2 border-purple-300/30 text-purple-300 hover:bg-purple-500/30 transition-colors font-mono"
                >
                  공유
                </button>

                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 이미지를 삭제하시겠습니까?')) {
                        onDelete(item.id);
                        onClose();
                      }
                    }}
                    className="w-full px-4 py-2 bg-red-500/20 border-2 border-red-300/30 text-red-300 hover:bg-red-500/30 transition-colors font-mono"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={handleShareModalClose}
        galleryItem={item}
      />
    </div>
  );
};

export default GalleryModal;