/**
 * 공유 관련 커스텀 훅
 * Session 6: 공유 기능 구현
 */

import { useState, useEffect, useCallback } from 'react';
import { shareService } from '../services/shareService';
import type { SharedItem, ShareSettings, ShareStats, SocialShareUrls } from '../services/shareService';

// ==================== 타입 정의 ====================

export interface UseShareReturn {
  // 상태
  isLoading: boolean;
  error: string | null;
  userShares: SharedItem[];
  stats: ShareStats;

  // 액션
  createShare: (itemId: string, settings?: ShareSettings) => Promise<{ shareCode: string; shareUrl: string } | null>;
  updateShare: (shareCode: string, settings: ShareSettings) => Promise<boolean>;
  deleteShare: (shareCode: string) => Promise<boolean>;
  refreshShares: () => Promise<void>;
  generateSocialUrls: (shareCode: string, title?: string, description?: string) => SocialShareUrls;
  copyToClipboard: (text: string) => Promise<boolean>;
}

export interface UseSharedItemReturn {
  // 상태
  sharedItem: SharedItem | null;
  galleryItem: any | null; // GalleryItem 타입
  isLoading: boolean;
  error: string | null;
  isFound: boolean;

  // 액션
  loadSharedItem: (shareCode: string) => Promise<void>;
}

// ==================== 메인 공유 훅 ====================

export const useShare = (): UseShareReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userShares, setUserShares] = useState<SharedItem[]>([]);
  const [stats, setStats] = useState<ShareStats>({
    totalShares: 0,
    totalViews: 0,
    activeShares: 0,
    expiredShares: 0
  });

  // 공유 링크 생성
  const createShare = useCallback(async (
    itemId: string,
    settings: ShareSettings = {}
  ): Promise<{ shareCode: string; shareUrl: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await shareService.createShareLink(itemId, settings);
      if (result) {
        await refreshShares(); // 목록 새로고침
        return result;
      }
      throw new Error('공유 링크 생성에 실패했습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 공유 설정 업데이트
  const updateShare = useCallback(async (
    shareCode: string,
    settings: ShareSettings
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await shareService.updateShareSettings(shareCode, settings);
      if (success) {
        await refreshShares(); // 목록 새로고침
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '공유 설정 업데이트에 실패했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 공유 링크 삭제
  const deleteShare = useCallback(async (shareCode: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await shareService.deleteShareLink(shareCode);
      if (success) {
        await refreshShares(); // 목록 새로고침
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '공유 링크 삭제에 실패했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 공유 목록 새로고침
  const refreshShares = useCallback(async (): Promise<void> => {
    try {
      const [shares, shareStats] = await Promise.all([
        shareService.getUserShares(),
        shareService.getShareStats()
      ]);

      setUserShares(shares);
      setStats(shareStats);
    } catch (err) {
      console.error('공유 목록 새로고침 실패:', err);
      setError('공유 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  // 소셜 공유 URL 생성
  const generateSocialUrls = useCallback((
    shareCode: string,
    title?: string,
    description?: string
  ): SocialShareUrls => {
    return shareService.generateSocialShareUrls(shareCode, title, description);
  }, []);

  // 클립보드 복사
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // 폴백: 임시 텍스트 엘리먼트 사용
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      return false;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshShares();
  }, [refreshShares]);

  return {
    isLoading,
    error,
    userShares,
    stats,
    createShare,
    updateShare,
    deleteShare,
    refreshShares,
    generateSocialUrls,
    copyToClipboard
  };
};

// ==================== 공유된 아이템 조회 훅 ====================

export const useSharedItem = (): UseSharedItemReturn => {
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
  const [galleryItem, setGalleryItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFound, setIsFound] = useState(false);

  const loadSharedItem = useCallback(async (shareCode: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsFound(false);

    try {
      const result = await shareService.getSharedItem(shareCode);

      if (result) {
        setSharedItem(result.sharedItem);
        setGalleryItem(result.galleryItem);
        setIsFound(true);
      } else {
        setSharedItem(null);
        setGalleryItem(null);
        setIsFound(false);
        setError('공유된 이미지를 찾을 수 없습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '공유된 이미지를 불러오는데 실패했습니다.';
      setError(errorMessage);
      setSharedItem(null);
      setGalleryItem(null);
      setIsFound(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sharedItem,
    galleryItem,
    isLoading,
    error,
    isFound,
    loadSharedItem
  };
};

// ==================== 공유 통계 전용 훅 ====================

export const useShareStats = () => {
  const [stats, setStats] = useState<ShareStats>({
    totalShares: 0,
    totalViews: 0,
    activeShares: 0,
    expiredShares: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStats = await shareService.getShareStats();
      setStats(newStats);
    } catch (error) {
      console.error('공유 통계 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats
  };
};

// ==================== 공유 링크 유효성 검사 훅 ====================

export const useShareValidation = () => {
  const validateShareCode = useCallback((shareCode: string): boolean => {
    // 6자리 영숫자 검증
    const regex = /^[a-z0-9]{6}$/;
    return regex.test(shareCode);
  }, []);

  const validateShareSettings = useCallback((settings: ShareSettings): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (settings.title && settings.title.length > 100) {
      errors.push('제목은 100자 이하여야 합니다.');
    }

    if (settings.description && settings.description.length > 500) {
      errors.push('설명은 500자 이하여야 합니다.');
    }

    if (settings.expiresIn !== undefined && settings.expiresIn < 0) {
      errors.push('만료 시간은 0 이상이어야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    validateShareCode,
    validateShareSettings
  };
};