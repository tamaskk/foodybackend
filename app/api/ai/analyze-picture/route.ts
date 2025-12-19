import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { AnalyzeSocialMediaService } from '@/services/analyze-social-media.service';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
      user: null,
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
      user: null,
    };
  }

  return { error: null, user: payload };
}

// POST /api/ai/analyze-picture - Analyze an uploaded picture and extract recipe info
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Convert blob to base64 data URL (accepted by OpenAI vision API)
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = image.type || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const analyzeService = new AnalyzeSocialMediaService();
    const recipe = await analyzeService.analyzePhoto([dataUrl]);

    return NextResponse.json(recipe, { status: 200 });
  } catch (error: any) {
    console.error('Analyze picture error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze picture' },
      { status: 500 }
    );
  }
}

