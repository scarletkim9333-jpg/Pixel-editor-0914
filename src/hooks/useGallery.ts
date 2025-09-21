/**
 * 갤러리 관리 React 훅
 * 갤러리 데이터와 상태를 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { galleryService, formatFileSize, formatRelativeTime, formatModelName } from '../services/galleryService';
import type { GalleryItem, GalleryListOptions, GalleryStats } from '../services/galleryService';
import type { StorageUsage } from '../services/storageService';

// ==================== 타입 정의 ====================

export interface UseGalleryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialLimit?: number;
}

export interface GalleryState {
  items: GalleryItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
}

export interface GalleryActions {
  refreshGallery: () => Promise<void>;
  saveImage: (name: string, imageUrl: string, prompt: string, model: string, settings: any, thumbnailUrl?: string) => Promise<string>;
  deleteImage: (id: string) => Promise<void>;
  loadMoreImages: () => Promise<void>;
  searchImages: (query: string) => Promise<void>;
  filterByModel: (model: string) => Promise<void>;
  duplicateImage: (id: string) => Promise<string>;
  clearGallery: () => Promise<void>;
  exportGallery: () => Promise<string>;
}

// ==================== 메인 훅 ====================

export function useGallery(options: UseGalleryOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30초
    initialLimit = 20
  } = options;

  // 상태 관리
  const [state, setState] = useState<GalleryState>({
    items: [],
    loading: false,
    error: null,
    hasMore: true,
    total: 0
  });

  const [usage, setUsage] = useState<StorageUsage>({
    used: 0,
    limit: 0,
    count: 0,
    maxCount: 0
  });

  const [stats, setStats] = useState<GalleryStats>({
    totalItems: 0,
    totalSize: 0,
    models: {},
    dateRange: { oldest: null, newest: null }
  });

  // 현재 필터/검색 상태
  const [currentOptions, setCurrentOptions] = useState<GalleryListOptions>({
    limit: initialLimit,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // ==================== 갤러리 데이터 로드 ====================

  const loadGalleryData = useCallback(async (options: GalleryListOptions = currentOptions, append: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [items, newUsage, newStats] = await Promise.all([
        galleryService.listImages(options),
        galleryService.getUsage(),
        galleryService.getStats()
      ]);

      setState(prev => ({
        ...prev,
        items: append ? [...prev.items, ...items] : items,
        loading: false,
        hasMore: items.length === (options.limit || initialLimit),
        total: newStats.totalItems
      }));

      setUsage(newUsage);
      setStats(newStats);
      setCurrentOptions(options);

    } catch (error) {
      console.error('갤러리 로드 실패:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '갤러리를 불러오는데 실패했습니다.'
      }));
    }
  }, [currentOptions, initialLimit]);

  // ==================== 액션 함수들 ====================

  const refreshGallery = useCallback(async () => {
    await loadGalleryData({ ...currentOptions, offset: 0 }, false);
  }, [loadGalleryData, currentOptions]);

  const saveImage = useCallback(async (
    name: string,
    imageUrl: string,
    prompt: string,
    model: string,
    settings: any,
    thumbnailUrl?: string
  ): Promise<string> => {
    try {
      const id = await galleryService.saveImage(name, imageUrl, prompt, model, settings, thumbnailUrl);

      // 저장 후 갤러리 새로고침
      await refreshGallery();

      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이미지 저장에 실패했습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [refreshGallery]);

  const deleteImage = useCallback(async (id: string) => {
    try {
      await galleryService.deleteImage(id);

      // 삭제 후 갤러리 새로고침
      await refreshGallery();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이미지 삭제에 실패했습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [refreshGallery]);

  const loadMoreImages = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    const nextOptions = {
      ...currentOptions,
      offset: state.items.length
    };

    await loadGalleryData(nextOptions, true);
  }, [state.loading, state.hasMore, state.items.length, currentOptions, loadGalleryData]);

  const searchImages = useCallback(async (query: string) => {
    const searchOptions = {
      ...currentOptions,
      search: query,
      offset: 0
    };

    await loadGalleryData(searchOptions, false);
  }, [currentOptions, loadGalleryData]);

  const filterByModel = useCallback(async (model: string) => {
    const filterOptions = {
      ...currentOptions,
      modelFilter: model,
      offset: 0
    };

    await loadGalleryData(filterOptions, false);
  }, [currentOptions, loadGalleryData]);

  const duplicateImage = useCallback(async (id: string): Promise<string> => {
    try {
      const newId = await galleryService.duplicateImage(id);

      // 복제 후 갤러리 새로고침
      await refreshGallery();

      return newId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이미지 복제에 실패했습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [refreshGallery]);

  const clearGallery = useCallback(async () => {
    try {
      await galleryService.clearGallery();

      // 삭제 후 상태 초기화
      setState({
        items: [],
        loading: false,
        error: null,
        hasMore: false,
        total: 0
      });

      setUsage({ used: 0, limit: 0, count: 0, maxCount: 0 });
      setStats({
        totalItems: 0,
        totalSize: 0,
        models: {},
        dateRange: { oldest: null, newest: null }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '갤러리 삭제에 실패했습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const exportGallery = useCallback(async (): Promise<string> => {
    try {
      return await galleryService.exportGallery();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '갤러리 내보내기에 실패했습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // ==================== 정렬/필터 변경 ====================

  const setSortBy = useCallback(async (sortBy: 'createdAt' | 'name' | 'size', sortOrder: 'asc' | 'desc' = 'desc') => {
    const newOptions = {
      ...currentOptions,
      sortBy,
      sortOrder,
      offset: 0
    };

    await loadGalleryData(newOptions, false);
  }, [currentOptions, loadGalleryData]);

  const clearFilters = useCallback(async () => {
    const resetOptions = {
      limit: initialLimit,
      offset: 0,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const
    };

    await loadGalleryData(resetOptions, false);
  }, [initialLimit, loadGalleryData]);

  // ==================== 에러 상태 관리 ====================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ==================== 자동 새로고침 ====================

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshGallery, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshGallery]);

  // ==================== 초기 로드 ====================

  useEffect(() => {
    loadGalleryData();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // ==================== 커스텀 이벤트 리스너 ====================

  useEffect(() => {
    const handleStorageChange = () => {
      refreshGallery();
    };

    window.addEventListener('storageChanged', handleStorageChange);
    return () => window.removeEventListener('storageChanged', handleStorageChange);
  }, [refreshGallery]);

  // ==================== 반환값 ====================

  const actions: GalleryActions = {
    refreshGallery,
    saveImage,
    deleteImage,
    loadMoreImages,
    searchImages,
    filterByModel,
    duplicateImage,
    clearGallery,
    exportGallery
  };

  return {
    // 상태
    ...state,
    usage,
    stats,
    currentOptions,

    // 액션
    ...actions,
    setSortBy,
    clearFilters,
    clearError,

    // 유틸리티
    formatFileSize,
    formatRelativeTime,
    formatModelName,

    // 저장소 정보
    currentTier: galleryService.getCurrentTier(),
    canSave: galleryService.canSave
  };
}

// ==================== 특화된 훅들 ====================

/**
 * 최근 이미지만 조회하는 훅
 */
export function useRecentImages(count: number = 5) {
  const [recentImages, setRecentImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentImages = useCallback(async () => {
    setLoading(true);
    try {
      const images = await galleryService.getRecentImages(count);
      setRecentImages(images);
    } catch (error) {
      console.error('최근 이미지 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    loadRecentImages();
  }, [loadRecentImages]);

  return { recentImages, loading, refresh: loadRecentImages };
}

/**
 * 갤러리 통계만 조회하는 훅
 */
export function useGalleryStats() {
  const [stats, setStats] = useState<GalleryStats>({
    totalItems: 0,
    totalSize: 0,
    models: {},
    dateRange: { oldest: null, newest: null }
  });
  const [usage, setUsage] = useState<StorageUsage>({
    used: 0,
    limit: 0,
    count: 0,
    maxCount: 0
  });
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usageData] = await Promise.all([
        galleryService.getStats(),
        galleryService.getUsage()
      ]);
      setStats(statsData);
      setUsage(usageData);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, usage, loading, refresh: loadStats };
}