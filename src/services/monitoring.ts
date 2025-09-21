import { ENV, log } from '../config/environment';
import { errorService } from './errorService';

// 성능 메트릭 타입
export interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte

  // 커스텀 메트릭
  renderTime?: number;
  bundleSize?: number;
  memoryUsage?: number;
  apiResponseTime?: number;
}

// 사용자 이벤트 타입
export interface UserEvent {
  type: 'page_view' | 'click' | 'generation' | 'error' | 'performance';
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

// 분석 제공자 인터페이스
interface AnalyticsProvider {
  initialize(): Promise<void>;
  track(event: UserEvent): Promise<void>;
  trackPerformance(metrics: PerformanceMetrics): Promise<void>;
  setUser(userId: string, properties?: Record<string, any>): Promise<void>;
}

// Google Analytics 4 구현
class GoogleAnalyticsProvider implements AnalyticsProvider {
  private gtag: any;
  private measurementId: string;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  async initialize(): Promise<void> {
    if (!this.measurementId || ENV.isDevelopment) {
      log.debug('Google Analytics skipped in development');
      return;
    }

    // GA4 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // gtag 함수 설정
    (window as any).dataLayer = (window as any).dataLayer || [];
    this.gtag = function (...args: any[]) {
      (window as any).dataLayer.push(args);
    };

    this.gtag('js', new Date());
    this.gtag('config', this.measurementId, {
      // GDPR 준수 설정
      anonymize_ip: true,
      cookie_flags: 'secure;samesite=none',
    });

    log.info('Google Analytics initialized');
  }

  async track(event: UserEvent): Promise<void> {
    if (!this.gtag) return;

    this.gtag('event', event.name, {
      event_category: event.type,
      event_label: event.name,
      value: 1,
      ...event.properties,
    });
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<void> {
    if (!this.gtag) return;

    // Core Web Vitals 전송
    Object.entries(metrics).forEach(([name, value]) => {
      if (value !== undefined) {
        this.gtag('event', 'performance_metric', {
          metric_name: name,
          metric_value: value,
          event_category: 'performance',
        });
      }
    });
  }

  async setUser(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.gtag) return;

    this.gtag('config', this.measurementId, {
      user_id: userId,
      custom_map: properties,
    });
  }
}

// 커스텀 분석 제공자 (자체 서버로 데이터 전송)
class CustomAnalyticsProvider implements AnalyticsProvider {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async initialize(): Promise<void> {
    log.info('Custom Analytics initialized');
  }

  async track(event: UserEvent): Promise<void> {
    if (ENV.isDevelopment) return;

    try {
      await fetch(`${this.endpoint}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      log.error('Failed to track event:', error);
    }
  }

  async trackPerformance(metrics: PerformanceMetrics): Promise<void> {
    if (ENV.isDevelopment) return;

    try {
      await fetch(`${this.endpoint}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      log.error('Failed to track performance:', error);
    }
  }

  async setUser(userId: string, properties?: Record<string, any>): Promise<void> {
    // 사용자 정보는 개별 이벤트에 포함
    log.debug('User set:', userId, properties);
  }
}

// 모니터링 서비스 클래스
class MonitoringService {
  private providers: AnalyticsProvider[] = [];
  private sessionId: string;
  private userId?: string;
  private performanceObserver?: PerformanceObserver;
  private eventBuffer: UserEvent[] = [];
  private flushInterval: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.flushInterval = window.setInterval(() => this.flush(), 10000); // 10초마다 플러시

    this.initializeProviders();
    this.setupPerformanceMonitoring();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeProviders(): Promise<void> {
    // Google Analytics 설정
    const gaId = ENV.debug.analytics ? 'G-XXXXXXXXXX' : undefined; // 실제 GA ID로 교체
    if (gaId && ENV.features.analytics) {
      this.providers.push(new GoogleAnalyticsProvider(gaId));
    }

    // 커스텀 분석 설정
    if (ENV.features.analytics) {
      this.providers.push(new CustomAnalyticsProvider('/api/analytics'));
    }

    // 모든 제공자 초기화
    await Promise.allSettled(
      this.providers.map(provider =>
        provider.initialize().catch(error =>
          log.error('Failed to initialize analytics provider:', error)
        )
      )
    );
  }

