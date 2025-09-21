/**
 * 사용자 갤러리 컴포넌트
 * 전체 갤러리 관리 UI를 제공합니다.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useGallery } from '../../hooks/useGallery';
import { GalleryItem } from './GalleryItem';
import { VirtualGallery, ResponsiveVirtualGallery } from './VirtualGallery';
import type { GalleryItem as GalleryItemType } from '../../services/galleryService';

// ==================== 타입 정의 ====================

export interface UserGalleryProps {
  onImageSelect?: (item: GalleryItemType) => void;
  onShare?: (item: GalleryItemType) => void;
  onClose?: () => void;
  showSelectButton?: boolean;
  maxHeight?: string;
}

// ==================== 메인 컴포넌트 ====================

export const UserGallery: React.FC<UserGalleryProps> = ({
  onImageSelect,
  onShare,
  onClose,
  showSelectButton = false,
  maxHeight = 'max-h-[80vh]'
}) => {
  // Gallery 훅 사용
  const {
    items,
    loading,
    error,
    hasMore,
    usage,
    stats,
    deleteImage,
    duplicateImage,
    searchImages,
    filterByModel,
    setSortBy,
    clearFilters,
    loadMoreImages,
    clearError,
    exportGallery,
    clearGallery,
    formatFileSize
  } = useGallery();

  // 로컬 상태
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [sortField, setSortField] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [useVirtualization, setUseVirtualization] = useState(items.length > 100); // 100개 이상일 때 자동 활성화

  // ==================== 이펙트 ====================

  // 아이템 개수에 따른 가상화 자동 활성화
  React.useEffect(() => {
    setUseVirtualization(items.length > 100);
  }, [items.length]);

  // ==================== 이벤트 핸들러 ====================

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchImages(query);
    } else {
      await clearFilters();
    }
  }, [searchImages, clearFilters]);

  const handleModelFilter = useCallback(async (model: string) => {
    setSelectedModel(model);
    if (model) {
      await filterByModel(model);
    } else {
      await clearFilters();
    }
  }, [filterByModel, clearFilters]);

  const handleSort = useCallback(async (field: typeof sortField, order: typeof sortOrder) => {
    setSortField(field);
    setSortOrder(order);
    await setSortBy(field, order);
  }, [setSortBy]);

  const handleClearFilters = useCallback(async () => {
    setSearchQuery('');
    setSelectedModel('');
    setSortField('createdAt');
    setSortOrder('desc');
    await clearFilters();
  }, [clearFilters]);

  const handleExport = useCallback(async () => {
    try {
      const data = await exportGallery();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gallery-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportGallery]);

  const handleClearGallery = useCallback(async () => {
    if (window.confirm('정말로 모든 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await clearGallery();
        setSelectedItems(new Set());
      } catch (error) {
        console.error('Clear gallery failed:', error);
      }
    }
  }, [clearGallery]);

  // ==================== 계산된 값들 ====================

  const availableModels = useMemo(() => {
    return Object.keys(stats.models || {});
  }, [stats.models]);

  const usagePercentage = useMemo(() => {
    return usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  }, [usage]);

  const countPercentage = useMemo(() => {
    return usage.maxCount > 0 ? (usage.count / usage.maxCount) * 100 : 0;
  }, [usage]);

  // ==================== 렌더링 ====================

  return (
    <div className="bg-white/5 border-3 border-white/20 h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b-3 border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
            <Squares2X2Icon className="w-6 h-6" />
            내 갤러리
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 사용량 표시 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">저장공간</span>
              <span className="text-white font-mono">
                {formatFileSize(usage.used)} / {formatFileSize(usage.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 border-2 border-white/20">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">이미지 개수</span>
              <span className="text-white font-mono">
                {usage.count} / {usage.maxCount}
              </span>
            </div>
            <div className="w-full bg-gray-700 h-2 border-2 border-white/20">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300"
                style={{ width: `${Math.min(countPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-3">
          {/* 검색 바 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="이미지 이름, 프롬프트 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border-2 border-white/20 text-white placeholder-gray-400 font-mono focus:border-pink-300/50 focus:outline-none"
            />
          </div>

          {/* 도구 바 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* 레이아웃 토글 */}
              <div className="flex border-2 border-white/20">
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-2 transition-colors ${
                    layout === 'grid'
                      ? 'bg-pink-300/20 text-pink-300'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`p-2 transition-colors border-l-2 border-white/20 ${
                    layout === 'list'
                      ? 'bg-pink-300/20 text-pink-300'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              {/* 필터 토글 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border-2 border-white/20 transition-colors ${
                  showFilters
                    ? 'bg-purple-300/20 text-purple-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* 내보내기 */}
              <button
                onClick={handleExport}
                className="p-2 border-2 border-white/20 text-gray-400 hover:text-blue-300 transition-colors"
                title="갤러리 내보내기"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>

              {/* 전체 삭제 */}
              <button
                onClick={handleClearGallery}
                className="p-2 border-2 border-white/20 text-gray-400 hover:text-red-300 transition-colors"
                title="갤러리 비우기"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 확장 필터 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-black/20 border-2 border-white/10">
              {/* 모델 필터 */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">모델</label>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 text-white font-mono focus:border-pink-300/50 focus:outline-none"
                >
                  <option value="">모든 모델</option>
                  {availableModels.map(model => (
                    <option key={model} value={model} className="bg-gray-800">
                      {model} ({stats.models[model]})
                    </option>
                  ))}
                </select>
              </div>

              {/* 정렬 */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">정렬</label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => handleSort(e.target.value as typeof sortField, sortOrder)}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-white/20 text-white font-mono focus:border-pink-300/50 focus:outline-none"
                  >
                    <option value="createdAt" className="bg-gray-800">날짜</option>
                    <option value="name" className="bg-gray-800">이름</option>
                    <option value="size" className="bg-gray-800">크기</option>
                  </select>
                  <button
                    onClick={() => handleSort(sortField, sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border-2 border-white/20 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowsUpDownIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 필터 초기화 */}
              <div className="md:col-span-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-red-500/20 border-2 border-red-300/30 text-red-300 hover:bg-red-500/30 transition-colors font-mono"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/20 border-2 border-red-300/30 text-red-300 flex justify-between items-center">
          <span className="font-mono">{error}</span>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 이미지 그리드/리스트 */}
      <div className={`flex-1 overflow-auto p-4 ${maxHeight}`}>
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-pink-300/30 border-t-pink-300 animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Squares2X2Icon className="w-12 h-12 mb-2" />
            <p className="font-mono">갤러리가 비어있습니다</p>
            <p className="text-sm">이미지를 생성하면 자동으로 저장됩니다</p>
          </div>
        ) : (
          <>
            {layout === 'grid' && useVirtualization ? (
              // 가상화된 그리드 (100개 이상 아이템)
              <div className="h-96">
                <ResponsiveVirtualGallery
                  items={items}
                  size="md"
                  onDelete={deleteImage}
                  onDuplicate={duplicateImage}
                  onShare={onShare}
                  onLoad={onImageSelect}
                  showActions={true}
                />
              </div>
            ) : (
              // 일반 그리드/리스트
              <div
                className={
                  layout === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-3'
                }
              >
                {items.map((item) => (
                  <GalleryItem
                    key={item.id}
                    item={item}
                    layout={layout}
                    onDelete={deleteImage}
                    onDuplicate={duplicateImage}
                    onShare={onShare}
                    onLoad={onImageSelect}
                    showActions={true}
                  />
                ))}
              </div>
            )}

            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreImages}
                  disabled={loading}
                  className="px-6 py-3 bg-pink-300/20 border-2 border-pink-300/30 text-pink-300 hover:bg-pink-300/30 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-pink-300/30 border-t-pink-300 animate-spin"></div>
                      로딩중...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      더 보기
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 통계 푸터 */}
      <div className="p-3 border-t-3 border-white/20 bg-black/20">
        <div className="flex justify-between items-center text-sm text-gray-400 font-mono">
          <span>총 {stats.totalItems}개 이미지</span>
          <span>전체 크기: {formatFileSize(stats.totalSize)}</span>
        </div>
      </div>
    </div>
  );
};

export default UserGallery;