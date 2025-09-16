import { Router, Request, Response } from 'express';
import multer from 'multer';
import { imageProcessor, type ProcessingModel } from '../services/imageProcessor';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { supabase } from '../lib/supabase';

const router = Router();

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

router.post('/generate',
  authMiddleware,
  rateLimitMiddleware,
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        model,
        creativity,
        numberOfOutputs,
        aspectRatio,
        resolution,
        selectedPresets,
        selectedPresetOptionIds
      } = req.body;

      // 필수 필드 검증
      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }

      // 모델 검증
      const validModels: ProcessingModel[] = ['nanobanana', 'nanobanana-upscale', 'seedream', 'topaz-upscale'];
      if (!validModels.includes(model as ProcessingModel)) {
        return res.status(400).json({ error: `Invalid model. Valid models: ${validModels.join(', ')}` });
      }

      // 프롬프트 필요한 모델 검증
      const promptRequiredModels: ProcessingModel[] = ['nanobanana', 'seedream'];
      if (promptRequiredModels.includes(model) && !prompt) {
        return res.status(400).json({ error: `Prompt is required for model: ${model}` });
      }

      // 파일 처리
      const files = req.files as Express.Multer.File[];
      const mainImageFile = files?.find(f => f.fieldname === 'image');

      if (!mainImageFile) {
        return res.status(400).json({ error: 'Main image is required' });
      }

      // 이미지를 base64로 변환
      const imageBase64 = mainImageFile.buffer.toString('base64');

      // 처리 요청 생성
      const processingRequest = {
        model: model as ProcessingModel,
        imageBase64,
        imageBuffer: mainImageFile.buffer,
        prompt: prompt || undefined,
        params: {
          creativity: creativity ? parseFloat(creativity) : 0.7,
          numberOfOutputs: numberOfOutputs ? parseInt(numberOfOutputs) : 1,
          aspectRatio: aspectRatio || '1:1',
          resolution: resolution || '1k',
          selectedPresets: selectedPresets ? JSON.parse(selectedPresets) : undefined,
          selectedPresetOptionIds: selectedPresetOptionIds ? JSON.parse(selectedPresetOptionIds) : undefined
        }
      };

      // 사용자 ID 가져오기 (authMiddleware에서 설정)
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      console.log('Processing request:', {
        model,
        userId,
        hasPrompt: !!prompt,
        imageSize: mainImageFile.size
      });

      // 이미지 처리 실행
      const result = await imageProcessor.processImage(processingRequest, userId);

      res.json({
        success: result.success,
        images: result.images,
        usage: {
          tokensUsed: result.tokensUsed,
          model: result.model,
          processingTime: result.processingTime
        },
        error: result.error
      });

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      res.status(500).json({ error: errorMessage });
    }
  }
);

// 프롬프트 제안 엔드포인트
router.post('/suggest',
  authMiddleware,
  rateLimitMiddleware,
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      const { currentPrompt, language = 'en' } = req.body;

      // 파일 처리
      const files = req.files as Express.Multer.File[];
      const mainImageFile = files?.find(f => f.fieldname === 'mainImage');
      const referenceFiles = files?.filter(f => f.fieldname.startsWith('referenceImage')) || [];

      // TODO: 실제 AI 기반 프롬프트 제안 로직 구현
      // 현재는 기본 제안 반환
      const defaultSuggestions = {
        ko: [
          "해질녹 미래 도시 스카이라인을 그린 생생한 추상화",
          "네오탄 색상의 사이버펑크 도시 풍경",
          "원시 마법의 숲 속 빛나는 요정 마을",
          "어두운 하늘 아래 빛나는 오로라로 이루어진 드래곤"
        ],
        en: [
          "A vibrant abstract painting of a futuristic city skyline at dusk",
          "Cyberpunk cityscape with neon colors and rain",
          "Mystical forest with glowing fairy village",
          "Majestic dragon made of aurora lights against dark sky"
        ]
      };

      const suggestions = defaultSuggestions[language as keyof typeof defaultSuggestions] || defaultSuggestions.en;
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

      res.json({
        suggestion: randomSuggestion,
        language,
        hasMainImage: !!mainImageFile,
        referenceImageCount: referenceFiles.length
      });

    } catch (error) {
      console.error('Suggestion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestion';
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.post('/edit', authMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      imageData,
      model,
      creativity,
      preset
    } = req.body;

    if (!prompt || !imageData || !model) {
      return res.status(400).json({ error: 'Prompt, image data, and model are required' });
    }

    const result = await geminiService.editImage({
      prompt,
      imageData,
      model,
      creativity,
      preset
    });

    res.json(result);
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ error: 'Failed to edit image' });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await geminiService.getAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

router.get('/presets', async (req: Request, res: Response) => {
  try {
    const presets = await geminiService.getPresets();
    res.json(presets);
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({ error: 'Failed to get presets' });
  }
});

router.get('/history/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const history = await geminiService.getUserGenerationHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get generation history' });
  }
});

router.delete('/history/:generationId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { generationId } = req.params;

    if (!generationId) {
      return res.status(400).json({ error: 'Generation ID is required' });
    }

    await geminiService.deleteGeneration(generationId);
    res.json({ message: 'Generation deleted successfully' });
  } catch (error) {
    console.error('Delete generation error:', error);
    res.status(500).json({ error: 'Failed to delete generation' });
  }
});

// 테스트용 엔드포인트 (인증 없이)
router.post('/test-generate',
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      console.log('Test generate request:', {
        body: req.body,
        files: req.files?.length
      });

      const { prompt = 'test', model = 'nanobanana' } = req.body;
      const files = req.files as Express.Multer.File[];
      const mainImageFile = files?.find(f => f.fieldname === 'image');

      if (!mainImageFile) {
        return res.status(400).json({ error: 'Main image is required' });
      }

      const imageBase64 = mainImageFile.buffer.toString('base64');

      // 실제로는 토큰 시스템 없이 모의 응답
      console.log('Mock processing for:', { model, prompt, imageSize: mainImageFile.size });

      res.json({
        success: true,
        images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
        usage: {
          tokensUsed: 2,
          model: model,
          processingTime: 1000
        },
        message: 'Test mode - no actual AI processing'
      });

    } catch (error) {
      console.error('Test generation error:', error);
      res.status(500).json({ error: 'Test failed' });
    }
  }
);

export default router;

export default router;