  private setupPerformanceMonitoring(): void {
    if (!ENV.features.monitoring) return;

    // Web Vitals 측정
    this.measureWebVitals();

    // Performance Observer 설정
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => this.processPerformanceEntry(entry));
      });

      // 다양한 성능 메트릭 관찰
      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        log.error('Failed to setup performance observer:', error);
      }
    }

    // 메모리 사용량 모니터링
    this.startMemoryMonitoring();
  }

  private measureWebVitals(): void {
    // FCP (First Contentful Paint)
    this.measureFCP();

    // LCP (Largest Contentful Paint)
    this.measureLCP();

    // FID (First Input Delay)
    this.measureFID();

    // CLS (Cumulative Layout Shift)
    this.measureCLS();
  }

  private measureFCP(): void {
    if ('PerformancePaintTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.trackPerformance({ FCP: fcpEntry.startTime });
          observer.disconnect();
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }
  }

  private measureLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance({ LCP: lastEntry.startTime });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  private measureFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            this.trackPerformance({ FID: fid });
          }
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private measureCLS(): void {
    let clsValue = 0;
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.trackPerformance({ CLS: clsValue });
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private startMemoryMonitoring(): void {
    if ('memory' in (performance as any)) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.trackPerformance({
          memoryUsage: memory.usedJSHeapSize,
        });
      }, 30000); // 30초마다 측정
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      this.trackPerformance({
        TTFB: navEntry.responseStart - navEntry.requestStart,
        renderTime: navEntry.loadEventEnd - navEntry.navigationStart,
      });
    }
  }

  private setupEventListeners(): void {
    // 페이지 뷰 추적
    window.addEventListener('load', () => {
      this.track('page_view', 'page_loaded', {
        page: window.location.pathname,
        title: document.title,
      });
    });

    // 사용자 상호작용 추적
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.getAttribute('data-track')) {
        this.track('click', target.getAttribute('data-track') || 'unknown_click', {
          element: target.tagName,
          text: target.textContent?.substring(0, 50),
        });
      }
    });

    // 페이지 이탈 전 데이터 플러시
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Visibility API로 탭 전환 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  // 이벤트 추적
  public track(type: UserEvent['type'], name: string, properties?: Record<string, any>): void {
    const event: UserEvent = {
      type,
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.eventBuffer.push(event);

    // 즉시 전송이 필요한 이벤트들
    if (['error', 'generation'].includes(type)) {
      this.flush();
    }
  }

  // 성능 메트릭 추적
  public trackPerformance(metrics: PerformanceMetrics): void {
    this.providers.forEach(provider =>
      provider.trackPerformance(metrics).catch(error =>
        log.error('Failed to track performance:', error)
      )
    );
  }

  // 사용자 설정
  public setUser(userId: string, properties?: Record<string, any>): void {
    this.userId = userId;
    this.providers.forEach(provider =>
      provider.setUser(userId, properties).catch(error =>
        log.error('Failed to set user:', error)
      )
    );
  }

  // AI 생성 이벤트 추적
  public trackGeneration(success: boolean, model: string, tokensUsed: number): void {
    this.track('generation', success ? 'generation_success' : 'generation_failed', {
      model,
      tokens_used: tokensUsed,
      success,
    });
  }

  // 에러 이벤트 추적
  public trackError(errorCategory: string, errorMessage: string): void {
    this.track('error', `error_${errorCategory}`, {
      category: errorCategory,
      message: errorMessage,
    });
  }

  // 버퍼된 이벤트 플러시
  private flush(): void {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    events.forEach(event => {
      this.providers.forEach(provider =>
        provider.track(event).catch(error =>
          log.error('Failed to track event:', error)
        )
      );
    });
  }

  // 정리
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.flush();
  }
}

// 싱글톤 인스턴스
export const monitoringService = new MonitoringService();

// 편의 함수들
export const track = monitoringService.track.bind(monitoringService);
export const trackPerformance = monitoringService.trackPerformance.bind(monitoringService);
export const setUser = monitoringService.setUser.bind(monitoringService);
export const trackGeneration = monitoringService.trackGeneration.bind(monitoringService);
export const trackError = monitoringService.trackError.bind(monitoringService);

// 개발 환경에서 전역 노출
if (ENV.debug.enabled && typeof window !== 'undefined') {
  (window as any).pixelMonitoring = monitoringService;
}

export default monitoringService;