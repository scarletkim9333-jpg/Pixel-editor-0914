/**
 * Storage Utilities
 * 저장소 관련 유틸리티 함수들
 */

import { StorageItem, StorageUsage } from '../services/storageService';
import { STORAGE_CONFIG } from '../config/storage.config';

// ==================== 파일 크기 관련 ====================

/**
 * 바이트 단위를 사람이 읽기 쉬운 형태로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 사용량을 퍼센트로 계산
 */
export const calculateUsagePercentage = (usage: StorageUsage): number => {
  if (usage.limit === 0) return 0;
  return Math.round((usage.used / usage.limit) * 100);
};

/**
 * 남은 공간을 계산
 */
export const calculateRemainingSpace = (usage: StorageUsage): number => {
  return Math.max(0, usage.limit - usage.used);
};

/**
 * 남은 아이템 수를 계산
 */
export const calculateRemainingItems = (usage: StorageUsage): number => {
  return Math.max(0, usage.maxCount - usage.count);
};

// ==================== 날짜 및 시간 관련 ====================

/**
 * 만료 시간을 계산
 */
export const calculateExpiryDate = (retentionDays: number): Date => {
  const now = new Date();
  return new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
};

/**
 * 만료까지 남은 시간을 문자열로 반환
 */
export const getTimeUntilExpiry = (expiresAt: Date): string => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return '만료됨';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
};

/**
 * 날짜를 상대적 시간으로 포맷
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
};

/**
 * 절대 날짜로 포맷
 */
export const formatAbsoluteDate = (date: Date): string => {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ==================== 이미지 관련 ====================

/**
 * 이미지에서 메타데이터 추출
 */
export const extractImageMetadata = async (imageUrl: string): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      // 포맷 감지 (Data URL에서)
      let format = 'unknown';
      if (imageUrl.startsWith('data:image/')) {
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        format = mimeType.split('/')[1];
      }

      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        format
      });
    };
    img.onerror = () => reject(new Error('이미지 메타데이터를 추출할 수 없습니다'));
    img.src = imageUrl;
  });
};

/**
 * Data URL을 Blob으로 변환
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Blob을 Data URL로 변환
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 이미지 URL에서 파일 크기 추정
 */
export const estimateImageSize = async (imageUrl: string): Promise<number> => {
  try {
    if (imageUrl.startsWith('data:')) {
      // Data URL의 경우 대략적 크기 계산
      const base64 = imageUrl.split(',')[1];
      const padding = (base64.match(/=/g) || []).length;
      return Math.floor((base64.length * 3) / 4) - padding;
    } else {
      // HTTP URL의 경우 HEAD 요청으로 크기 확인
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength) : 0;
    }
  } catch {
    return 0;
  }
};

// ==================== 검색 및 필터링 ====================

/**
 * 저장 아이템을 검색
 */
export const searchStorageItems = (
  items: StorageItem[],
  searchTerm: string
): StorageItem[] => {
  if (!searchTerm) return items;

  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.prompt.toLowerCase().includes(term) ||
    item.model.toLowerCase().includes(term)
  );
};

/**
 * 저장 아이템을 모델별로 그룹화
 */
export const groupItemsByModel = (items: StorageItem[]): Record<string, StorageItem[]> => {
  return items.reduce((groups, item) => {
    const model = item.model || 'Unknown';
    if (!groups[model]) {
      groups[model] = [];
    }
    groups[model].push(item);
    return groups;
  }, {} as Record<string, StorageItem[]>);
};

/**
 * 저장 아이템을 날짜별로 그룹화
 */
export const groupItemsByDate = (items: StorageItem[]): Record<string, StorageItem[]> => {
  return items.reduce((groups, item) => {
    const date = item.createdAt.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, StorageItem[]>);
};

/**
 * 저장 아이템 정렬
 */
export const sortStorageItems = (
  items: StorageItem[],
  sortBy: 'name' | 'createdAt' | 'size' | 'model',
  order: 'asc' | 'desc' = 'desc'
): StorageItem[] => {
  return [...items].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        compareValue = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'size':
        compareValue = a.size - b.size;
        break;
      case 'model':
        compareValue = a.model.localeCompare(b.model);
        break;
    }

    return order === 'asc' ? compareValue : -compareValue;
  });
};

// ==================== 자동 정리 관련 ====================

/**
 * 만료된 아이템을 찾음
 */
export const findExpiredItems = (items: StorageItem[]): StorageItem[] => {
  const now = new Date();
  return items.filter(item =>
    item.expiresAt && item.expiresAt < now
  );
};

/**
 * 오래된 아이템을 찾음 (만료 시간이 없는 경우)
 */
