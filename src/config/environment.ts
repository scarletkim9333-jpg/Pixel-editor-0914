// 환경별 설정 통합 관리
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // 기본 환경 정보
  name: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;

  // API 설정
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Supabase 설정
  supabase: {
    url: string;
    anonKey: string;
    enabled: boolean;
  };

  // TossPayments 설정
  tossPayments: {
    clientKey: string;
    enabled: boolean;
  };

  // AI 서비스 설정
  ai: {
    geminiApiKey: string;
    falKey: string;
    enabled: boolean;
  };

  // 디버그 및 로깅
  debug: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    performance: boolean;
    analytics: boolean;
  };

  // 성능 설정
  performance: {
    enableServiceWorker: boolean;
    enableCache: boolean;
    compressionQuality: number;
    thumbnailSize: number;
    lazyLoading: boolean;
    virtualScrollThreshold: number;
  };

  // 기능 플래그
  features: {
    gallery: boolean;
    sharing: boolean;
    compression: boolean;
    analytics: boolean;
    monitoring: boolean;
    errorReporting: boolean;
  };

  // 보안 설정
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    secureCookies: boolean;
  };
}

// 환경변수 헬퍼
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// 현재 환경 감지
const getCurrentEnvironment = (): Environment => {
  const mode = import.meta.env.MODE;
  const nodeEnv = import.meta.env.NODE_ENV;

  if (mode === 'production' || nodeEnv === 'production') {
    return 'production';
  } else if (mode === 'staging') {
    return 'staging';
  } else {
    return 'development';
  }
};

// 환경별 기본 설정
const createConfig = (env: Environment): EnvironmentConfig => {
  const isDevelopment = env === 'development';
  const isProduction = env === 'production';
  const isStaging = env === 'staging';

  return {
    name: env,
    isDevelopment,
    isProduction,
    isStaging,

    api: {
      baseUrl: getEnvVar('VITE_API_URL',
        isDevelopment ? 'http://localhost:3001/api' : '/api'
      ),
      timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
      retryAttempts: getEnvNumber('VITE_API_RETRY_ATTEMPTS', 3)
    },

    supabase: {
      url: getEnvVar('VITE_SUPABASE_URL', ''),
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', ''),
      enabled: getEnvBool('VITE_SUPABASE_ENABLED', !isDevelopment)
    },

    tossPayments: {
      clientKey: getEnvVar('VITE_TOSS_CLIENT_KEY', ''),
      enabled: getEnvBool('VITE_TOSS_ENABLED', !isDevelopment)
    },

    ai: {
      geminiApiKey: getEnvVar('VITE_GEMINI_API_KEY', ''),
      falKey: getEnvVar('VITE_FAL_KEY', ''),
      enabled: getEnvBool('VITE_AI_ENABLED', true)
    },

    debug: {
      enabled: getEnvBool('VITE_DEBUG_MODE', isDevelopment),
      level: getEnvVar('VITE_DEBUG_LEVEL', isDevelopment ? 'debug' : 'error') as any,
      performance: getEnvBool('VITE_DEBUG_PERFORMANCE', isDevelopment),
      analytics: getEnvBool('VITE_DEBUG_ANALYTICS', isDevelopment)
    },

    performance: {
      enableServiceWorker: getEnvBool('VITE_ENABLE_SW', isProduction),
      enableCache: getEnvBool('VITE_ENABLE_CACHE', true),
      compressionQuality: getEnvNumber('VITE_COMPRESSION_QUALITY', 85),
      thumbnailSize: getEnvNumber('VITE_THUMBNAIL_SIZE', 200),
      lazyLoading: getEnvBool('VITE_LAZY_LOADING', true),
      virtualScrollThreshold: getEnvNumber('VITE_VIRTUAL_SCROLL_THRESHOLD', 100)
    },

    features: {
      gallery: getEnvBool('VITE_FEATURE_GALLERY', true),
      sharing: getEnvBool('VITE_FEATURE_SHARING', true),
      compression: getEnvBool('VITE_FEATURE_COMPRESSION', true),
      analytics: getEnvBool('VITE_FEATURE_ANALYTICS', !isDevelopment),
      monitoring: getEnvBool('VITE_FEATURE_MONITORING', !isDevelopment),
      errorReporting: getEnvBool('VITE_FEATURE_ERROR_REPORTING', !isDevelopment)
    },

    security: {
      enableCSP: getEnvBool('VITE_ENABLE_CSP', isProduction),
      enableHSTS: getEnvBool('VITE_ENABLE_HSTS', isProduction),
      secureCookies: getEnvBool('VITE_SECURE_COOKIES', isProduction)
    }
  };
};

// 현재 환경 설정
export const ENV = createConfig(getCurrentEnvironment());

// 환경별 체크 헬퍼
export const isDev = ENV.isDevelopment;
export const isProd = ENV.isProduction;
export const isStaging = ENV.isStaging;

// 디버그 헬퍼
export const log = {
  error: (...args: any[]) => {
    if (ENV.debug.enabled && ['error', 'warn', 'info', 'debug'].includes(ENV.debug.level)) {
      console.error('[PIXEL-EDITOR:ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV.debug.enabled && ['warn', 'info', 'debug'].includes(ENV.debug.level)) {
      console.warn('[PIXEL-EDITOR:WARN]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (ENV.debug.enabled && ['info', 'debug'].includes(ENV.debug.level)) {
      console.info('[PIXEL-EDITOR:INFO]', ...args);
    }
  },
  debug: (...args: any[]) => {
    if (ENV.debug.enabled && ENV.debug.level === 'debug') {
      console.debug('[PIXEL-EDITOR:DEBUG]', ...args);
    }
  }
};

// 성능 측정 헬퍼
export const performanceLog = (name: string, fn: () => void) => {
  if (!ENV.debug.performance) {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();
  log.debug(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
};

// 브라우저 콘솔에 환경 정보 노출 (개발환경에서만)
if (ENV.debug.enabled && typeof window !== 'undefined') {
  (window as any).pixelEnv = ENV;
  log.info('Environment configuration loaded:', ENV.name);
  log.debug('Full config available at window.pixelEnv');
}

export default ENV;