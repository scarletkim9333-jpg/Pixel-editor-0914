import { ENV, log } from '../config/environment';

// 에러 레벨 정의
export type ErrorLevel = 'critical' | 'error' | 'warning' | 'info';

// 에러 카테고리
export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'ai_generation'
  | 'compression'
  | 'storage'
  | 'gallery'
  | 'payment'
  | 'ui'
  | 'performance'
  | 'validation'
  | 'unknown';

// 에러 정보 인터페이스
export interface ErrorInfo {
  id: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

// 에러 리포터 인터페이스
interface ErrorReporter {
  report(errorInfo: ErrorInfo): Promise<void>;
}

// 콘솔 에러 리포터
class ConsoleErrorReporter implements ErrorReporter {
  async report(errorInfo: ErrorInfo): Promise<void> {
    const logLevel = errorInfo.level;
    const message = `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`;

    switch (logLevel) {
      case 'critical':
      case 'error':
        log.error(message, errorInfo);
        break;
      case 'warning':
        log.warn(message, errorInfo);
        break;
      case 'info':
        log.info(message, errorInfo);
        break;
    }
  }
}

// 원격 에러 리포터 (Sentry, LogRocket 등)
class RemoteErrorReporter implements ErrorReporter {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async report(errorInfo: ErrorInfo): Promise<void> {
    // 개발 환경에서는 원격 리포팅 비활성화
    if (!ENV.features.errorReporting || ENV.isDevelopment) {
      return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo),
      });
    } catch (error) {
      // 에러 리포팅 실패 시 콘솔에만 기록
      console.error('Failed to report error to remote service:', error);
    }
  }
}

// 에러 서비스 클래스
class ErrorService {
  private reporters: ErrorReporter[] = [];
  private sessionId: string;
  private errorCount = new Map<ErrorCategory, number>();

  constructor() {
    this.sessionId = this.generateSessionId();

    // 기본 리포터 추가
    this.reporters.push(new ConsoleErrorReporter());

    // 프로덕션에서는 원격 리포터 추가
    if (ENV.features.errorReporting && !ENV.isDevelopment) {
      this.reporters.push(new RemoteErrorReporter('/api/errors'));
    }

    // 전역 에러 핸들러 설정
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // JavaScript 런타임 에러
    window.addEventListener('error', (event) => {
      this.captureError({
        level: 'error',
        category: 'ui',
        message: event.message,
        originalError: event.error,
        context: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      });
    });

    // Promise rejection 에러
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        level: 'error',
        category: 'unknown',
        message: 'Unhandled Promise Rejection',
        context: {
          reason: event.reason,
        },
      });
    });

    // React 에러 경계에서 사용할 수 있도록 전역 노출
    (window as any).pixelErrorService = this;
  }

  private createErrorInfo(params: {
    level: ErrorLevel;
    category: ErrorCategory;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
  }): ErrorInfo {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      level: params.level,
      category: params.category,
      message: params.message,
      originalError: params.originalError,
      context: params.context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: params.originalError?.stack,
    };
  }

  // 에러 캡처 및 리포팅
  async captureError(params: {
    level: ErrorLevel;
    category: ErrorCategory;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
  }): Promise<void> {
    const errorInfo = this.createErrorInfo(params);

    // 에러 카운트 증가
    const currentCount = this.errorCount.get(params.category) || 0;
    this.errorCount.set(params.category, currentCount + 1);

    // 모든 리포터에게 에러 전송
    const reportPromises = this.reporters.map(reporter =>
      reporter.report(errorInfo).catch(err =>
        console.error('Error reporter failed:', err)
      )
    );

    await Promise.allSettled(reportPromises);

    // 치명적 에러의 경우 사용자에게 알림
    if (params.level === 'critical') {
      this.showCriticalErrorNotification(errorInfo);
    }
  }

  private showCriticalErrorNotification(errorInfo: ErrorInfo): void {
    // 사용자 친화적 에러 메시지 표시
    const userMessage = this.getUserFriendlyMessage(errorInfo);

    // 커스텀 이벤트로 UI에 알림
    const event = new CustomEvent('criticalError', {
      detail: {
        message: userMessage,
        errorId: errorInfo.id,
      },
    });
    window.dispatchEvent(event);
  }

  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    const category = errorInfo.category;
    const isKorean = localStorage.getItem('language') === 'ko';

    const messages = {
      ko: {
        network: '네트워크 연결을 확인해주세요',
        auth: '로그인이 필요합니다',
        ai_generation: '이미지 생성에 실패했습니다. 다시 시도해주세요',
        compression: '이미지 압축에 실패했습니다',
        storage: '저장 공간이 부족합니다',
        gallery: '갤러리 로딩에 실패했습니다',
        payment: '결제 처리 중 오류가 발생했습니다',
        ui: '화면 로딩 중 문제가 발생했습니다',
        performance: '성능 문제가 감지되었습니다',
        validation: '입력값을 확인해주세요',
        unknown: '예상치 못한 오류가 발생했습니다',
      },
      en: {
        network: 'Please check your network connection',
        auth: 'Authentication required',
        ai_generation: 'Image generation failed. Please try again',
        compression: 'Image compression failed',
        storage: 'Storage space is full',
        gallery: 'Failed to load gallery',
        payment: 'Payment processing error occurred',
        ui: 'UI loading error occurred',
        performance: 'Performance issue detected',
        validation: 'Please check your input',
        unknown: 'An unexpected error occurred',
      },
    };

    const lang = isKorean ? 'ko' : 'en';
    return messages[lang][category] || messages[lang].unknown;
  }

  // 네트워크 에러 헬퍼
  captureNetworkError(error: Error, context?: Record<string, any>): void {
    this.captureError({
      level: 'error',
      category: 'network',
      message: 'Network request failed',
      originalError: error,
      context,
    });
  }

  // AI 생성 에러 헬퍼
  captureAIError(error: Error, context?: Record<string, any>): void {
    this.captureError({
      level: 'error',
      category: 'ai_generation',
      message: 'AI generation failed',
      originalError: error,
      context,
    });
  }

  // 인증 에러 헬퍼
  captureAuthError(message: string, context?: Record<string, any>): void {
    this.captureError({
      level: 'warning',
      category: 'auth',
      message,
      context,
    });
  }

  // 성능 이슈 헬퍼
  capturePerformanceIssue(message: string, metrics: Record<string, number>): void {
    this.captureError({
      level: 'warning',
      category: 'performance',
      message,
      context: { metrics },
    });
  }

  // 에러 통계 조회
  getErrorStats(): Record<ErrorCategory, number> {
    return Object.fromEntries(this.errorCount);
  }

  // 세션 정보 조회
  getSessionInfo(): { sessionId: string; errorCount: number } {
    const totalErrors = Array.from(this.errorCount.values()).reduce((sum, count) => sum + count, 0);
    return {
      sessionId: this.sessionId,
      errorCount: totalErrors,
    };
  }
}

// 싱글톤 인스턴스
export const errorService = new ErrorService();

// 편의 함수들
export const captureError = errorService.captureError.bind(errorService);
export const captureNetworkError = errorService.captureNetworkError.bind(errorService);
export const captureAIError = errorService.captureAIError.bind(errorService);
export const captureAuthError = errorService.captureAuthError.bind(errorService);
export const capturePerformanceIssue = errorService.capturePerformanceIssue.bind(errorService);

export default errorService;