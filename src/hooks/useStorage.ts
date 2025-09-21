/**
 * useStorage Hook
 * 저장소 시스템을 React 컴포넌트에서 쉽게 사용할 수 있도록 하는 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { storageService, StorageItem, ListOptions, StorageUsage } from '../services/storageService';
// import { useAuth } from '../../contexts/AuthContext';

// Mock useAuth for development
const useAuth = () => ({
  user: null,
  session: null,
  loading: false
});
import { STORAGE_TIERS } from '../config/storage.config';

interface UseStorageOptions {
  autoRefresh?: boolean;      // 자동 새로고침 여부
  refreshInterval?: number;   // 새로고침 간격 (ms)
  tier?: keyof typeof STORAGE_TIERS;  // 강제 티어 설정
}

interface UseStorageReturn {
  // 상태
  items: StorageItem[];
  loading: boolean;
  error: string | null;
  usage: StorageUsage | null;
  currentTier: keyof typeof STORAGE_TIERS;

  // 작업 함수
  save: (item: Omit<StorageItem, 'id' | 'createdAt'>) => Promise<string | null>;
  load: (id: string) => Promise<StorageItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearAll: () => Promise<boolean>;

  // 유틸리티
  canSave: boolean;
  remainingSpace: number;
  remainingItems: number;
}

export const useStorage = (options: UseStorageOptions = {}): UseStorageReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30초
    tier
  } = options;

  const { user } = useAuth();

  // 상태 관리
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [currentTier, setCurrentTier] = useState<keyof typeof STORAGE_TIERS>('temporary');

  // 티어 결정 로직
  useEffect(() => {
    const determineTier = async () => {
      if (tier) {
        // 강제 티어 설정이 있는 경우
        setCurrentTier(tier);
        await storageService.switchTier(tier);
      } else {
        // 사용자 상태에 따른 자동 티어 결정
        const newTier = user ? 'registered' : 'temporary';
        if (currentTier !== newTier) {
          setCurrentTier(newTier);
          await storageService.switchTier(newTier);
          await refresh(); // 티어 변경 후 데이터 새로고침
        }
      }
    };

    determineTier();
  }, [user, tier]);

  // 유틸리티 계산
  const canSave = usage ? usage.count < usage.maxCount : true; // 기본값을 true로 변경
  const remainingSpace = usage ? usage.limit - usage.used : 0;
  const remainingItems = usage ? usage.maxCount - usage.count : 0;

  // 아이템 목록 조회
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [itemsList, usageData] = await Promise.all([
        storageService.list({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
        storageService.getUsage()
      ]);

      setItems(itemsList);
      setUsage(usageData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.';
      setError(errorMessage);
      console.error('Storage refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 아이템 저장
  const save = useCallback(async (
    item: Omit<StorageItem, 'id' | 'createdAt'>
  ): Promise<string | null> => {
    setError(null);

    try {
      // 디버깅 로그
      console.log('Save attempt:', {
        canSave,
        usage,
        currentTier,
        itemSize: item.size
      });

      // 용량 체크 (일단 주석처리해서 직접 storageService에서 체크하도록)
      // if (!canSave) {
      //   throw new Error('저장 공간이 부족합니다.');
      // }

      const id = await storageService.save(item);

      // 저장 후 목록 새로고침
      await refresh();

      // 성공 알림을 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('storageItemSaved', {
        detail: { id, name: item.name }
      }));

      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '저장에 실패했습니다.';
      setError(errorMessage);
      console.error('Storage save error:', err);
      return null;
    }
  }, [refresh, canSave, usage, currentTier]);

  // 아이템 로드
  const load = useCallback(async (id: string): Promise<StorageItem | null> => {
    setError(null);

    try {
      return await storageService.load(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '불러오기에 실패했습니다.';
      setError(errorMessage);
      console.error('Storage load error:', err);
      return null;
    }
  }, []);

  // 아이템 삭제
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      await storageService.delete(id);

      // 삭제 후 목록 새로고침
      await refresh();

      // 성공 알림을 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('storageItemDeleted', {
        detail: { id }
      }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('Storage delete error:', err);
      return false;
    }
  }, [refresh]);

  // 전체 삭제
  const clearAll = useCallback(async (): Promise<boolean> => {
    setError(null);

    if (!confirm('모든 저장된 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return false;
    }

    try {
      // 모든 아이템 개별 삭제 (clear 메서드가 없는 어댑터를 위해)
      const deletePromises = items.map(item => storageService.delete(item.id));
      await Promise.all(deletePromises);

      // 또는 clear 메서드가 있는 경우 사용
      if (storageService.clear) {
        await storageService.clear();
      }

      // 상태 초기화
      setItems([]);
      setUsage({
        used: 0,
        limit: STORAGE_TIERS[currentTier].maxFileSize * STORAGE_TIERS[currentTier].limit,
        count: 0,
        maxCount: STORAGE_TIERS[currentTier].limit
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '전체 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('Storage clear error:', err);
      return false;
    }
  }, [items, currentTier]);

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    refresh();

    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefresh, refreshInterval]);

  // 스토리지 이벤트 리스너 (다른 탭에서의 변경 감지)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pixel-editor-gallery') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  return {
    // 상태
    items,
    loading,
    error,
    usage,
    currentTier,

    // 작업 함수
    save,
    load,
    deleteItem,
    refresh,
    clearAll,

    // 유틸리티
    canSave,
    remainingSpace,
    remainingItems
  };
};

// 특정 아이템만 관리하는 훅
export const useStorageItem = (itemId: string | null) => {
  const [item, setItem] = useState<StorageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (!itemId) {
      setItem(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedItem = await storageService.load(itemId);
      setItem(loadedItem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '아이템을 불러올 수 없습니다.';
      setError(errorMessage);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  return { item, loading, error, reload: loadItem };
};

// 스토리지 검색 훅
export const useStorageSearch = (searchTerm: string, debounceMs: number = 300) => {
  const [results, setResults] = useState<StorageItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await storageService.list({
          search: searchTerm,
          limit: 20
        });
        setResults(items);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debounceMs]);

  return { results, searching };
};

export default useStorage;
