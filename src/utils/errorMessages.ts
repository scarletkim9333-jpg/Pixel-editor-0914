// 에러 코드별 사용자 친화적 메시지 매핑

export interface ErrorMessage {
  ko: string;
  en: string;
}

export interface DetailedErrorMessage extends ErrorMessage {
  suggestion?: {
    ko: string;
    en: string;
  };
  action?: {
    ko: string;
    en: string;
  };
}

// 네트워크 관련 에러
export const NETWORK_ERRORS: Record<string, DetailedErrorMessage> = {
  FETCH_TIMEOUT: {
    ko: '요청 시간이 초과되었습니다',
    en: 'Request timeout',
    suggestion: {
      ko: '네트워크 연결 상태를 확인해주세요',
      en: 'Please check your network connection'
    },
    action: {
      ko: '다시 시도',
      en: 'Retry'
    }
  },

  NETWORK_UNREACHABLE: {
    ko: '서버에 연결할 수 없습니다',
    en: 'Cannot connect to server',
    suggestion: {
      ko: '잠시 후 다시 시도하거나 네트워크 설정을 확인해주세요',
      en: 'Please try again later or check your network settings'
    },
    action: {
      ko: '재연결 시도',
      en: 'Reconnect'
    }
  },

  SERVER_ERROR: {
    ko: '서버에서 오류가 발생했습니다',
    en: 'Server error occurred',
    suggestion: {
      ko: '잠시 후 다시 시도해주세요',
      en: 'Please try again later'
    },
    action: {
      ko: '다시 시도',
      en: 'Retry'
    }
  }
};

// 인증 관련 에러
export const AUTH_ERRORS: Record<string, DetailedErrorMessage> = {
  UNAUTHORIZED: {
    ko: '로그인이 필요합니다',
    en: 'Please log in',
    suggestion: {
      ko: '계속하려면 로그인해주세요',
      en: 'Please log in to continue'
    },
    action: {
      ko: '로그인',
      en: 'Log In'
    }
  },

  SESSION_EXPIRED: {
    ko: '세션이 만료되었습니다',
    en: 'Session expired',
    suggestion: {
      ko: '다시 로그인해주세요',
      en: 'Please log in again'
    },
    action: {
      ko: '다시 로그인',
      en: 'Log In Again'
    }
  },

  INVALID_CREDENTIALS: {
    ko: '잘못된 로그인 정보입니다',
    en: 'Invalid credentials',
    suggestion: {
      ko: '이메일과 비밀번호를 다시 확인해주세요',
      en: 'Please check your email and password'
    },
    action: {
      ko: '다시 입력',
      en: 'Try Again'
    }
  }
};

// AI 생성 관련 에러
export const AI_ERRORS: Record<string, DetailedErrorMessage> = {
  GENERATION_FAILED: {
    ko: '이미지 생성에 실패했습니다',
    en: 'Image generation failed',
    suggestion: {
      ko: '프롬프트를 수정하거나 잠시 후 다시 시도해주세요',
      en: 'Please modify your prompt or try again later'
    },
    action: {
      ko: '다시 생성',
      en: 'Generate Again'
    }
  },

  INSUFFICIENT_TOKENS: {
    ko: '토큰이 부족합니다',
    en: 'Insufficient tokens',
    suggestion: {
      ko: '토큰을 구매하거나 충전해주세요',
      en: 'Please purchase or add more tokens'
    },
    action: {
      ko: '토큰 구매',
      en: 'Buy Tokens'
    }
  },

  PROMPT_TOO_LONG: {
    ko: '프롬프트가 너무 깁니다',
    en: 'Prompt is too long',
    suggestion: {
      ko: '프롬프트를 더 짧게 작성해주세요',
      en: 'Please make your prompt shorter'
    },
    action: {
      ko: '프롬프트 수정',
      en: 'Edit Prompt'
    }
  },

  UNSAFE_CONTENT: {
    ko: '부적절한 콘텐츠가 감지되었습니다',
    en: 'Inappropriate content detected',
    suggestion: {
      ko: '프롬프트를 수정해주세요',
      en: 'Please modify your prompt'
    },
    action: {
      ko: '프롬프트 변경',
      en: 'Change Prompt'
    }
  }
};

// 저장소 관련 에러
export const STORAGE_ERRORS: Record<string, DetailedErrorMessage> = {
  STORAGE_FULL: {
    ko: '저장 공간이 부족합니다',
    en: 'Storage space is full',
    suggestion: {
      ko: '일부 이미지를 삭제하거나 계정을 업그레이드해주세요',
      en: 'Please delete some images or upgrade your account'
    },
    action: {
      ko: '갤러리 정리',
      en: 'Clean Gallery'
    }
  },

  SAVE_FAILED: {
    ko: '저장에 실패했습니다',
    en: 'Failed to save',
    suggestion: {
      ko: '다시 시도하거나 저장 공간을 확인해주세요',
      en: 'Please try again or check your storage space'
    },
    action: {
      ko: '다시 저장',
      en: 'Save Again'
    }
  },

  LOAD_FAILED: {
    ko: '불러오기에 실패했습니다',
    en: 'Failed to load',
    suggestion: {
      ko: '파일이 손상되었거나 삭제되었을 수 있습니다',
      en: 'The file may be corrupted or deleted'
    },
    action: {
      ko: '다시 시도',
      en: 'Try Again'
    }
  }
};

