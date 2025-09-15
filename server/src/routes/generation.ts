import { Router, Request, Response } from 'express';
import { geminiService } from '../services/gemini';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

router.post('/generate', authMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model,
      creativity,
      aspectRatio,
      resolution,
      preset,
      imageData,
      referenceImageData
    } = req.body;

    if (!prompt || !model) {
      return res.status(400).json({ error: 'Prompt and model are required' });
    }

    const result = await geminiService.generateImage({
      prompt,
      model,
      creativity,
      aspectRatio,
      resolution,
      preset,
      imageData,
      referenceImageData
    });

    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

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

export default router;