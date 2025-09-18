import type { Translation } from './translations';

export interface PresetOption {
  id: string;
  nameKey: keyof Translation;
  prompt: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  options?: PresetOption[];
}

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export type ModelId = 'nanobanana' | 'seedream';
export type AspectRatio = 'auto' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
export type Resolution = '1k' | '2k' | '4k';


export interface GenerateImageRequest {
  prompt: string;
  creativity: number;
  selectedPresets: Preset[];
  numberOfOutputs: number;
  selectedPresetOptionIds: string[];
  model: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

export interface GeminiEditRequest extends GenerateImageRequest {
  mainImage: File;
  referenceImages: File[];
}

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiEditResponse {
  images: string[];
  text: string | null;
  usage: TokenUsage | null;
}

export interface HistoryItem {
  id: number;
  timestamp: number;
  request: GenerateImageRequest;
  images: string[]; // base64 data URLs
  mainImage: string; // base64 data URL
  referenceImages: string[]; // base64 data URLs
}
