import { useEffect, useCallback, useRef } from 'react';
import { monitoringService, track, trackPerformance, setUser } from '../services/monitoring';
import { ENV } from '../config/environment';

// GDPR 동의 상태
type ConsentStatus = 'pending' | 'granted' | 'denied';

interface AnalyticsState {
  isEnabled: boolean;
  consentStatus: ConsentStatus;
  sessionId: string;
}

// 사용자 동의 관리
class ConsentManager {
  private static readonly CONSENT_KEY = 'pixel_analytics_consent';
  private static readonly CONSENT_VERSION = '1.0';

  static getConsent(): ConsentStatus {
    if (!ENV.features.analytics) return 'denied';

    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      if (!stored) return 'pending';

      const consent = JSON.parse(stored);
      if (consent.version !== this.CONSENT_VERSION) return 'pending';

      return consent.status;
    } catch {
      return 'pending';
    }
  }

  static setConsent(status: ConsentStatus): void {
    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify({
        status,
        version: this.CONSENT_VERSION,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save consent:', error);
    }
  }

  static showConsentDialog(): Promise<ConsentStatus> {
    return new Promise((resolve) => {
      // 커스텀 이벤트로 동의 다이얼로그 요청
      const event = new CustomEvent('showConsentDialog', {
        detail: { resolve }
      });
      window.dispatchEvent(event);
    });
  }
}

// 메인 훅
export const useAnalytics = () => {
  const sessionStartRef = useRef<number>(Date.now());
  const pageViewTrackedRef = useRef<boolean>(false);

  const getAnalyticsState = useCallback((): AnalyticsState => {
    const consentStatus = ConsentManager.getConsent();
    return {
      isEnabled: ENV.features.analytics && consentStatus === 'granted',
      consentStatus,
      sessionId: (monitoringService as any).sessionId || 'unknown',
    };
  }, []);

  // 동의 요청
  const requestConsent = useCallback(async (): Promise<ConsentStatus> => {
    const current = ConsentManager.getConsent();
    if (current !== 'pending') return current;

    const status = await ConsentManager.showConsentDialog();
    ConsentManager.setConsent(status);
    return status;
  }, []);

  // 사용자 설정
  const identifyUser = useCallback((userId: string, properties?: Record<string, any>) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    setUser(userId, {
      ...properties,
      session_start: sessionStartRef.current,
    });
  }, [getAnalyticsState]);

  // 이벤트 추적
  const trackEvent = useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    track('click', eventName, properties);
  }, [getAnalyticsState]);

  // 페이지 뷰 추적
  const trackPageView = useCallback((
    pageName?: string,
    properties?: Record<string, any>
  ) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    track('page_view', pageName || window.location.pathname, {
      ...properties,
      page_title: document.title,
      referrer: document.referrer,
    });
  }, [getAnalyticsState]);

  // 생성 이벤트 추적
  const trackGeneration = useCallback((
    success: boolean,
    model: string,
    tokensUsed: number,
    additionalProperties?: Record<string, any>
  ) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    track('generation', success ? 'generation_success' : 'generation_failed', {
      model,
      tokens_used: tokensUsed,
      success,
      ...additionalProperties,
    });
  }, [getAnalyticsState]);

  // 에러 추적
  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    errorContext?: Record<string, any>
  ) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    track('error', `error_${errorType}`, {
      error_message: errorMessage,
      error_type: errorType,
      ...errorContext,
    });
  }, [getAnalyticsState]);

  // 성능 측정
  const measurePerformance = useCallback((
    metricName: string,
    startTime: number,
    additionalMetrics?: Record<string, number>
  ) => {
    const state = getAnalyticsState();
    if (!state.isEnabled) return;

    const duration = performance.now() - startTime;
    trackPerformance({
      [metricName]: duration,
      ...additionalMetrics,
    });
  }, [getAnalyticsState]);

  // 초기화 및 자동 페이지 뷰
  useEffect(() => {
    const initAnalytics = async () => {
      if (!ENV.features.analytics) return;

      // 동의 확인
      const consentStatus = ConsentManager.getConsent();
      if (consentStatus === 'pending') {
        // 프로덕션에서만 동의 요청
        if (!ENV.isDevelopment) {
          await requestConsent();
        }
      }

      // 페이지 뷰 자동 추적 (한 번만)
      if (!pageViewTrackedRef.current) {
        trackPageView();
        pageViewTrackedRef.current = true;
      }
    };

    initAnalytics();
  }, [trackPageView, requestConsent]);

  return {
    // 상태
    ...getAnalyticsState(),

    // 동의 관리
    requestConsent,

    // 사용자 관리
    identifyUser,

    // 이벤트 추적
    trackEvent,
    trackPageView,
    trackGeneration,
    trackError,

    // 성능 측정
    measurePerformance,
  };
};

// 성능 측정 훅
export const usePerformanceTracking = (metricName: string) => {
  const startTimeRef = useRef<number>(performance.now());
  const { measurePerformance, isEnabled } = useAnalytics();

  const markComplete = useCallback((additionalMetrics?: Record<string, number>) => {
    if (!isEnabled) return;
    measurePerformance(metricName, startTimeRef.current, additionalMetrics);
  }, [measurePerformance, metricName, isEnabled]);

  const reset = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  return { markComplete, reset };
};

// 사용자 행동 추적 훅
export const useUserBehavior = () => {
  const { trackEvent, isEnabled } = useAnalytics();

  // 클릭 추적
  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;
    trackEvent(`click_${element}`, properties);
  }, [trackEvent, isEnabled]);

  // 시간 기반 추적
  const trackTimeSpent = useCallback((section: string, startTime: number) => {
    if (!isEnabled) return;
    const timeSpent = Date.now() - startTime;
    trackEvent(`time_spent_${section}`, { duration_ms: timeSpent });
  }, [trackEvent, isEnabled]);

  // 스크롤 추적
  const trackScroll = useCallback((depth: number) => {
    if (!isEnabled) return;
    trackEvent('scroll_depth', { depth_percent: Math.round(depth * 100) });
  }, [trackEvent, isEnabled]);

  return {
    trackClick,
    trackTimeSpent,
    trackScroll,
  };
};

// A/B 테스트 훅
export const useABTest = (testName: string, variants: string[]) => {
  const { trackEvent, sessionId } = useAnalytics();

  // 일관된 변형 선택 (세션 기반)
  const getVariant = useCallback((): string => {
    const hash = sessionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  }, [sessionId, variants]);

  const variant = getVariant();

  // 변형 노출 추적
  useEffect(() => {
    trackEvent(`ab_test_${testName}`, {
      variant,
      test_name: testName,
    });
  }, [testName, variant, trackEvent]);

  // 전환 추적
  const trackConversion = useCallback((conversionType?: string) => {
    trackEvent(`ab_conversion_${testName}`, {
      variant,
      test_name: testName,
      conversion_type: conversionType || 'default',
    });
  }, [testName, variant, trackEvent]);

  return {
    variant,
    trackConversion,
  };
};

export default useAnalytics;