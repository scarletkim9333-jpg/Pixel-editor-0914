/**
 * 성능 모니터링 도구
 * 이미지 로딩, 갤러리 렌더링, 메모리 사용량 추적
 * Session 7: 성능 최적화
 */

import React from 'react';

// ==================== 타입 정의 ====================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  cacheHit: boolean;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

interface GalleryRenderMetrics {
  itemCount: number;
  renderTime: number;
  virtualizedItemCount?: number;
  scrollPosition?: number;
  memoryUsage?: number;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usage: number; // percentage
}

// ==================== 성능 모니터 클래스 ====================

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: ((metric: PerformanceMetric) => void)[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' ||
                     localStorage.getItem('pixelPerformanceEnabled') === 'true';
  }

  // 메트릭 기록
  record(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // 오래된 메트릭 정리 (최대 1000개 유지)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 관찰자들에게 통지
    this.observers.forEach(observer => observer(metric));

    // 개발 환경에서 로그
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value} ${unit}`, metadata);
    }
  }

  // 타이머 시작
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.record(name, duration, 'ms', metadata);
      return duration;
    };
  }

  // 이미지 로딩 메트릭
  recordImageLoad(metrics: ImageLoadMetrics): void {
    this.record('image.load', metrics.loadTime, 'ms', {
      url: metrics.url,
      cacheHit: metrics.cacheHit,
      fileSize: metrics.fileSize,
      dimensions: metrics.dimensions
    });
  }

  // 갤러리 렌더링 메트릭
  recordGalleryRender(metrics: GalleryRenderMetrics): void {
    this.record('gallery.render', metrics.renderTime, 'ms', {
      itemCount: metrics.itemCount,
      virtualizedItemCount: metrics.virtualizedItemCount,
      scrollPosition: metrics.scrollPosition,
      memoryUsage: metrics.memoryUsage
    });
  }

  // 메모리 사용량 기록
  recordMemoryUsage(): MemoryMetrics | null {
    if (!('memory' in performance)) return null;

    const memory = (performance as any).memory;
    const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    const metrics: MemoryMetrics = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage
    };

    this.record('memory.usage', usage, '%', {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    });

    return metrics;
  }

  // 관찰자 등록
  subscribe(callback: (metric: PerformanceMetric) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // 메트릭 조회
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  // 통계 생성
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    recent: number[];
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    const recent = values.slice(-10); // 최근 10개

    return {
      count: metrics.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      recent
    };
  }

  // 성능 리포트 생성
  generateReport(): {
    summary: Record<string, any>;
    metrics: PerformanceMetric[];
    memory: MemoryMetrics | null;
  } {
    const imageLoadStats = this.getStats('image.load');
    const galleryRenderStats = this.getStats('gallery.render');
    const memoryStats = this.recordMemoryUsage();

    return {
      summary: {
        imageLoading: imageLoadStats,
        galleryRendering: galleryRenderStats,
        totalMetrics: this.metrics.length,
        timeRange: this.metrics.length > 0 ? {
          start: new Date(this.metrics[0].timestamp),
          end: new Date(this.metrics[this.metrics.length - 1].timestamp)
        } : null
      },
      metrics: this.metrics,
      memory: memoryStats
    };
  }

  // 모니터링 활성화/비활성화
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('pixelPerformanceEnabled', String(enabled));
  }

  // 메트릭 클리어
  clear(): void {
    this.metrics = [];
    console.log('[Performance] Metrics cleared');
  }
}

// ==================== 글로벌 인스턴스 ====================

export const performanceMonitor = new PerformanceMonitor();

// ==================== 유틸리티 함수 ====================

// 함수 실행 시간 측정 데코레이터
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const endTimer = performanceMonitor.startTimer(name);
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => endTimer()) as any;
    } else {
      endTimer();
      return result;
    }
  }) as T;
}

// 컴포넌트 렌더링 시간 측정 훅
export function usePerformanceTimer(name: string) {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      performanceMonitor.record(name, duration, 'ms');
    };
  });
}

// 이미지 로딩 시간 측정
export function measureImageLoad(url: string, cacheHit: boolean = false): {
  start: () => void;
  end: (dimensions?: { width: number; height: number }) => void;
} {
  let startTime = 0;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: (dimensions) => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordImageLoad({
        url,
        loadTime,
        cacheHit,
        dimensions
      });
    }
  };
}

// FPS 모니터링
export function createFPSMonitor() {
  let frameCount = 0;
  let startTime = performance.now();

  const measure = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - startTime >= 1000) {
      const fps = frameCount / ((currentTime - startTime) / 1000);
      performanceMonitor.record('fps', fps, 'fps');

      frameCount = 0;
      startTime = currentTime;
    }

    requestAnimationFrame(measure);
  };

  requestAnimationFrame(measure);
}

// 스크롤 성능 모니터링
export function createScrollMonitor(element: HTMLElement) {
  let isScrolling = false;
  let scrollStart = 0;

  const handleScrollStart = () => {
    if (!isScrolling) {
      isScrolling = true;
      scrollStart = performance.now();
    }
  };

  const handleScrollEnd = () => {
    if (isScrolling) {
      const scrollTime = performance.now() - scrollStart;
      performanceMonitor.record('scroll.duration', scrollTime, 'ms');
      isScrolling = false;
    }
  };

  let scrollTimer: NodeJS.Timeout;

  const handleScroll = () => {
    handleScrollStart();

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(handleScrollEnd, 100);
  };

  element.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    element.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimer);
  };
}

// ==================== React 훅 ====================

// 성능 메트릭 실시간 조회
export function usePerformanceMetrics(metricName?: string) {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics(metricName));
    };

    updateMetrics();

    const unsubscribe = performanceMonitor.subscribe(updateMetrics);
    return unsubscribe;
  }, [metricName]);

  return metrics;
}

// 메모리 사용량 모니터링
export function useMemoryMonitor(interval: number = 5000) {
  const [memoryMetrics, setMemoryMetrics] = React.useState<MemoryMetrics | null>(null);

  React.useEffect(() => {
    const monitor = () => {
      const metrics = performanceMonitor.recordMemoryUsage();
      setMemoryMetrics(metrics);
    };

    monitor();
    const timer = setInterval(monitor, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return memoryMetrics;
}

// ==================== 개발 도구 ====================

// 개발 환경에서 전역 객체에 노출
if (process.env.NODE_ENV === 'development') {
  (window as any).pixelPerformance = {
    monitor: performanceMonitor,
    measure: measurePerformance,
    report: () => performanceMonitor.generateReport(),
    clear: () => performanceMonitor.clear(),
    enable: () => performanceMonitor.setEnabled(true),
    disable: () => performanceMonitor.setEnabled(false),
    fps: createFPSMonitor
  };

  // 자동 메모리 모니터링 시작
  setInterval(() => {
    performanceMonitor.recordMemoryUsage();
  }, 10000);
}

// ==================== 타입 내보내기 ====================

export type {
  PerformanceMetric,
  ImageLoadMetrics,
  GalleryRenderMetrics,
  MemoryMetrics
};