import { supabase } from '../lib/supabase';
import { kieService } from './kie';
import { falService } from './fal';

// 토큰 비용 상수
const TOKEN_COSTS = {
  NANOBANANA: parseInt(process.env.TOKEN_COST_NANOBANANA || '2'),
  NANOBANANA_UPSCALE: parseInt(process.env.TOKEN_COST_NANOBANANA_UPSCALE || '1'),
  SEEDREAM: parseInt(process.env.TOKEN_COST_SEEDREAM || '4'),
  TOPAZ_UPSCALE: parseInt(process.env.TOKEN_COST_TOPAZ_UPSCALE || '5'),
};

export type ProcessingModel = 'nanobanana' | 'nanobanana-upscale' | 'seedream' | 'topaz-upscale';

export interface ImageProcessRequest {
  model: ProcessingModel;
  imageBase64: string;
  imageBuffer?: Buffer;
  prompt?: string;
  params?: any;
  scale?: number;
}

export interface ProcessingResult {
  success: boolean;
  images: string[];
  tokensUsed: number;
  model: string;
  processingTime: number;
  error?: string;
}

class ImageProcessorService {
  /**
   * 사용자 토큰 잔액 확인
   */
  private async getTokenBalance(userId: string): Promise<number> {
    const { data: userTokens, error } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Failed to check user token balance');
    }

