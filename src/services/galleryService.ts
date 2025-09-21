/**
 * 갤러리 서비스
 * 사용자의 이미지 갤러리를 관리합니다.
 */

import { storageManager } from './storageService';
import type { StorageItem, ListOptions, StorageUsage } from './storageService';

// ==================== 타입 정의 ====================

export interface GalleryItem extends StorageItem {
  // 갤러리 아이템은 StorageItem과 동일하지만 의미적으로 구분
}

export interface GalleryListOptions extends ListOptions {
  modelFilter?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface GalleryStats {
  totalItems: number;
  totalSize: number;
  models: { [key: string]: number };
  dateRange: {
    oldest: Date | null;
    newest: Date | null;
  };
}

// ==================== 갤러리 서비스 클래스 ====================

class GalleryService {
  /**
   * 이미지를 갤러리에 저장
   */
  async saveImage(
    name: string,
    imageUrl: string,
    prompt: string,
    model: string,
    settings: any,
    thumbnailUrl?: string
  ): Promise<string> {
    try {
      const itemId = await storageManager.save({
        name,
        imageUrl,
        thumbnailUrl,
        prompt,
        model,
        settings
      });

      console.log('갤러리에 이미지 저장 완료:', itemId);
      return itemId;
    } catch (error) {
      console.error('갤러리 저장 실패:', error);
      throw new Error('이미지 저장에 실패했습니다.');
    }
  }

  /**
   * 갤러리 이미지 로드
   */
  async loadImage(id: string): Promise<GalleryItem | null> {
    try {
      return await storageManager.load(id);
    } catch (error) {
      console.error('갤러리 로드 실패:', error);
      return null;
    }
  }

  /**
   * 갤러리 이미지 삭제
   */
  async deleteImage(id: string): Promise<void> {
    try {
      await storageManager.delete(id);
      console.log('갤러리 이미지 삭제 완료:', id);
    } catch (error) {
      console.error('갤러리 삭제 실패:', error);
      throw new Error('이미지 삭제에 실패했습니다.');
    }
  }

  /**
   * 갤러리 이미지 목록 조회
   */
  async listImages(options: GalleryListOptions = {}): Promise<GalleryItem[]> {
    try {
      let items = await storageManager.list(options);

      // 모델 필터링
      if (options.modelFilter) {
        items = items.filter(item =>
          item.model.toLowerCase().includes(options.modelFilter!.toLowerCase())
        );
      }

      // 날짜 범위 필터링
      if (options.dateRange) {
        items = items.filter(item => {
          const itemDate = item.createdAt;
          return itemDate >= options.dateRange!.from &&
                 itemDate <= options.dateRange!.to;
        });
      }

      return items;
    } catch (error) {
      console.error('갤러리 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 갤러리 사용량 통계
   */
  async getUsage(): Promise<StorageUsage> {
    try {
      return await storageManager.getUsage();
    } catch (error) {
      console.error('갤러리 사용량 조회 실패:', error);
      return {
        used: 0,
        limit: 0,
        count: 0,
        maxCount: 0
      };
    }
  }

  /**
   * 갤러리 상세 통계
   */
  async getStats(): Promise<GalleryStats> {
    try {
      const items = await this.listImages();

      const stats: GalleryStats = {
        totalItems: items.length,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        models: {},
        dateRange: {
          oldest: null,
          newest: null
        }
      };

      // 모델별 통계
      items.forEach(item => {
        stats.models[item.model] = (stats.models[item.model] || 0) + 1;
      });

      // 날짜 범위 계산
      if (items.length > 0) {
        const sortedDates = items
          .map(item => item.createdAt)
          .sort((a, b) => a.getTime() - b.getTime());

        stats.dateRange.oldest = sortedDates[0];
        stats.dateRange.newest = sortedDates[sortedDates.length - 1];
      }

      return stats;
    } catch (error) {
      console.error('갤러리 통계 조회 실패:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        models: {},
        dateRange: { oldest: null, newest: null }
      };
    }
  }

  /**
   * 갤러리 검색
   */
  async searchImages(query: string): Promise<GalleryItem[]> {
    try {
      const items = await this.listImages();

      const lowerQuery = query.toLowerCase();
      return items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.prompt.toLowerCase().includes(lowerQuery) ||
        item.model.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('갤러리 검색 실패:', error);
      return [];
    }
  }

  /**
   * 모델별 이미지 조회
   */
  async getImagesByModel(model: string): Promise<GalleryItem[]> {
    try {
      return await this.listImages({ modelFilter: model });
    } catch (error) {
      console.error('모델별 이미지 조회 실패:', error);
      return [];
    }
  }

  /**
   * 최근 이미지 조회
   */
  async getRecentImages(count: number = 10): Promise<GalleryItem[]> {
    try {
      return await this.listImages({
        limit: count,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('최근 이미지 조회 실패:', error);
      return [];
    }
  }

  /**
   * 갤러리 전체 삭제
   */
  async clearGallery(): Promise<void> {
    try {
      if (storageManager.clear) {
        await storageManager.clear();
        console.log('갤러리 전체 삭제 완료');
      } else {
        // clear 메소드가 없으면 개별 삭제
        const items = await this.listImages();
        await Promise.all(items.map(item => this.deleteImage(item.id)));
      }
    } catch (error) {
      console.error('갤러리 삭제 실패:', error);
      throw new Error('갤러리 삭제에 실패했습니다.');
    }
  }

  /**
   * 이미지 복제
   */
  async duplicateImage(id: string): Promise<string> {
    try {
      const original = await this.loadImage(id);
      if (!original) {
        throw new Error('원본 이미지를 찾을 수 없습니다.');
      }

      return await this.saveImage(
        `${original.name} (복사본)`,
        original.imageUrl,
        original.prompt,
        original.model,
        original.settings,
        original.thumbnailUrl
      );
    } catch (error) {
      console.error('이미지 복제 실패:', error);
      throw new Error('이미지 복제에 실패했습니다.');
    }
  }

  /**
   * 내보내기 (JSON)
   */
  async exportGallery(): Promise<string> {
    try {
      const items = await this.listImages();
      const stats = await this.getStats();

      const exportData = {
        exportDate: new Date().toISOString(),
        stats,
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          expiresAt: item.expiresAt?.toISOString()
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('갤러리 내보내기 실패:', error);
      throw new Error('갤러리 내보내기에 실패했습니다.');
    }
  }

  /**
   * 현재 저장소 티어 확인
   */
  getCurrentTier() {
    return storageManager.getCurrentTier();
  }

  /**
   * 저장 가능 여부 확인
   */
  async canSave(): Promise<boolean> {
    return await storageManager.canSave();
  }
}

// ==================== 싱글톤 인스턴스 ====================

export const galleryService = new GalleryService();

// ==================== 유틸리티 함수 ====================

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 상대 시간 표시
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay}일 전`;
  } else if (diffHour > 0) {
    return `${diffHour}시간 전`;
  } else if (diffMin > 0) {
    return `${diffMin}분 전`;
  } else {
    return '방금 전';
  }
}

/**
 * 모델 이름을 사용자 친화적으로 변환
 */
export function formatModelName(model: string): string {
  const modelNames: { [key: string]: string } = {
    'nano-banana': 'NanoBanana',
    'seedream': 'Seedream',
    'kie-nano-banana-upscale': 'NanoBanana Upscale'
  };

  return modelNames[model] || model;
}