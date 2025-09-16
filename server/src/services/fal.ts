import axios from 'axios';

const FAL_API_BASE = 'https://fal.run/fal-ai';
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!FAL_API_KEY) {
  throw new Error('FAL_API_KEY is required');
}

interface FalResponse {
  request_id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  images?: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

interface TopazUpscaleParams {
  scale?: number;
  face_enhance?: boolean;
  codeformer_fidelity?: number;
}

class FalService {
  private async makeRequest(endpoint: string, data: any): Promise<FalResponse> {
    try {
      const response = await axios.post(`${FAL_API_BASE}${endpoint}`, data, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2분 타임아웃
      });

      return response.data;
    } catch (error) {
      console.error('Fal.ai API request failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Fal.ai API Error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  private async pollResult(requestId: string, maxAttempts = 60): Promise<FalResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${FAL_API_BASE}/queue/requests/${requestId}/status`, {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
          },
        });

        const result: FalResponse = response.data;

        if (result.status === 'COMPLETED') {
          return result;
        }

        if (result.status === 'FAILED') {
          throw new Error(result.error?.message || 'Task failed');
        }

        // 2초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Polling timeout - task did not complete');
  }

  private async downloadImageAsBase64(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers['content-type'] || 'image/png';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw new Error('Failed to download generated image');
    }
  }

  /**
   * Topaz 모델로 이미지 업스케일
   */
  async topazUpscale(
    imageBase64: string,
    scale: number = 2,
    params: TopazUpscaleParams = {}
  ): Promise<string[]> {
    try {
      // Base64에서 data URL prefix 제거
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const requestData = {
        image: cleanBase64,
        scale: Math.min(Math.max(scale, 1), 4), // 1-4 사이로 제한
        face_enhance: params.face_enhance || false,
        codeformer_fidelity: params.codeformer_fidelity || 0.7,
      };

      // Topaz Gigapixel AI 모델 사용
      const response = await this.makeRequest('/topaz-photo-ai', requestData);

      let result: FalResponse;

      if (response.status === 'COMPLETED' && response.images) {
        result = response;
      } else if (response.request_id) {
        // 비동기 처리인 경우 polling
        result = await this.pollResult(response.request_id);
      } else {
        throw new Error('No request ID received');
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images generated');
      }

      // 이미지 URL들을 Base64로 변환
      const base64Images: string[] = [];
      for (const image of result.images) {
        const base64Image = await this.downloadImageAsBase64(image.url);
        base64Images.push(base64Image);
      }

      return base64Images;
    } catch (error) {
      console.error('Topaz Upscale failed:', error);
      throw error;
    }
  }

  /**
   * 일반적인 Real-ESRGAN 업스케일 (Topaz 대안)
   */
  async realEsrganUpscale(
    imageBase64: string,
    scale: number = 2
  ): Promise<string[]> {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const requestData = {
        image: cleanBase64,
        scale: Math.min(Math.max(scale, 1), 4),
        face_enhance: true,
      };

      const response = await this.makeRequest('/real-esrgan', requestData);

      let result: FalResponse;

      if (response.status === 'COMPLETED' && response.images) {
        result = response;
      } else if (response.request_id) {
        result = await this.pollResult(response.request_id);
      } else {
        throw new Error('No request ID received');
      }

      if (!result.images || result.images.length === 0) {
        throw new Error('No images generated');
      }

      const base64Images: string[] = [];
      for (const image of result.images) {
        const base64Image = await this.downloadImageAsBase64(image.url);
        base64Images.push(base64Image);
      }

      return base64Images;
    } catch (error) {
      console.error('Real-ESRGAN Upscale failed:', error);
      throw error;
    }
  }
}

export const falService = new FalService();