// 압축 관련 에러
export const COMPRESSION_ERRORS: Record<string, DetailedErrorMessage> = {
  COMPRESSION_FAILED: {
    ko: '이미지 압축에 실패했습니다',
    en: 'Image compression failed',
    suggestion: {
      ko: '이미지 파일을 확인하고 다시 시도해주세요',
      en: 'Please check the image file and try again'
    },
    action: {
      ko: '다시 압축',
      en: 'Compress Again'
    }
  },

  UNSUPPORTED_FORMAT: {
    ko: '지원하지 않는 이미지 형식입니다',
    en: 'Unsupported image format',
    suggestion: {
      ko: 'JPG, PNG, WebP 형식의 이미지를 사용해주세요',
      en: 'Please use JPG, PNG, or WebP format images'
    },
    action: {
      ko: '다른 이미지 선택',
      en: 'Choose Another Image'
    }
  },

  FILE_TOO_LARGE: {
    ko: '파일 크기가 너무 큽니다',
    en: 'File size is too large',
    suggestion: {
      ko: '더 작은 크기의 이미지를 사용해주세요',
      en: 'Please use a smaller image'
    },
    action: {
      ko: '다른 이미지 선택',
      en: 'Choose Another Image'
    }
  }
};

// 결제 관련 에러
export const PAYMENT_ERRORS: Record<string, DetailedErrorMessage> = {
  PAYMENT_FAILED: {
    ko: '결제에 실패했습니다',
    en: 'Payment failed',
    suggestion: {
      ko: '결제 정보를 확인하고 다시 시도해주세요',
      en: 'Please check your payment information and try again'
    },
    action: {
      ko: '다시 결제',
      en: 'Try Payment Again'
    }
  },

  CARD_DECLINED: {
    ko: '카드 결제가 거절되었습니다',
    en: 'Card payment declined',
    suggestion: {
      ko: '다른 카드를 사용하거나 은행에 문의해주세요',
      en: 'Please use a different card or contact your bank'
    },
    action: {
      ko: '다른 결제 수단',
      en: 'Try Another Payment Method'
    }
  },

  INSUFFICIENT_FUNDS: {
    ko: '잔액이 부족합니다',
    en: 'Insufficient funds',
    suggestion: {
      ko: '계좌 잔액을 확인하고 다시 시도해주세요',
      en: 'Please check your account balance and try again'
    },
    action: {
      ko: '다른 결제 수단',
      en: 'Try Another Payment Method'
    }
  }
};

// 일반적인 에러
export const GENERAL_ERRORS: Record<string, DetailedErrorMessage> = {
  UNKNOWN_ERROR: {
    ko: '알 수 없는 오류가 발생했습니다',
    en: 'An unknown error occurred',
    suggestion: {
      ko: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요',
      en: 'Please refresh the page or try again later'
    },
    action: {
      ko: '새로고침',
      en: 'Refresh'
    }
  },

  VALIDATION_ERROR: {
    ko: '입력값이 올바르지 않습니다',
    en: 'Invalid input',
    suggestion: {
      ko: '입력 내용을 다시 확인해주세요',
      en: 'Please check your input'
    },
    action: {
      ko: '다시 입력',
      en: 'Try Again'
    }
  },

  RATE_LIMIT_EXCEEDED: {
    ko: '요청 한도를 초과했습니다',
    en: 'Rate limit exceeded',
    suggestion: {
      ko: '잠시 후 다시 시도해주세요',
      en: 'Please try again later'
    },
    action: {
      ko: '잠시 대기',
      en: 'Wait a Moment'
    }
  }
};

// 모든 에러 메시지를 하나로 통합
export const ERROR_MESSAGES = {
  ...NETWORK_ERRORS,
  ...AUTH_ERRORS,
  ...AI_ERRORS,
  ...STORAGE_ERRORS,
  ...COMPRESSION_ERRORS,
  ...PAYMENT_ERRORS,
  ...GENERAL_ERRORS,
};

// 에러 메시지 조회 헬퍼 함수
export const getErrorMessage = (
  errorCode: string,
  language: 'ko' | 'en' = 'en'
): DetailedErrorMessage => {
  const errorMessage = ERROR_MESSAGES[errorCode];

  if (!errorMessage) {
    return GENERAL_ERRORS.UNKNOWN_ERROR;
  }

  return errorMessage;
};

// 에러 메시지 텍스트만 조회하는 헬퍼
export const getErrorText = (
  errorCode: string,
  language: 'ko' | 'en' = 'en'
): string => {
  const errorMessage = getErrorMessage(errorCode, language);
  return errorMessage[language];
};

// 제안 메시지 조회 헬퍼
export const getErrorSuggestion = (
  errorCode: string,
  language: 'ko' | 'en' = 'en'
): string | undefined => {
  const errorMessage = getErrorMessage(errorCode, language);
  return errorMessage.suggestion?.[language];
};

// 액션 버튼 텍스트 조회 헬퍼
export const getErrorAction = (
  errorCode: string,
  language: 'ko' | 'en' = 'en'
): string | undefined => {
  const errorMessage = getErrorMessage(errorCode, language);
  return errorMessage.action?.[language];
};