export const findOldItems = (
  items: StorageItem[],
  maxAge: number // days
): StorageItem[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAge);

  return items.filter(item => item.createdAt < cutoffDate);
};

/**
 * 정리가 필요한 아이템 수를 계산
 */
export const calculateCleanupCount = (
  items: StorageItem[],
  maxItems: number
): number => {
  if (items.length <= maxItems) return 0;
  return items.length - maxItems;
};

// ==================== 백업 및 복원 ====================

/**
 * 저장소 데이터를 JSON으로 내보내기
 */
export const exportStorageData = (items: StorageItem[]): string => {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    items: items.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      expiresAt: item.expiresAt?.toISOString()
    }))
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * JSON에서 저장소 데이터 가져오기
 */
export const importStorageData = (jsonData: string): StorageItem[] => {
  try {
    const data = JSON.parse(jsonData);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('잘못된 백업 파일 형식입니다.');
    }

    return data.items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
    }));
  } catch (error) {
    throw new Error('백업 파일을 읽을 수 없습니다: ' + (error as Error).message);
  }
};

// ==================== 검증 관련 ====================

/**
 * 저장 아이템 유효성 검사
 */
export const validateStorageItem = (item: Partial<StorageItem>): string[] => {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push('이름이 필요합니다.');
  }

  if (item.name && item.name.length > 100) {
    errors.push('이름은 100자를 초과할 수 없습니다.');
  }

  if (!item.imageUrl) {
    errors.push('이미지 URL이 필요합니다.');
  }

  if (!item.prompt || item.prompt.trim().length === 0) {
    errors.push('프롬프트가 필요합니다.');
  }

  if (!item.model) {
    errors.push('모델 정보가 필요합니다.');
  }

  if (item.size && item.size <= 0) {
    errors.push('유효한 파일 크기가 필요합니다.');
  }

  return errors;
};

/**
 * 저장소 사용량 상태 확인
 */
export const getStorageHealthStatus = (usage: StorageUsage): {
  status: 'good' | 'warning' | 'critical';
  message: string;
} => {
  const usagePercentage = calculateUsagePercentage(usage);
  const itemPercentage = Math.round((usage.count / usage.maxCount) * 100);

  if (usagePercentage >= 90 || itemPercentage >= 90) {
    return {
      status: 'critical',
      message: '저장 공간이 거의 다 찼습니다. 일부 항목을 삭제해주세요.'
    };
  }

  if (usagePercentage >= 70 || itemPercentage >= 70) {
    return {
      status: 'warning',
      message: '저장 공간이 부족해지고 있습니다.'
    };
  }

  return {
    status: 'good',
    message: '저장 공간이 충분합니다.'
  };
};

// ==================== 디버깅 및 로깅 ====================

/**
 * 저장소 상태를 콘솔에 출력
 */
export const logStorageStatus = (usage: StorageUsage, items: StorageItem[]): void => {
  if (!STORAGE_CONFIG.debug) return;

  console.group('📦 Storage Status');
  console.log('Used Space:', formatFileSize(usage.used));
  console.log('Total Space:', formatFileSize(usage.limit));
  console.log('Usage:', `${calculateUsagePercentage(usage)}%`);
  console.log('Items:', `${usage.count}/${usage.maxCount}`);
  console.log('Items by Model:', groupItemsByModel(items));
  console.groupEnd();
};

/**
 * 성능 측정을 위한 타이머
 */
export class StorageTimer {
  private startTime: number = 0;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    if (STORAGE_CONFIG.debug) {
      this.startTime = performance.now();
      console.time(this.label);
    }
  }

  end(): number {
    if (STORAGE_CONFIG.debug) {
      console.timeEnd(this.label);
      const elapsed = performance.now() - this.startTime;
      console.log(`${this.label} took ${elapsed.toFixed(2)}ms`);
      return elapsed;
    }
    return 0;
  }
}

export default {
  formatFileSize,
  calculateUsagePercentage,
  calculateRemainingSpace,
  calculateRemainingItems,
  calculateExpiryDate,
  getTimeUntilExpiry,
  formatRelativeTime,
  formatAbsoluteDate,
  extractImageMetadata,
  dataUrlToBlob,
  blobToDataUrl,
  estimateImageSize,
  searchStorageItems,
  groupItemsByModel,
  groupItemsByDate,
  sortStorageItems,
  findExpiredItems,
  findOldItems,
  calculateCleanupCount,
  exportStorageData,
  importStorageData,
  validateStorageItem,
  getStorageHealthStatus,
  logStorageStatus,
  StorageTimer
};