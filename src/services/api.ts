import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '../lib/supabase';

// API 기본 설정
const API_BASE_URL = 'http://localhost:3001/api';

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃 (이미지 생성은 시간이 오래 걸릴 수 있음)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Supabase에서 현재 세션의 액세스 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Failed to get session token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 핸들링
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized: 토큰 만료 또는 인증 실패
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !session?.access_token) {
          // 리프레시 실패 시 로그아웃
          await supabase.auth.signOut();
          // 로그인 페이지로 리디렉션 또는 인증 상태 업데이트
          window.location.reload();
          return Promise.reject(error);
        }

        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await supabase.auth.signOut();
        window.location.reload();
        return Promise.reject(error);
      }
    }

    // 기타 에러 처리
    if (error.response) {
      // 서버에서 응답한 에러
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // 네트워크 에러
      console.error('Network Error:', error.message);
    } else {
      // 기타 에러
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 공통 API 요청 함수들
export const apiRequest = {
  // GET 요청
  get: async <T = any>(url: string, params?: any): Promise<T> => {
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  // POST 요청
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post(url, data);
    return response.data;
  },

  // POST 요청 (FormData)
  postFormData: async <T = any>(url: string, formData: FormData): Promise<T> => {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // PUT 요청
  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put(url, data);
    return response.data;
  },

  // DELETE 요청
  delete: async <T = any>(url: string): Promise<T> => {
    const response = await apiClient.delete(url);
    return response.data;
  },
};

// 특정 API 엔드포인트 함수들
export const generationApi = {
  // 이미지 생성
  generate: async (formData: FormData) => {
    return apiRequest.postFormData('/generation/generate', formData);
  },

  // 프롬프트 제안
  suggest: async (formData: FormData) => {
    return apiRequest.postFormData('/generation/suggest', formData);
  },

  // 생성 히스토리 조회
  getHistory: async (userId: string, limit = 20, offset = 0) => {
    return apiRequest.get(`/generation/history/${userId}`, { limit, offset });
  },

  // 생성 히스토리 삭제
  deleteHistory: async (generationId: string) => {
    return apiRequest.delete(`/generation/history/${generationId}`);
  },
};

export const tokenApi = {
  // 토큰 잔액 조회
  getBalance: async () => {
    return apiRequest.get('/user/tokens');
  },

  // 토큰 패키지 목록
  getPackages: async () => {
    return apiRequest.get('/tokens/packages');
  },

  // 토큰 사용 내역
  getHistory: async (limit = 50, offset = 0) => {
    return apiRequest.get('/user/tokens/history', { limit, offset });
  },

  // 토큰 구매
  purchase: async (packageId: string, paymentData: any) => {
    return apiRequest.post('/tokens/purchase', { packageId, ...paymentData });
  },
};

export const authApi = {
  // 사용자 정보 조회
  getProfile: async () => {
    return apiRequest.get('/user/profile');
  },

  // 프로필 업데이트
  updateProfile: async (data: any) => {
    return apiRequest.put('/user/profile', data);
  },
};

export default apiClient;