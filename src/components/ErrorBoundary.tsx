import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { errorService } from '../services/errorService';
// import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

// 에러 폴백 UI 컴포넌트
const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  onReset: () => void;
  onReportProblem: () => void;
}> = ({ error, errorInfo, eventId, onReset, onReportProblem }) => {
  // const { t } = useLanguage();
  const t = (key: string, fallback: string) => fallback;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border-2 border-pink-200 p-6">
        {/* 에러 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* 에러 메시지 */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t('errors.something_went_wrong', '문제가 발생했습니다')}
          </h1>
          <p className="text-gray-600 text-sm">
            {t('errors.unexpected_error_occurred', '예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.')}
          </p>
        </div>

        {/* 에러 ID (개발/스테이징 환경에서만) */}
        {eventId && process.env.NODE_ENV !== 'production' && (
          <div className="bg-gray-100 rounded p-2 mb-4 text-xs text-gray-500 text-center">
            Error ID: {eventId}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          {/* 다시 시도 버튼 */}
          <button
            onClick={onReset}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg
                     transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t('errors.try_again', '다시 시도')}
          </button>

          {/* 홈으로 돌아가기 */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg
                     transition-colors duration-200"
          >
            {t('errors.go_home', '홈으로 돌아가기')}
          </button>

          {/* 문제 신고 버튼 (프로덕션에서만) */}
          {process.env.NODE_ENV === 'production' && (
            <button
              onClick={onReportProblem}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              {t('errors.report_problem', '문제 신고하기')}
            </button>
          )}
        </div>

        {/* 디버그 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              디버그 정보
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-red-600 max-h-32 overflow-auto">
              <pre>{error.stack}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    eventId: null,
  };

  constructor(props: Props) {
    super(props);
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
    this.reportProblem = this.reportProblem.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    // 에러가 발생하면 상태 업데이트
    return {
      hasError: true,
      error,
      errorInfo: null,
      eventId: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러를 errorService에 보고
    const reportError = async () => {
      try {
        await errorService.captureError({
          level: 'critical',
          category: 'ui',
          message: `React Error Boundary: ${error.message}`,
          originalError: error,
          context: {
            componentStack: errorInfo.componentStack,
            errorBoundary: 'ErrorBoundary',
          },
        });

        // 에러 ID 생성 (실제로는 에러 서비스에서 반환받아야 함)
        const eventId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.setState({
          errorInfo,
          eventId,
        });
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
      }
    };

    reportError();

    // props의 onError 콜백 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // props 변경시 에러 상태 리셋
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  public componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  private reportProblem = () => {
    // 문제 신고 로직 (이메일 열기, 피드백 폼 등)
    const subject = encodeURIComponent('Pixel Editor - 문제 신고');
    const body = encodeURIComponent(`
문제가 발생했습니다.

에러 ID: ${this.state.eventId}
발생 시간: ${new Date().toISOString()}
페이지: ${window.location.href}
브라우저: ${navigator.userAgent}

문제 설명:
(여기에 문제 상황을 자세히 설명해주세요)
    `);

    window.open(`mailto:support@pixeleditor.com?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 폴백 UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          eventId={this.state.eventId}
          onReset={this.resetErrorBoundary}
          onReportProblem={this.reportProblem}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// HOC 버전
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// 훅 버전
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    errorService.captureError({
      level: 'error',
      category: 'ui',
      message: error.message,
      originalError: error,
      context: { errorInfo },
    });
  };
};