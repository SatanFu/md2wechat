import axios from 'axios';
import type { CoverStrategy, CoverGenerateOptions } from '../../types/index.js';

const IMAGEN_API_BASE = 'https://apihub.agnes-ai.com/v1/images/generations';

// Aspect ratio closest to 1000x700 is 3:2 → not supported, use 4:3 (closest)
const COVER_ASPECT_RATIO = '4:3';

export class AiCoverStrategy implements CoverStrategy {
  name = 'ai';

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'agnes-image-2.1-flash';
  }

  private buildPrompt(title: string, _author?: string): string {
    return `WeChat official account cover image, clean modern style, topic: ${title}, no text, high quality illustration, suitable for tech content, vibrant colors`;
  }

  async generate(options: CoverGenerateOptions): Promise<Buffer> {
    const prompt = options.prompt ?? this.buildPrompt(options.title, options.author);
    const width = options.width ?? 1024
    const height = options.height ?? 436

    const url = `${IMAGEN_API_BASE}`;

    const response = await axios.post(
      url,
      {
        prompt: `${prompt}`,
        size: `${width}x${height}`,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 360_000,
      }
    );

    const data = response.data;

    // Gemini Imagen API returns predictions[].bytesBase64Encoded or generatedImages[].image.imageBytes
    const imageBase64 = data.data?.[0]?.b64_json;
    
    if (!imageBase64) {
      throw new Error('Imagen API 未返回图片数据');
    }

    return Buffer.from(imageBase64, 'base64');
  }
}
