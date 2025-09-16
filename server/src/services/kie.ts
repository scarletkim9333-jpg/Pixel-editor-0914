import axios from 'axios';
import FormData from 'form-data';

const KIE_API_KEY = process.env.KIE_API_KEY;

if (!KIE_API_KEY) {
  throw new Error('KIE_API_KEY is required');
}

interface NanoBananaEditParams {
  guidance_scale?: number;
  strength?: number;
  steps?: number;
  seed?: number;
  outputFormat?: string;
  imageSize?: string;
}

interface NanoBananaUpscaleParams {
  scale?: number;
  steps?: number;
  seed?: number;
  outputFormat?: string;
  imageSize?: string;
}

interface SeedreamEditParams {
  guidance_scale?: number;
  strength?: number;
  steps?: number;
  seed?: number;
  style?: string;
  resolution?: string;
  outputFormat?: string;
  imageSize?: string;
}

interface TaskStatus {
  state: 'pending' | 'running' | 'success' | 'fail';
  resultJson?: string;
  failMsg?: string;
  progress?: number;
}

class KieService {
  private apiKey: string;
  private baseURL = 'https://api.kie.ai/api/v1';

  constructor() {
    this.apiKey = KIE_API_KEY!;
  }

  /**
   * 이미지 업로드 메소드
   */
  async uploadImage(imageBuffer: Buffer): Promise<string> {
    try {
      // KIE AI 파일 업로드 엔드포인트 사용
      const formData = new FormData();
      formData.append('file', imageBuffer, 'image.png');

      const response = await axios.post(
        `${this.baseURL}/files/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 30000, // 30초 타임아웃
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('KIE Image upload failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`KIE Upload Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * 태스크 생성
   */
  async createTask(model: string, imageUrl: string, prompt: string, params: any): Promise<string> {
    try {
      const payload = {
        model,
        callBackUrl: process.env.CALLBACK_URL, // 옵션
        input: {
          image: imageUrl,
          prompt: prompt || undefined,
          output_format: params.outputFormat || 'png',
          image_size: params.imageSize || 'auto',
          ...params
        }
      };

      const response = await axios.post(
        `${this.baseURL}/jobs/createTask`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000,
        }
      );

      return response.data.data.taskId;
    } catch (error) {
      console.error('KIE Create task failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`KIE Create Task Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * 태스크 상태 확인
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const response = await axios.get(
        `${this.baseURL}/jobs/queryTask?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000,
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('KIE Get task status failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`KIE Status Error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * 폴링으로 완료 대기
   */
  async waitForCompletion(taskId: string, maxAttempts = 60): Promise<any> {
    console.log(`Starting polling for task ${taskId}, max attempts: ${maxAttempts}`);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await this.getTaskStatus(taskId);

        console.log(`Attempt ${i + 1}/${maxAttempts} - Task ${taskId} status: ${status.state}`);

        if (status.state === 'success') {
          if (!status.resultJson) {
            throw new Error('Task completed but no result data');
          }
          return JSON.parse(status.resultJson);
        }

        if (status.state === 'fail') {
          throw new Error(status.failMsg || 'Task failed');
        }

        // 2초 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);

        // 마지막 시도가 아니면 계속 진행
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        throw error;
      }
    }

    throw new Error('Task timeout - exceeded maximum polling attempts');
  }

  /**
   * Base64를 Buffer로 변환
   */
  private base64ToBuffer(base64: string): Buffer {
    // data URL prefix 제거
    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(cleanBase64, 'base64');
  }

  /**
   * NanoBanana 모델로 이미지 편집
   */
  async nanoBananaEdit(imageBase64: string, prompt: string, params: NanoBananaEditParams = {}): Promise<string[]> {
    try {
      const imageBuffer = this.base64ToBuffer(imageBase64);
      const imageUrl = await this.uploadImage(imageBuffer);

      const taskParams = {
        guidance_scale: params.guidance_scale || 7.5,
        strength: params.strength || 0.7,
        steps: params.steps || 20,
        seed: params.seed || Math.floor(Math.random() * 1000000),
        outputFormat: params.outputFormat || 'png',
        imageSize: params.imageSize || 'auto'
      };

      const taskId = await this.createTask('google/nano-banana-edit', imageUrl, prompt, taskParams);
      const result = await this.waitForCompletion(taskId);

      // 결과에서 이미지 URL들 추출
      if (result && result.images && Array.isArray(result.images)) {
        return result.images;
      }

      // 단일 이미지인 경우
      if (result && result.image) {
        return [result.image];
      }

      throw new Error('No images in result');
    } catch (error) {
      console.error('NanoBanana Edit failed:', error);
      throw error;
    }
  }

  /**
   * NanoBanana 모델로 이미지 업스케일
   */
  async nanoBananaUpscale(imageBase64: string, params: NanoBananaUpscaleParams = {}): Promise<string[]> {
    try {
      const imageBuffer = this.base64ToBuffer(imageBase64);
      const imageUrl = await this.uploadImage(imageBuffer);

      const taskParams = {
        scale: params.scale || 2,
        steps: params.steps || 20,
        seed: params.seed || Math.floor(Math.random() * 1000000),
        outputFormat: params.outputFormat || 'png',
        imageSize: params.imageSize || 'auto'
      };

      const taskId = await this.createTask('nano-banana-upscale', imageUrl, '', taskParams);
      const result = await this.waitForCompletion(taskId);

      if (result && result.images && Array.isArray(result.images)) {
        return result.images;
      }

      if (result && result.image) {
        return [result.image];
      }

      throw new Error('No images in result');
    } catch (error) {
      console.error('NanoBanana Upscale failed:', error);
      throw error;
    }
  }

  /**
   * Seedream 모델로 이미지 편집
   */
  async seedreamEdit(imageBase64: string, prompt: string, params: SeedreamEditParams = {}): Promise<string[]> {
    try {
      const imageBuffer = this.base64ToBuffer(imageBase64);
      const imageUrl = await this.uploadImage(imageBuffer);

      const taskParams = {
        guidance_scale: params.guidance_scale || 8.0,
        strength: params.strength || 0.8,
        steps: params.steps || 25,
        seed: params.seed || Math.floor(Math.random() * 1000000),
        style: params.style || 'realistic',
        image_size: params.resolution || '4k',
        outputFormat: params.outputFormat || 'png'
      };

      const taskId = await this.createTask('bytedance/seedream-v4-edit', imageUrl, prompt, taskParams);
      const result = await this.waitForCompletion(taskId);

      if (result && result.images && Array.isArray(result.images)) {
        return result.images;
      }

      if (result && result.image) {
        return [result.image];
      }

      throw new Error('No images in result');
    } catch (error) {
      console.error('Seedream Edit failed:', error);
      throw error;
    }
  }
}

export const kieService = new KieService();