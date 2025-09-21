/**
 * 캐싱 서비스
 * 메모리 기반 캐시로 성능 최적화
 * Session 7: 성능 최적화
 */

// ==================== 타입 정의 ====================

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableLogging: boolean;
}

// ==================== 캐시 매니저 ====================

export class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private hits = 0;
  private misses = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private config: CacheConfig) {
    this.startCleanup();
  }

  // 데이터 저장
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    // 캐시 크기 제한 체크
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    });

    this.log(`SET: ${key} (expires: ${new Date(expiresAt).toISOString()})`);
  }

  // 데이터 조회
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      this.log(`MISS: ${key}`);
      return null;
    }

    // 만료 체크
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      this.log(`EXPIRED: ${key}`);
      return null;
    }

    // 액세스 정보 업데이트
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.hits++;
    this.log(`HIT: ${key} (access count: ${item.accessCount})`);

    return item.data;
  }

  // 데이터 삭제
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.log(`DELETE: ${key}`);
    }
    return deleted;
  }

  // 특정 패턴의 키 삭제
  deleteByPattern(pattern: RegExp): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    this.log(`DELETE_PATTERN: ${pattern} (${deleted} items)`);
    return deleted;
  }

  // 캐시 클리어
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.log(`CLEAR: ${size} items removed`);
  }

  // 만료된 항목 정리
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.log(`CLEANUP: ${cleaned} expired items removed`);
    }

    return cleaned;
  }

  // LRU 방식으로 항목 제거
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`EVICT_LRU: ${oldestKey}`);
    }
  }

  // 자동 정리 시작
  private startCleanup(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  // 자동 정리 중지
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // 통계 정보
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    let memoryUsage = 0;

    // 대략적인 메모리 사용량 계산
    for (const [key, item] of this.cache.entries()) {
      memoryUsage += key.length * 2; // string size
      memoryUsage += JSON.stringify(item.data).length * 2; // data size
      memoryUsage += 32; // metadata overhead
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      memoryUsage
    };
  }

  // 디버그 로그
  private log(message: string): void {
    if (this.config.enableLogging && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] ${message}`);
    }
  }
}

// ==================== 특화된 캐시 인스턴스 ====================

// 이미지 캐시 (URL 기반)
export const imageCache = new CacheManager<string>({
  maxSize: 200,
  defaultTTL: 30 * 60 * 1000, // 30분
  cleanupInterval: 5 * 60 * 1000, // 5분마다 정리
  enableLogging: true
});

// 메타데이터 캐시 (갤러리 아이템 정보)
export const metadataCache = new CacheManager<any>({
  maxSize: 500,
  defaultTTL: 10 * 60 * 1000, // 10분
  cleanupInterval: 2 * 60 * 1000, // 2분마다 정리
  enableLogging: true
});

// API 응답 캐시
export const apiCache = new CacheManager<any>({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5분
  cleanupInterval: 60 * 1000, // 1분마다 정리
  enableLogging: true
});

// ==================== 헬퍼 함수 ====================

// 이미지 URL 캐싱
export const cacheImageUrl = (originalUrl: string, optimizedUrl: string, ttl?: number): void => {
  imageCache.set(originalUrl, optimizedUrl, ttl);
};

// 이미지 URL 조회
export const getCachedImageUrl = (originalUrl: string): string | null => {
  return imageCache.get(originalUrl);
};

// 갤러리 아이템 캐싱
export const cacheGalleryItem = (id: string, item: any, ttl?: number): void => {
  metadataCache.set(`gallery:${id}`, item, ttl);
};

// 갤러리 아이템 조회
export const getCachedGalleryItem = (id: string): any | null => {
  return metadataCache.get(`gallery:${id}`);
};

// 검색 결과 캐싱
export const cacheSearchResults = (query: string, results: any[], ttl?: number): void => {
  const key = `search:${btoa(query).slice(0, 20)}`;
  apiCache.set(key, results, ttl);
};

// 검색 결과 조회
export const getCachedSearchResults = (query: string): any[] | null => {
  const key = `search:${btoa(query).slice(0, 20)}`;
  return apiCache.get(key);
};

// ==================== 캐시 관리 도구 ====================

// 전체 캐시 통계
export const getAllCacheStats = () => {
  return {
    image: imageCache.getStats(),
    metadata: metadataCache.getStats(),
    api: apiCache.getStats()
  };
};

// 전체 캐시 클리어
export const clearAllCaches = (): void => {
  imageCache.clear();
  metadataCache.clear();
  apiCache.clear();
  console.log('[Cache] All caches cleared');
};

// 전체 캐시 정리
export const cleanupAllCaches = (): number => {
  const cleaned =
    imageCache.cleanup() +
    metadataCache.cleanup() +
    apiCache.cleanup();

  console.log(`[Cache] Total ${cleaned} expired items cleaned`);
  return cleaned;
};

// 메모리 사용량 체크
export const getMemoryUsage = () => {
  const stats = getAllCacheStats();
  const total = stats.image.memoryUsage + stats.metadata.memoryUsage + stats.api.memoryUsage;

  return {
    total,
    byCache: {
      image: stats.image.memoryUsage,
      metadata: stats.metadata.memoryUsage,
      api: stats.api.memoryUsage
    },
    formatted: {
      total: formatBytes(total),
      image: formatBytes(stats.image.memoryUsage),
      metadata: formatBytes(stats.metadata.memoryUsage),
      api: formatBytes(stats.api.memoryUsage)
    }
  };
};

// 바이트 포맷팅 유틸리티
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 개발 환경에서 디버깅을 위해 전역 객체에 노출
if (process.env.NODE_ENV === 'development') {
  (window as any).pixelCache = {
    image: imageCache,
    metadata: metadataCache,
    api: apiCache,
    stats: getAllCacheStats,
    clear: clearAllCaches,
    cleanup: cleanupAllCaches,
    memory: getMemoryUsage
  };
}