    return userTokens?.balance || 0;
  }

  /**
   * 토큰 차감 처리 (트랜잭션 지원)
   */
  private async deductTokens(userId: string, amount: number, description: string): Promise<void> {
    const { data, error } = await supabase.rpc('use_tokens', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) {
      throw new Error('Failed to deduct tokens');
    }

    if (!data) {
      throw new Error('Insufficient token balance');
    }

    // 사용 내역 기록
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description
      });

    if (transactionError) {
      console.error('Failed to record token transaction:', transactionError);
    }
  }

  /**
   * 모델별 토큰 비용 계산
   */
  private calculateTokens(model: ProcessingModel): number {
    switch (model) {
      case 'nanobanana':
        return TOKEN_COSTS.NANOBANANA;
      case 'nanobanana-upscale':
        return TOKEN_COSTS.NANOBANANA_UPSCALE;
      case 'seedream':
        return TOKEN_COSTS.SEEDREAM;
      case 'topaz-upscale':
        return TOKEN_COSTS.TOPAZ_UPSCALE;
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  /**
   * 모델별 이미지 처리 실행
   */
  private async executeProcessing(request: ImageProcessRequest): Promise<string[]> {
    const { model, imageBase64, prompt, params } = request;

    switch (model) {
      case 'nanobanana':
        if (!prompt) {
          throw new Error('Prompt is required for NanoBanana editing');
        }
        return await kieService.nanoBananaEdit(imageBase64, prompt, params);

      case 'nanobanana-upscale':
        return await kieService.nanoBananaUpscale(imageBase64, params);

      case 'seedream':
        if (!prompt) {
          throw new Error('Prompt is required for Seedream editing');
        }
        return await kieService.seedreamEdit(imageBase64, prompt, params);

      case 'topaz-upscale':
        const scale = params?.scale || 2;
        return await falService.topazUpscale(imageBase64, scale, params);

      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  /**
   * 생성 히스토리 저장
   */
  private async saveGenerationHistory(
    userId: string,
    request: ImageProcessRequest,
    result: any,
    taskId?: string
  ): Promise<void> {
    try {
      const historyData = {
        user_id: userId,
        prompt: request.prompt || `${request.model} processing`,
        model: request.model,
        images: result.images || [],
        tokens_used: this.calculateTokens(request.model),
        settings: {
          model: request.model,
          params: request.params,
          task_id: taskId, // KIE AI taskId 저장
          processing_time: Date.now()
        },
        status: result.success !== false ? 'processing' : 'failed',
        error_message: result.error || null
      };

      const { error } = await supabase
        .from('generation_history')
        .insert(historyData);

      if (error) {
        console.error('Failed to save generation history:', error);
      }
    } catch (error) {
      console.error('Failed to save generation history:', error);
    }
  }

  /**
   * 통합 이미지 처리 메인 함수 (트랜잭션 기반)
   */
  async processImage(
    request: ImageProcessRequest,
    userId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. 토큰 잔액 확인
      const balance = await this.getTokenBalance(userId);
      const requiredTokens = this.calculateTokens(request.model);

      if (balance < requiredTokens) {
        throw new Error('토큰이 부족합니다');
      }

      // 2. 트랜잭션 시작 (Supabase는 자동 트랜잭션 처리)
      let taskId: string | undefined;

      try {
        // 3. 토큰 차감
        await this.deductTokens(
          userId,
          requiredTokens,
          `${request.model} processing: ${request.prompt?.substring(0, 50) || 'Image processing'}...`
        );

        // 4. API 호출
        let result;
        switch (request.model) {
          case 'nanobanana':
            if (!request.prompt) {
              throw new Error('Prompt is required for NanoBanana editing');
            }
            // KIE AI는 비동기 처리이므로 taskId 반환
            result = await kieService.nanoBananaEdit(
              request.imageBase64,
              request.prompt,
              request.params
            );
            break;

          case 'nanobanana-upscale':
            result = await kieService.nanoBananaUpscale(
              request.imageBase64,
              request.params
            );
            break;

          case 'seedream':
            if (!request.prompt) {
              throw new Error('Prompt is required for Seedream editing');
            }
            result = await kieService.seedreamEdit(
              request.imageBase64,
              request.prompt,
              request.params
            );
            break;

          case 'topaz-upscale':
            result = await falService.topazUpscale(
              request.imageBase64,
              request.scale || 2,
              request.params
            );
            break;

          default:
            throw new Error(`Unsupported model: ${request.model}`);
        }

        const processingTime = Date.now() - startTime;

        const processResult: ProcessingResult = {
          success: true,
          images: result || [],
          tokensUsed: requiredTokens,
          model: request.model,
          processingTime
        };

        // 5. 결과 저장
        await this.saveGenerationHistory(userId, request, processResult, taskId);

        return processResult;

      } catch (apiError) {
        // API 실패시 토큰 환불
        console.error('API 호출 실패, 토큰 환불 시도:', apiError);

        try {
          await supabase.rpc('add_tokens', {
            p_user_id: userId,
            p_amount: requiredTokens,
            p_type: 'refund',
            p_description: `환불: ${request.model} 처리 실패`,
            p_reference_id: null
          });
          console.log('토큰 환불 완료');
        } catch (refundError) {
          console.error('토큰 환불 실패:', refundError);
        }

        throw apiError;
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      console.error('Image processing failed:', error);

      // 실패 결과 저장
      const failResult: ProcessingResult = {
        success: false,
        images: [],
        tokensUsed: 0, // 환불되었으므로 0
        model: request.model,
        processingTime,
        error: errorMessage
      };

      await this.saveGenerationHistory(userId, request, failResult);

      throw new Error(errorMessage);
    }
  }

  /**
   * 지원되는 모델 목록 조회
   */
  getSupportedModels(): Array<{
    id: ProcessingModel;
    name: string;
    description: string;
    tokenCost: number;
    requiresPrompt: boolean;
  }> {
    return [
      {
        id: 'nanobanana',
        name: 'NanoBanana Edit',
        description: 'AI-powered image editing with prompts',
        tokenCost: this.calculateTokens('nanobanana'),
        requiresPrompt: true
      },
      {
        id: 'nanobanana-upscale',
        name: 'NanoBanana Upscale',
        description: 'High-quality image upscaling',
        tokenCost: this.calculateTokens('nanobanana-upscale'),
        requiresPrompt: false
      },
      {
        id: 'seedream',
        name: 'Seedream Edit',
        description: 'Advanced AI image generation and editing',
        tokenCost: this.calculateTokens('seedream'),
        requiresPrompt: true
      },
      {
        id: 'topaz-upscale',
        name: 'Topaz Upscale',
        description: 'Professional-grade image upscaling',
        tokenCost: this.calculateTokens('topaz-upscale'),
        requiresPrompt: false
      }
    ];
  }
}

export const imageProcessor = new ImageProcessorService();