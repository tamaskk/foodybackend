import sharp from 'sharp';
import FormData from 'form-data';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createWorker } from 'tesseract.js';
import { IRecipe } from '../models/Recipe';

export interface RecipeAnalysisResult {
  result: 'success' | 'error';
  data?: Partial<IRecipe>;
  error?: string;
  details?: any;
}

export class AnalyzeSocialMediaService {
  private OPENAI_API_KEY: string;

  constructor() {
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    if (!this.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not configured');
    }
  }

  async analyzePhoto(photos: string[]): Promise<Partial<IRecipe>> {
    const MAX_IMAGES = 20;
    const MAX_TOTAL_CHARS = 6_000_000;

    if (!this.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!Array.isArray(photos) || photos.length === 0) {
      throw new Error('No photos provided');
    }

    const limitedPhotos = photos.slice(0, MAX_IMAGES);

    // Normalize all photos to compressed data URLs
    const normalizedImages: { data: string; len: number }[] = [];
    for (const p of limitedPhotos) {
      const trimmed = (p || '').trim();
      if (!trimmed) continue;

      const converted = trimmed.startsWith('http')
        ? await this.toCompressedDataUrl(trimmed)
        : await this.compressDataUrl(trimmed);
      if (!converted) continue;

      normalizedImages.push({ data: converted, len: converted.length });
    }

    // Sort by size ascending to keep more images under the cap
    normalizedImages.sort((a, b) => a.len - b.len);

    const payloadImages: string[] = [];
    let totalChars = 0;
    for (const img of normalizedImages) {
      if (totalChars + img.len > MAX_TOTAL_CHARS) {
        continue;
      }
      payloadImages.push(img.data);
      totalChars += img.len;
    }

    const validImages = payloadImages.filter((p) => !!p) as string[];

    if (validImages.length === 0) {
      throw new Error('No valid photos after normalization');
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        signal: controller.signal as any,
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a recipe extraction assistant. Given multiple photos from an Instagram/TikTok post showing a recipe, extract all recipe information and return it in JSON format.\n\nCRITICAL REQUIREMENTS:\n1. Extract the recipe title, description, ingredients list, cooking steps, estimated time, calories PER PORTION, and meal type (breakfast, lunch, dinner, snack, or drink).\n2. ALWAYS scale ingredients to serve AT LEAST 2 people. If the recipe shows ingredients for 1 person, double them. If it shows for 4+ people, keep as is. The minimum is always 2 servings.\n3. Time should be in format like "30 min" or "1 hour 15 min" - total cooking/preparation time.\n4. Calories should be per portion/serving (e.g., "350 kcal per serving" or "250 kcal/portion").\n5. Ingredients must be clearly listed with quantities scaled for at least 2 servings.\n\nReturn JSON with: title, description, type, time, kcal (per portion), ingredients (for 2+ people), steps, links.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Analyze these ${validImages.length} photos from a social media post and extract the complete recipe information.` },
                ...validImages.map((img) => ({
                  type: 'image_url' as const,
                  image_url: { url: img, detail: 'low' },
                })),
              ],
            },
          ],
          temperature: 0.4,
          max_tokens: 2000,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.text();
        console.error('[AnalyzePhoto] OpenAI error response', err);
        throw new Error(`OpenAI error: ${err}`);
      }

      const data: { choices: { message: { content: string } }[] } = await response.json();
      const content = data?.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new Error('Failed to parse OpenAI response');
      }

      // Normalize to match Recipe model
      const recipe: Partial<IRecipe> = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || '',
        time: parsed.time || '',
        kcal: parsed.kcal || '',
        type: this.normalizeRecipeType(parsed.type),
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        links: Array.isArray(parsed.links) ? parsed.links : [],
        picture: {
          type: 'emoji',
          value: '🍽️',
        },
      };

      return recipe;
    } catch (err) {
      console.error('[AnalyzePhoto] error', err);
      throw new Error(`Error analyzing photo: ${(err as Error).message}`);
    }
  }

  async analyzeDescription(description: string): Promise<RecipeAnalysisResult> {
    if (!this.OPENAI_API_KEY) {
      return { result: 'error', error: 'OPENAI_API_KEY is not configured' };
    }

    if (!description || description.trim().length === 0) {
      return { result: 'error', error: 'Empty description provided' };
    }

    const systemPrompt = `You are a recipe extraction expert. Analyze the provided Instagram/TikTok caption/description and extract recipe information.

CRITICAL EXTRACTION RULES:
1. ONLY extract recipe information that is EXPLICITLY MENTIONED in the description
2. Extract ingredients, steps, cooking time, and other details if mentioned
3. If the description mentions a recipe name but doesn't provide details, try to infer reasonable defaults
4. Extract any links to recipe sources if mentioned

CRITICAL REQUIREMENTS:
1. ALWAYS scale ingredients to serve AT LEAST 2 people. If the recipe shows ingredients for 1 person, double them. If it shows for 4+ people, keep as is. The minimum is always 2 servings.
2. Time should be in format like "30 min" or "1 hour 15 min" - total cooking/preparation time.
3. Calories should be PER PORTION/PER SERVING (e.g., "350 kcal per serving" or "250 kcal/portion"). Always specify it's per portion.
4. Ingredients must be clearly listed with quantities scaled for at least 2 servings.

REQUIREMENTS:
- Extract the recipe title
- Extract ingredients list (scaled for at least 2 people)
- Extract cooking steps/instructions (if mentioned)
- Extract cooking time (total time, e.g., "30 min")
- Extract calories PER PORTION (e.g., "350 kcal per serving")
- Determine meal type: breakfast, lunch, dinner, snack, or drink
- Extract any recipe source links

Return a JSON object with this EXACT structure:
{
  "title": "Recipe title",
  "description": "Brief description if available",
  "type": "breakfast|lunch|dinner|snack|drink",
  "time": "Estimated total time (e.g., '30 min')",
  "kcal": "Estimated calories per portion (e.g., '350 kcal per serving')",
  "ingredients": ["ingredient 1 (for 2+ servings)", "ingredient 2 (for 2+ servings)", ...],
  "steps": ["step 1", "step 2", ...],
  "links": ["url1", "url2", ...]
}

If specific recipe details are NOT mentioned, return reasonable defaults based on the recipe name/description.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this Instagram/TikTok caption and extract recipe information:\n\n${description}` },
          ],
          temperature: 0.4,
          max_tokens: 16384,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('[AnalyzeDescription] OpenAI error response', err);
        return { result: 'error', error: `OpenAI error: ${err}` };
      }

      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error('[AnalyzeDescription] Failed to parse response', e);
        return { result: 'error', error: 'Failed to parse OpenAI response' };
      }

      // Check if we got valid recipe data
      if (!parsed.title || parsed.title.trim().length === 0) {
        return {
          result: 'error',
          error: 'Unable to extract recipe information from the caption. The post may not contain recipe information.',
        };
      }

      // Normalize to match Recipe model
      const recipe: Partial<IRecipe> = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || '',
        time: parsed.time || '',
        kcal: parsed.kcal || '',
        type: this.normalizeRecipeType(parsed.type),
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        links: Array.isArray(parsed.links) ? parsed.links : [],
        picture: {
          type: 'emoji',
          value: '🍽️',
        },
      };

      return { result: 'success', data: recipe };
    } catch (err) {
      console.error('[AnalyzeDescription] error', err);
      return { result: 'error', error: `Error analyzing description: ${(err as Error).message}` };
    }
  }

  async analyzeVoice(videoUrl: string): Promise<RecipeAnalysisResult> {
    if (!this.OPENAI_API_KEY) {
      return { result: 'error', error: 'OPENAI_API_KEY is not configured' };
    }

    if (!videoUrl || videoUrl.trim().length === 0) {
      return { result: 'error', error: 'No video URL provided' };
    }

    const tempDir = path.join(os.tmpdir(), `audio-analysis-${Date.now()}`);
    const videoPath = path.join(tempDir, 'video.mp4');
    const audioPath = path.join(tempDir, 'audio.mp3');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Download video
      console.log('[AnalyzeVoice] Downloading video...');
      const videoController = new AbortController();
      const videoTimeout = setTimeout(() => videoController.abort(), 60_000);

      const videoResponse = await fetch(videoUrl, { signal: videoController.signal as any });
      clearTimeout(videoTimeout);

      if (!videoResponse.ok) {
        return {
          result: 'error',
          error: `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`,
        };
      }

      const videoArrayBuffer = await videoResponse.arrayBuffer();
      fs.writeFileSync(videoPath, Buffer.from(videoArrayBuffer));

      // Extract audio
      console.log('[AnalyzeVoice] Extracting audio...');
      await this.extractAudioFromVideo(videoPath, audioPath);

      const audioBuffer = fs.readFileSync(audioPath);

      // Transcribe with Whisper
      console.log('[AnalyzeVoice] Transcribing audio...');
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
      });
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'en');

      const whisperController = new AbortController();
      const whisperTimeout = setTimeout(() => whisperController.abort(), 60_000);

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
        signal: whisperController.signal as any,
      });

      clearTimeout(whisperTimeout);

      if (!whisperResponse.ok) {
        const err = await whisperResponse.text();
        return { result: 'error', error: `Whisper transcription failed: ${err}` };
      }

      const transcriptionData: any = await whisperResponse.json();
      const transcription = transcriptionData?.text || '';

      if (!transcription || transcription.trim().length === 0) {
        return { result: 'error', error: 'No speech detected in audio' };
      }

      // Analyze transcription
      const systemPrompt = `You are a recipe extraction expert. Analyze the provided audio transcription from an Instagram/TikTok video and extract recipe information.

CRITICAL EXTRACTION RULES:
1. Extract recipe information mentioned by the speaker
2. Pay attention to ingredients, steps, cooking times, and tips
3. Extract any recipe names or dish names mentioned

CRITICAL REQUIREMENTS:
1. ALWAYS scale ingredients to serve AT LEAST 2 people. If the recipe shows ingredients for 1 person, double them. If it shows for 4+ people, keep as is. The minimum is always 2 servings.
2. Time should be in format like "30 min" or "1 hour 15 min" - total cooking/preparation time.
3. Calories should be PER PORTION/PER SERVING (e.g., "350 kcal per serving" or "250 kcal/portion"). Always specify it's per portion.
4. Ingredients must be clearly listed with quantities scaled for at least 2 servings.

Return a JSON object with this structure:
{
  "title": "Recipe title",
  "description": "Brief description",
  "type": "breakfast|lunch|dinner|snack|drink",
  "time": "Estimated total time (e.g., '30 min')",
  "kcal": "Estimated calories per portion (e.g., '350 kcal per serving')",
  "ingredients": ["ingredient 1 (for 2+ servings)", ...],
  "steps": ["step 1", ...],
  "links": []
}`;

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Analyze this video transcription and extract recipe information:\n\nTRANSCRIPTION:\n${transcription}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 16384,
        }),
      });

      if (!gptResponse.ok) {
        const err = await gptResponse.text();
        return { result: 'error', error: `Failed to analyze transcription: ${err}` };
      }

      const gptData: any = await gptResponse.json();
      const content = gptData?.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        return { result: 'error', error: 'Failed to parse recipe extraction' };
      }

      if (!parsed.title || parsed.title.trim().length === 0) {
        return {
          result: 'error',
          error: 'Unable to extract recipe information from audio. The video may not contain recipe information.',
        };
      }

      const recipe: Partial<IRecipe> = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || '',
        time: parsed.time || '',
        kcal: parsed.kcal || '',
        type: this.normalizeRecipeType(parsed.type),
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        links: Array.isArray(parsed.links) ? parsed.links : [],
        picture: {
          type: 'emoji',
          value: '🍽️',
        },
      };

      return { result: 'success', data: recipe };
    } catch (err) {
      console.error('[AnalyzeVoice] error', err);
      return { result: 'error', error: `Error analyzing audio: ${(err as Error).message}` };
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          this.deleteDirectoryRecursive(tempDir);
        }
      } catch (cleanupErr) {
        console.error('[AnalyzeVoice] Failed to clean up temp files', cleanupErr);
      }
    }
  }

  async analyzeByOCR(videoUrl: string): Promise<RecipeAnalysisResult> {
    if (!this.OPENAI_API_KEY) {
      return { result: 'error', error: 'OPENAI_API_KEY is not configured' };
    }

    if (!videoUrl || videoUrl.trim().length === 0) {
      return { result: 'error', error: 'No video URL provided' };
    }

    const tempDir = path.join(os.tmpdir(), `ocr-analysis-${Date.now()}`);
    const videoPath = path.join(tempDir, 'video.mp4');
    const framesDir = path.join(tempDir, 'frames');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }

      // Download video
      const videoController = new AbortController();
      const videoTimeout = setTimeout(() => videoController.abort(), 60_000);

      const videoResponse = await fetch(videoUrl, { signal: videoController.signal as any });
      clearTimeout(videoTimeout);

      if (!videoResponse.ok) {
        return {
          result: 'error',
          error: `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`,
        };
      }

      const videoArrayBuffer = await videoResponse.arrayBuffer();
      fs.writeFileSync(videoPath, Buffer.from(videoArrayBuffer));

      // Extract frames
      const framePaths = await this.extractVideoFrames(videoPath, framesDir);

      if (framePaths.length === 0) {
        return { result: 'error', error: 'No frames could be extracted from video' };
      }

      // Perform OCR
      const worker = await createWorker('eng');
      const ocrTexts: string[] = [];

      for (let i = 0; i < framePaths.length; i++) {
        try {
          const { data } = await worker.recognize(framePaths[i]);
          const text = data.text.trim();
          if (text && text.length > 0) {
            ocrTexts.push(`[Frame ${i + 1}]: ${text}`);
          }
        } catch (err) {
          console.error(`[AnalyzeByOCR] Failed to OCR frame ${i + 1}`, err);
        }
      }

      await worker.terminate();

      if (ocrTexts.length === 0) {
        return { result: 'error', error: 'No text could be extracted from video frames' };
      }

      const combinedOCRText = ocrTexts.join('\n\n');

      // Analyze OCR text
      const systemPrompt = `You are a recipe extraction expert. Analyze OCR text extracted from video frames and extract recipe information.

CRITICAL: Extract EVERY ingredient, step, and detail visible in the OCR text.

CRITICAL REQUIREMENTS:
1. ALWAYS scale ingredients to serve AT LEAST 2 people. If the recipe shows ingredients for 1 person, double them. If it shows for 4+ people, keep as is. The minimum is always 2 servings.
2. Time should be in format like "30 min" or "1 hour 15 min" - total cooking/preparation time.
3. Calories should be PER PORTION/PER SERVING (e.g., "350 kcal per serving" or "250 kcal/portion"). Always specify it's per portion.
4. Ingredients must be clearly listed with quantities scaled for at least 2 servings.

Return a JSON object with this structure:
{
  "title": "Recipe title",
  "description": "Brief description",
  "type": "breakfast|lunch|dinner|snack|drink",
  "time": "Estimated total time (e.g., '30 min')",
  "kcal": "Estimated calories per portion (e.g., '350 kcal per serving')",
  "ingredients": ["ingredient 1 (for 2+ servings)", ...],
  "steps": ["step 1", ...],
  "links": []
}`;

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Analyze this OCR text and extract recipe information:\n\nOCR TEXT:\n${combinedOCRText}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 16384,
        }),
      });

      if (!gptResponse.ok) {
        const err = await gptResponse.text();
        return { result: 'error', error: `Failed to analyze OCR text: ${err}` };
      }

      const gptData: any = await gptResponse.json();
      const content = gptData?.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        return { result: 'error', error: 'Failed to parse OCR analysis' };
      }

      if (!parsed.title || parsed.title.trim().length === 0) {
        return {
          result: 'error',
          error: 'Unable to identify recipe information from OCR text.',
        };
      }

      const recipe: Partial<IRecipe> = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || '',
        time: parsed.time || '',
        kcal: parsed.kcal || '',
        type: this.normalizeRecipeType(parsed.type),
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        links: Array.isArray(parsed.links) ? parsed.links : [],
        picture: {
          type: 'emoji',
          value: '🍽️',
        },
      };

      return { result: 'success', data: recipe };
    } catch (err) {
      console.error('[AnalyzeByOCR] error', err);
      return { result: 'error', error: `Error analyzing video with OCR: ${(err as Error).message}` };
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          this.deleteDirectoryRecursive(tempDir);
        }
      } catch (cleanupErr) {
        console.error('[AnalyzeByOCR] Failed to clean up temp files', cleanupErr);
      }
    }
  }

  async analyzeSubtitles(subtitleLink: string): Promise<RecipeAnalysisResult> {
    if (!this.OPENAI_API_KEY) {
      return { result: 'error', error: 'OPENAI_API_KEY is not configured' };
    }

    if (!subtitleLink || subtitleLink.trim().length === 0) {
      return { result: 'error', error: 'No subtitle link provided' };
    }

    try {
      const vttController = new AbortController();
      const vttTimeout = setTimeout(() => vttController.abort(), 20_000);

      const vttResponse = await fetch(subtitleLink, { signal: vttController.signal as any });
      clearTimeout(vttTimeout);

      if (!vttResponse.ok) {
        return {
          result: 'error',
          error: `Failed to download subtitle file: ${vttResponse.status} ${vttResponse.statusText}`,
        };
      }

      const vttContent = await vttResponse.text();
      const subtitleText = this.parseVTT(vttContent);

      if (!subtitleText || subtitleText.trim().length === 0) {
        return { result: 'error', error: 'No text content found in subtitles' };
      }

      const systemPrompt = `You are a recipe extraction expert. Analyze video subtitles and extract recipe information.

CRITICAL REQUIREMENTS:
1. ALWAYS scale ingredients to serve AT LEAST 2 people. If the recipe shows ingredients for 1 person, double them. If it shows for 4+ people, keep as is. The minimum is always 2 servings.
2. Time should be in format like "30 min" or "1 hour 15 min" - total cooking/preparation time.
3. Calories should be PER PORTION/PER SERVING (e.g., "350 kcal per serving" or "250 kcal/portion"). Always specify it's per portion.
4. Ingredients must be clearly listed with quantities scaled for at least 2 servings.

Return a JSON object with this structure:
{
  "title": "Recipe title",
  "description": "Brief description",
  "type": "breakfast|lunch|dinner|snack|drink",
  "time": "Estimated total time (e.g., '30 min')",
  "kcal": "Estimated calories per portion (e.g., '350 kcal per serving')",
  "ingredients": ["ingredient 1 (for 2+ servings)", ...],
  "steps": ["step 1", ...],
  "links": []
}`;

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Analyze these video subtitles and extract recipe information:\n\nSUBTITLES:\n${subtitleText}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 16384,
        }),
      });

      if (!gptResponse.ok) {
        const err = await gptResponse.text();
        return { result: 'error', error: `Failed to analyze subtitles: ${err}` };
      }

      const gptData: any = await gptResponse.json();
      const content = gptData?.choices?.[0]?.message?.content || '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        return { result: 'error', error: 'Failed to parse subtitle analysis' };
      }

      if (!parsed.title || parsed.title.trim().length === 0) {
        return {
          result: 'error',
          error: 'Unable to extract recipe information from subtitles.',
        };
      }

      const recipe: Partial<IRecipe> = {
        title: parsed.title || 'Untitled Recipe',
        description: parsed.description || '',
        time: parsed.time || '',
        kcal: parsed.kcal || '',
        type: this.normalizeRecipeType(parsed.type),
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        links: Array.isArray(parsed.links) ? parsed.links : [],
        picture: {
          type: 'emoji',
          value: '🍽️',
        },
      };

      return { result: 'success', data: recipe };
    } catch (err) {
      console.error('[AnalyzeSubtitles] error', err);
      return { result: 'error', error: `Error analyzing subtitles: ${(err as Error).message}` };
    }
  }

  private normalizeRecipeType(type: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink' {
    const normalized = (type || '').toLowerCase().trim();
    const validTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'> = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'drink',
    ];
    return validTypes.includes(normalized as any) ? (normalized as any) : 'dinner';
  }

  private async toCompressedDataUrl(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(url, { signal: controller.signal as any });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const compressed = await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const base64 = compressed.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (err) {
      console.error('[toCompressedDataUrl] error', err);
      throw new Error(`Image fetch error: ${(err as Error).message}`);
    }
  }

  private async compressDataUrl(dataUrl: string): Promise<string> {
    try {
      const matches = dataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }
      const base64 = matches[1];
      const buffer = Buffer.from(base64, 'base64');

      const compressed = await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const compressedBase64 = compressed.toString('base64');
      return `data:image/jpeg;base64,${compressedBase64}`;
    } catch (err) {
      console.error('[compressDataUrl] error', err);
      throw new Error(`Data URL compression error: ${(err as Error).message}`);
    }
  }

  private parseVTT(vttContent: string): string {
    const lines = vttContent.split('\n');
    const textLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('WEBVTT')) continue;
      if (line.includes('-->')) continue;
      if (line === '') continue;
      if (/^\d+$/.test(line)) continue;
      textLines.push(line);
    }

    return textLines.join(' ');
  }

  private extractAudioFromVideo(videoPath: string, audioOutputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioOutputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('end', () => resolve())
        .on('error', (err: any) => reject(new Error(`Failed to extract audio: ${err.message}`)))
        .run();
    });
  }

  private extractVideoFrames(videoPath: string, outputDir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const framePaths: string[] = [];
      const framePattern = path.join(outputDir, 'frame-%03d.jpg');

      ffmpeg(videoPath)
        .outputOptions(['-vf', `fps=1/2`, '-frames:v', '30'])
        .output(framePattern)
        .on('end', () => {
          const files = fs.readdirSync(outputDir);
          files.forEach((file) => {
            if (file.endsWith('.jpg')) {
              framePaths.push(path.join(outputDir, file));
            }
          });
          resolve(framePaths);
        })
        .on('error', (err) => reject(new Error(`Failed to extract frames: ${err.message}`)))
        .run();
    });
  }

  private deleteDirectoryRecursive(directoryPath: string): void {
    if (fs.existsSync(directoryPath)) {
      fs.readdirSync(directoryPath).forEach((file) => {
        const curPath = path.join(directoryPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.deleteDirectoryRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(directoryPath);
    }
  }
}

