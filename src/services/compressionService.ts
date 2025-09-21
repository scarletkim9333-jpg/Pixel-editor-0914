/**
 * 이미지 압축 서비스
 * JPEG 변환, 썸네일 생성, 파일 크기 최적화를 제공합니다.
 */

export interface CompressionOptions {
  quality?: number; // 1-100 (기본값: 85)
  maxWidth?: number; // 최대 너비 (기본값: 제한없음)
  maxHeight?: number; // 최대 높이 (기본값: 제한없음)
  format?: 'jpeg' | 'png'; // 출력 포맷 (기본값: jpeg)
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  dimensions: { width: number; height: number };
}

export interface ThumbnailOptions {
  size: number; // 썸네일 크기 (기본값: 200)
  quality?: number; // 품질 (기본값: 80)
}

class CompressionService {
  private readonly DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';
  private readonly DEFAULT_QUALITY = parseInt(import.meta.env.VITE_COMPRESSION_QUALITY || '85');
  private readonly DEFAULT_THUMBNAIL_SIZE = parseInt(import.meta.env.VITE_THUMBNAIL_SIZE || '200');

  /**
   * 이미지를 JPEG 포맷으로 압축합니다
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      quality = this.DEFAULT_QUALITY,
      maxWidth,
      maxHeight,
      format = 'jpeg'
    } = options;

    if (this.DEBUG) {
      console.log('압축 시작:', {
        fileName: file.name,
        originalSize: file.size,
        options
      });
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다');
      }

      // 이미지 로드
      const img = await this.loadImage(file);
      const originalDimensions = { width: img.width, height: img.height };

      // 크기 계산
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      // 캔버스 설정
      canvas.width = width;
      canvas.height = height;

      // 고품질 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 변환
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await this.canvasToBlob(canvas, mimeType, quality / 100);

      // 압축된 파일 생성
      const compressedFile = new File(
        [blob],
        this.getCompressedFileName(file.name, format),
        { type: mimeType }
      );

      const result: CompressionResult = {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: blob.size,
        compressionRatio: Math.round((1 - blob.size / file.size) * 100),
        quality,
        dimensions: { width, height }
      };

      if (this.DEBUG) {
        console.log('압축 완료:', result);
      }

      return result;

    } catch (error) {
      console.error('이미지 압축 실패:', error);
      throw new Error(`이미지 압축에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 썸네일을 생성합니다
   */
  async generateThumbnail(
    file: File,
    options: ThumbnailOptions = {}
  ): Promise<CompressionResult> {
    const { size = this.DEFAULT_THUMBNAIL_SIZE, quality = 80 } = options;

    return this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'jpeg'
    });
  }

  /**
   * 파일 크기를 목표 크기로 최적화합니다
   */
  async optimizeFileSize(
    file: File,
    maxSizeKB: number
  ): Promise<CompressionResult> {
    const targetSize = maxSizeKB * 1024;
    let quality = this.DEFAULT_QUALITY;
    let result: CompressionResult;

    // 품질을 점진적으로 낮춰가며 목표 크기에 맞춤
    for (let attempt = 0; attempt < 5; attempt++) {
      result = await this.compressImage(file, { quality });

      if (result.compressedSize <= targetSize || quality <= 20) {
        break;
      }

      quality = Math.max(20, quality - 15);
    }

    if (this.DEBUG) {
      console.log(`파일 크기 최적화 완료: ${result!.compressedSize} bytes (목표: ${targetSize} bytes)`);
    }

    return result!;
  }

  /**
   * 다중 이미지를 일괄 압축합니다
   */
  async compressMultiple(
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.compressImage(files[i], options);
        results.push(result);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`파일 ${files[i].name} 압축 실패:`, error);
        throw error;
      }
    }

    return results;
  }

  // Private helper methods

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob 변환에 실패했습니다'));
          }
        },
        type,
        quality
      );
    });
  }

  private getCompressedFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = format === 'png' ? 'png' : 'jpg';
    return `${nameWithoutExt}_compressed.${extension}`;
  }

  /**
   * 이미지 포맷 지원 여부를 확인합니다
   */
  isImageFormatSupported(file: File): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
      'image/gif'
    ];
    return supportedTypes.includes(file.type);
  }

  /**
   * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 디버깅용 - window 객체에 서비스 노출
   */
  exposeToWindow() {
    if (this.DEBUG && typeof window !== 'undefined') {
      (window as any).compressionService = this;
      console.log('compressionService가 window.compressionService로 노출되었습니다');
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const compressionService = new CompressionService();

// 디버깅 모드에서 window에 노출
compressionService.exposeToWindow();

export default compressionService;