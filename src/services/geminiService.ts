import { GoogleGenAI } from "@google/genai";

export type PhotoStyle = 'rustic' | 'modern' | 'social';
export type ImageSize = '1K' | '2K' | '4K';

export interface Dish {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
}

const STYLE_PROMPTS: Record<PhotoStyle, string> = {
  rustic: "Rustic, dark, moody food photography. Natural wood textures, soft side lighting, deep shadows, artisanal feel, high-end restaurant quality.",
  modern: "Bright, modern, clean food photography. Minimalist white background, soft even lighting, vibrant colors, sharp focus, contemporary aesthetic.",
  social: "Social media style food photography. Flat lay, top-down perspective, colorful props, trendy presentation, high contrast, perfect for Instagram."
};

export async function generateFoodPhoto(
  dishName: string,
  style: PhotoStyle,
  size: ImageSize
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stylePrompt = STYLE_PROMPTS[style];
  const fullPrompt = `Professional food photography of ${dishName}. ${stylePrompt} 8k resolution, photorealistic, highly detailed, appetizing.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: fullPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}
