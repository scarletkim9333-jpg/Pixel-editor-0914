
import { GoogleGenAI, Modality, Type, GenerateContentResponse, Part } from "@google/genai";
import { getPresets, Language, Translation } from "../translations";
import type { GeminiEditRequest, GeminiEditResponse, ImageFile } from '../types';

const fileToGenerativePart = async (file: File): Promise<ImageFile> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  return { base64, mimeType: file.type };
};

const buildPromptForStandardRequest = (request: GeminiEditRequest): string => {
  let fullPrompt = request.prompt;
  
  const preset = request.selectedPresets[0];

  if (preset) {
    let presetPromptText = preset.prompt;

    if (preset.id === 'angle_changer') {
      const angles = request.numberOfOutputs === 4
        ? 'high angle, 360-degree overhead view, an elevated view, wide angle shot'
        : 'high angle, 360-degree overhead view, an elevated view, wide angle shot, side view, and fish-eye lens';
      presetPromptText = presetPromptText
        .replace(/{NUM_OUTPUTS}/g, String(request.numberOfOutputs))
        .replace('{ANGLE_LIST}', angles);
    }
    
    fullPrompt = `${fullPrompt}\n\nApply the following instructions:\n${presetPromptText}`;

  } else {
    const instruction = "GENERATE A SINGLE CREATIVE VARIATION based on the prompt.";
    fullPrompt += `\n\n${instruction}`;
  }
  
  return fullPrompt;
};

const processGeminiResponse = (response: GenerateContentResponse, result: GeminiEditResponse) => {
    if (response.usageMetadata) {
        result.usage = {
            promptTokenCount: (result.usage?.promptTokenCount || 0) + (response.usageMetadata.promptTokenCount || 0),
            candidatesTokenCount: (result.usage?.candidatesTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0),
            totalTokenCount: (result.usage?.totalTokenCount || 0) + (response.usageMetadata.totalTokenCount || 0),
        };
    }
    if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                result.images.push(imageUrl);
            } else if (part.text) {
                result.text = (result.text || "") + part.text;
            }
        }
    }
}


export const editImageWithGemini = async (request: GeminiEditRequest): Promise<GeminiEditResponse> => {
  const { mainImage, referenceImages, model } = request;

  if (model !== 'nanobanana') {
    throw new Error('errorUnsupportedModel');
  }

  if (!process.env.API_KEY) {
    throw new Error("errorApiKey");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const mainImagePart = await fileToGenerativePart(mainImage);
  const referenceImageParts = await Promise.all(referenceImages.map(fileToGenerativePart));

  const imageContentParts: Part[] = [
    { inlineData: { data: mainImagePart.base64, mimeType: mainImagePart.mimeType } },
    ...referenceImageParts.map(p => ({ inlineData: { data: p.base64, mimeType: p.mimeType } })),
  ];

  const isFigurinePreset = request.selectedPresets.some(p => p.id === 'figurine');

  if (isFigurinePreset && request.selectedPresetOptionIds.length > 0) {
    const figurinePreset = request.selectedPresets.find(p => p.id === 'figurine')!;
    
    const generationPromises = request.selectedPresetOptionIds.map(optionId => {
        const option = figurinePreset.options?.find(o => o.id === optionId);
        if (!option) return Promise.resolve(null);

        const stylePrompt = figurinePreset.prompt.replace('{STYLE_PROMPT}', option.prompt);
        const finalPrompt = `${request.prompt}\n\nApply the following instructions:\n${stylePrompt}`;
        
        const contentParts: Part[] = [...imageContentParts, { text: finalPrompt }];
        
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: contentParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
    });

    const responses = await Promise.all(generationPromises);
    const aggregatedResult: GeminiEditResponse = { images: [], text: "", usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 } };

    responses.forEach(response => {
        if (response) {
            processGeminiResponse(response, aggregatedResult);
        }
    });

    if (aggregatedResult.images.length === 0) {
        throw new Error("errorNoImageGenerated");
    }
    return aggregatedResult;
  }
  
  // Standard/Multi-Angle generation (single call)
  const contentParts: Part[] = [...imageContentParts, { text: buildPromptForStandardRequest(request) }];
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts: contentParts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  const result: GeminiEditResponse = { images: [], text: null, usage: null };
  processGeminiResponse(response, result);
  
  const isMultiAnglePreset = request.selectedPresets.some(p => p.id === 'angle_changer');

  if (isMultiAnglePreset && result.images.length === 1) {
    throw new Error("errorImageMerged");
  }

  if (result.images.length === 0) {
    throw new Error("errorNoImageGenerated");
  }

  return result;
};


export const getPromptSuggestion = async (currentPrompt: string, mainImage: File | null, referenceImages: File[], language: Language): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("errorApiKey");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contentParts: Part[] = [];

    if (mainImage) {
        const mainImagePart = await fileToGenerativePart(mainImage);
        contentParts.push({
            inlineData: {
                data: mainImagePart.base64,
                mimeType: mainImagePart.mimeType
            }
        });
    }
    
    const refImageParts = await Promise.all(referenceImages.map(fileToGenerativePart));
    refImageParts.forEach(part => {
        contentParts.push({
            inlineData: {
                data: part.base64,
                mimeType: part.mimeType
            }
        });
    });
    
    const langInstruction = language === 'ko' ? "Provide suggestions in Korean." : "Provide suggestions in English.";

    const systemInstruction = `You are an expert creative director specializing in image editing prompts. Based on the user's uploaded image(s) and their current idea, provide 3 diverse, creative, and concise prompt suggestions for editing the image. ${langInstruction} Return ONLY the JSON object. Do not include markdown formatting.`;
    const userPrompt = `Based on the uploaded image(s) and the user's current prompt idea: "${currentPrompt}", suggest 3 creative editing prompts.`;
    
    contentParts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.suggestions && jsonResponse.suggestions.length > 0) {
            // Let's just return one for simplicity in the UI
            return jsonResponse.suggestions[Math.floor(Math.random() * jsonResponse.suggestions.length)];
        }
    } catch (e) {
        console.error("Failed to parse prompt suggestion JSON:", e);
    }
    return language === 'ko' ? "해질녘 미래 도시 스카이라인을 그린 생생한 추상화." : "A vibrant abstract painting of a futuristic city skyline at dusk.";
};
