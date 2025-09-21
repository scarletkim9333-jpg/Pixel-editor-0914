/**
 * 갤러리 아이템 컴포넌트
 * 개별 이미지를 표시하고 액션 버튼을 제공합니다.
 */

import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  EyeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import type { GalleryItem } from '../../services/galleryService';
import { formatFileSize, formatRelativeTime, formatModelName } from '../../services/galleryService';
import { LazyImage } from './LazyImage';

// ==================== 타입 정의 ====================

export interface GalleryItemProps {
  item: GalleryItem;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (item: GalleryItem) => void;
  onLoad?: (item: GalleryItem) => void;
  onView?: (item: GalleryItem) => void;
  layout?: 'grid' | 'list';
  showActions?: boolean;
}

// ==================== 메인 컴포넌트 ====================

export const GalleryItem: React.FC<GalleryItemProps> = ({
  item,
  onDelete,
  onDuplicate,
  onShare,
  onLoad,
  onView,
  layout = 'grid',
  showActions = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 이미지 다운로드
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `${item.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 액션 버튼들
  const actionButtons = [
    {
      icon: EyeIcon,
      label: '자세히 보기',
      onClick: () => onView?.(item),
      color: 'text-blue-400 hover:text-blue-300'
    },
    {
      icon: PhotoIcon,
      label: '에디터로 불러오기',
      onClick: () => onLoad?.(item),
      color: 'text-green-400 hover:text-green-300'
    },
    {
      icon: ArrowDownTrayIcon,
      label: '다운로드',
      onClick: handleDownload,
      color: 'text-indigo-400 hover:text-indigo-300'
    },
    {
      icon: DocumentDuplicateIcon,
      label: '복제',
      onClick: () => onDuplicate?.(item.id),
      color: 'text-yellow-400 hover:text-yellow-300'
    },
    {
      icon: ShareIcon,
      label: '공유',
      onClick: () => onShare?.(item),
      color: 'text-purple-400 hover:text-purple-300'
    },
    {
      icon: TrashIcon,
      label: '삭제',
      onClick: () => onDelete?.(item.id),
      color: 'text-red-400 hover:text-red-300'
    }
  ];

  // Grid 레이아웃
  if (layout === 'grid') {
    return (
      <div
        className="relative bg-white/5 border-3 border-white/20 group hover:border-pink-300/50 transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 이미지 섹션 */}
        <div className="relative aspect-square overflow-hidden">
          <LazyImage
            src={item.thumbnailUrl || item.imageUrl}
            alt={item.name}
            width={200}
            height={200}
            className="w-full h-full"
            objectFit="cover"
            fallbackSrc={undefined}
          />

          {/* 호버 오버레이 */}
          {isHovered && showActions && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex gap-2 p-4 flex-wrap justify-center">
                {actionButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={button.onClick}
                    className={`p-2 bg-white/10 border-2 border-white/20 hover:border-white/40 transition-all ${button.color}`}
                    title={button.label}
                  >
                    <button.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 모델 뱃지 */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 border-2 border-white/20 text-xs font-mono text-white">
            {formatModelName(item.model)}
          </div>

          {/* 파일 크기 */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 border-2 border-white/20 text-xs font-mono text-white">
            {formatFileSize(item.size)}
          </div>
        </div>

        {/* 정보 섹션 */}
        <div className="p-3 space-y-2">
          <h3 className="font-mono font-bold text-white truncate" title={item.name}>
            {item.name}
          </h3>

          <p className="text-sm text-gray-300 line-clamp-2" title={item.prompt}>
            {item.prompt}
          </p>

          <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
            <span>{formatRelativeTime(item.createdAt)}</span>
            {item.expiresAt && (
              <span className="text-yellow-400">
                만료: {formatRelativeTime(item.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List 레이아웃
  return (
    <div
      className="flex bg-white/5 border-3 border-white/20 hover:border-pink-300/50 transition-all duration-200 p-3 gap-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 썸네일 */}
      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 border-white/20">
        <LazyImage
          src={item.thumbnailUrl || item.imageUrl}
          alt={item.name}
          width={80}
          height={80}
          className="w-full h-full"
          objectFit="cover"
          fallbackSrc={undefined}
        />
      </div>

      {/* 정보 섹션 */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-mono font-bold text-white truncate" title={item.name}>
            {item.name}
          </h3>
          <div className="flex gap-1 ml-2">
            <span className="px-2 py-1 bg-black/50 border-2 border-white/20 text-xs font-mono text-white">
              {formatModelName(item.model)}
            </span>
            <span className="px-2 py-1 bg-black/50 border-2 border-white/20 text-xs font-mono text-white">
              {formatFileSize(item.size)}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-2 line-clamp-2" title={item.prompt}>
          {item.prompt}
        </p>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400 font-mono">
            <span>{formatRelativeTime(item.createdAt)}</span>
            {item.expiresAt && (
              <span className="ml-4 text-yellow-400">
                만료: {formatRelativeTime(item.expiresAt)}
              </span>
            )}
          </div>

          {/* 액션 버튼들 */}
          {showActions && (
            <div className="flex gap-1">
              {actionButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`p-1.5 bg-white/10 border-2 border-white/20 hover:border-white/40 transition-all ${button.color}`}
                  title={button.label}
                >
                  <button.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryItem;