import { useState, useCallback, useRef } from 'react';
import {
  compressionService,
  CompressionOptions,
  CompressionResult,
  ThumbnailOptions
} from '../services/compressionService';

export interface UseImageCompressionReturn {
  // 상태
  isCompressing: boolean;
  compressionProgress: number;
  error: string | null;
  results: CompressionResult[];

  // 함수
  compress: (files: File | File[], options?: CompressionOptions) => Promise<CompressionResult[]>;
  generateThumbnail: (file: File, options?: ThumbnailOptions) => Promise<CompressionResult>;
  optimizeFileSize: (file: File, maxSizeKB: number) => Promise<CompressionResult>;
  clearResults: () => void;
  clearError: () => void;

  // 유틸리티
  formatFileSize: (bytes: number) => string;
  isSupported: (file: File) => boolean;
}

export const useImageCompression = (): UseImageCompressionReturn => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompressionResult[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setCompressionProgress(0);
  }, []);

  const compress = useCallback(async (
    files: File | File[],
    options?: CompressionOptions
  ): Promise<CompressionResult[]> => {
    const fileArray = Array.isArray(files) ? files : [files];

    // 빈 파일 배열 체크
    if (fileArray.length === 0) {
      throw new Error('압축할 파일이 없습니다');
    }

    // 지원되지 않는 파일 형식 체크
    const unsupportedFiles = fileArray.filter(file => !compressionService.isImageFormatSupported(file));
    if (unsupportedFiles.length > 0) {
      const unsupportedNames = unsupportedFiles.map(f => f.name).join(', ');
      throw new Error(`지원되지 않는 파일 형식입니다: ${unsupportedNames}`);
    }

    setIsCompressing(true);
    setError(null);
    setCompressionProgress(0);

    // AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      const compressionResults: CompressionResult[] = [];

      if (fileArray.length === 1) {
        // 단일 파일 압축
        const result = await compressionService.compressImage(fileArray[0], options);
        compressionResults.push(result);
        setCompressionProgress(100);
      } else {
        // 다중 파일 압축
        const results = await compressionService.compressMultiple(
          fileArray,
          options,
          (completed, total) => {
            const progress = Math.round((completed / total) * 100);
            setCompressionProgress(progress);

            // AbortController로 취소 체크
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('압축이 취소되었습니다');
            }
          }
        );
        compressionResults.push(...results);
      }

      setResults(prev => [...prev, ...compressionResults]);
      return compressionResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCompressing(false);
      abortControllerRef.current = null;
    }
  }, []);

  const generateThumbnail = useCallback(async (
    file: File,
    options?: ThumbnailOptions
  ): Promise<CompressionResult> => {
    if (!compressionService.isImageFormatSupported(file)) {
      throw new Error(`지원되지 않는 파일 형식입니다: ${file.name}`);
    }

    setIsCompressing(true);
    setError(null);
    setCompressionProgress(0);

    try {
      setCompressionProgress(50);
      const result = await compressionService.generateThumbnail(file, options);
      setCompressionProgress(100);

      setResults(prev => [...prev, result]);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '썸네일 생성에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const optimizeFileSize = useCallback(async (
    file: File,
    maxSizeKB: number
  ): Promise<CompressionResult> => {
    if (!compressionService.isImageFormatSupported(file)) {
      throw new Error(`지원되지 않는 파일 형식입니다: ${file.name}`);
    }

    if (maxSizeKB <= 0) {
      throw new Error('목표 파일 크기는 0보다 커야 합니다');
    }

    setIsCompressing(true);
    setError(null);
    setCompressionProgress(0);

    try {
      // 진행률을 시뮬레이션 (실제 압축은 여러 단계로 이뤄짐)
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const result = await compressionService.optimizeFileSize(file, maxSizeKB);

      clearInterval(progressInterval);
      setCompressionProgress(100);

      setResults(prev => [...prev, result]);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '파일 크기 최적화에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // 유틸리티 함수들
  const formatFileSize = useCallback((bytes: number): string => {
    return compressionService.formatFileSize(bytes);
  }, []);

  const isSupported = useCallback((file: File): boolean => {
    return compressionService.isImageFormatSupported(file);
  }, []);

  return {
    // 상태
    isCompressing,
    compressionProgress,
    error,
    results,

    // 함수
    compress,
    generateThumbnail,
    optimizeFileSize,
    clearResults,
    clearError,

    // 유틸리티
    formatFileSize,
    isSupported
  };
};

export default useImageCompression;