import axios, { AxiosInstance } from 'axios';
import { supabaseService } from './supabase';

interface GenerationRequest {
  prompt: string;
  model: string;
  creativity?: number;
  aspectRatio?: string;
  resolution?: string;
  preset?: string;
  imageData?: string;
  referenceImageData?: string;
}

interface EditRequest {
  prompt: string;
  imageData: string;
  model: string;
  creativity?: number;
  preset?: string;
}

class GeminiService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey || this.apiKey.includes('your_')) {
      console.warn('⚠️  Gemini API not configured - using mock mode');
      this.apiKey = 'mock_key';
      this.client = null as any;
      return;
    }

    this.client = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async generateImage(request: GenerationRequest): Promise<any> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await this.client.post(
        `/models/${request.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: request.creativity || 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }
      );

      const result = {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
        model: request.model,
        prompt: request.prompt,
        settings: {
          creativity: request.creativity,
          aspectRatio: request.aspectRatio,
          resolution: request.resolution,
          preset: request.preset
        }
      };

      return result;
    } catch (error: any) {
      console.error('Gemini generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate image');
    }
  }

  async editImage(request: EditRequest): Promise<any> {
    try {
      const prompt = `Edit this image: ${request.prompt}. Apply the following preset style: ${request.preset || 'default'}`;

      const response = await this.client.post(
        `/models/${request.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: request.imageData.replace(/^data:image\/[a-z]+;base64,/, '')
                }
              }
            ]
          }],
          generationConfig: {
            temperature: request.creativity || 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }
      );

      const result = {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
        model: request.model,
        prompt: request.prompt,
        settings: {
          creativity: request.creativity,
          preset: request.preset
        }
      };

      return result;
    } catch (error: any) {
      console.error('Gemini edit error:', error.response?.data || error.message);
      throw new Error('Failed to edit image');
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get(`/models?key=${this.apiKey}`);
      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error: any) {
      console.error('Get models error:', error.response?.data || error.message);
      return ['gemini-pro-vision', 'gemini-pro'];
    }
  }

  async getPresets(): Promise<any[]> {
    return [
      { id: 'realistic', name: 'Realistic', description: 'Photorealistic style' },
      { id: 'artistic', name: 'Artistic', description: 'Artistic and creative style' },
      { id: 'cartoon', name: 'Cartoon', description: 'Cartoon and animation style' },
      { id: 'vintage', name: 'Vintage', description: 'Retro and vintage style' },
      { id: 'futuristic', name: 'Futuristic', description: 'Modern and futuristic style' }
    ];
  }

  async getUserGenerationHistory(userId: string, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const { data, error } = await supabaseService.getGenerationHistory(userId, limit, offset);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || [],
        total: data?.length || 0
      };
    } catch (error: any) {
      console.error('Get generation history error:', error.message);
      throw new Error('Failed to get generation history');
    }
  }

  async deleteGeneration(generationId: string): Promise<void> {
    try {
      const user = await supabaseService.getCurrentUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabaseService.deleteGeneration(generationId, user.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Delete generation error:', error.message);
      throw new Error('Failed to delete generation');
    }
  }

  private buildPrompt(request: GenerationRequest): string {
    let prompt = request.prompt;

    if (request.preset) {
      prompt += ` in ${request.preset} style`;
    }

    if (request.aspectRatio) {
      prompt += ` with ${request.aspectRatio} aspect ratio`;
    }

    if (request.resolution) {
      prompt += ` at ${request.resolution} resolution`;
    }

    return prompt;
  }

  async saveGenerationToHistory(userId: string, generationData: any): Promise<void> {
    try {
      const { error } = await supabaseService.saveGenerationHistory(userId, generationData);

      if (error) {
        console.error('Failed to save generation to history:', error);
      }
    } catch (error: any) {
      console.error('Save generation history error:', error.message);
    }
  }
}

export const geminiService = new GeminiService();