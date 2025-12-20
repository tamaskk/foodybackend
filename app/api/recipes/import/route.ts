import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { ApifyService } from '@/services/apify.service';
import { AnalyzeSocialMediaService } from '@/services/analyze-social-media.service';
import AchievementService from '@/services/achievement.service';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }),
      user: null,
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }),
      user: null,
    };
  }

  return { error: null, user: payload };
}

// POST /api/recipes/import - Import recipe from social media URL
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { url, duration } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const apifyService = new ApifyService();
    const analyzeService = new AnalyzeSocialMediaService();

    let images: string[] = [];
    let videoUrl: string = '';
    let caption: string = '';
    let audioUrl: string = '';
    let subtitlesLink: string = '';

    // Scrape social media post
    if (url.includes('instagram')) {
      console.log('Analyzing Instagram post');
      const run = await apifyService.client.actor('apify/instagram-scraper').call({
        directUrls: [url],
      });

      const defaultDatasetId = run.defaultDatasetId;
      if (!defaultDatasetId) {
        return NextResponse.json({ error: 'No data returned from Instagram scraper' }, { status: 500 });
      }

      const { items } = await apifyService.client.dataset(defaultDatasetId).listItems();
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: 'No data returned from Apify', message: 'Post may be private, deleted, or unavailable' },
          { status: 404 }
        );
      }

      const post = items[0] as any;
      images = (post.images || []) as string[];
      videoUrl = post.videoUrl || '';
      caption = post.caption || '';
      audioUrl = post.audioUrl || '';
    } else if (url.includes('tiktok')) {
      console.log('Analyzing TikTok post');
      const run = await apifyService.client.actor('clockworks/free-tiktok-scraper').call({
        postURLs: [url],
        resultsPerPage: 1,
        shouldDownloadCovers: true,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: true,
        shouldDownloadVideos: true,
        videoKvStoreIdOrName: 'tiktok',
        profileScrapeSections: ['videos'],
        profileSorting: 'latest',
        searchSection: '',
        maxProfilesPerQuery: 10,
      });

      const defaultDatasetId = run.defaultDatasetId;
      if (!defaultDatasetId) {
        return NextResponse.json({ error: 'No data returned from TikTok scraper' }, { status: 500 });
      }

      const { items } = await apifyService.client.dataset(defaultDatasetId).listItems();
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: 'No data returned from Apify', message: 'Post may be private, deleted, or unavailable' },
          { status: 404 }
        );
      }

      const post = items[0] as any;

      if (post.isSlideshow) {
        images = (post.slideshowImageLinks || []).map(
          (image: { tiktokLink: string; downloadLink: string }) => image.tiktokLink
        );
        videoUrl = '';
      } else {
        images = [];
        videoUrl = post.videoMeta?.downloadAddr || '';
      }

      caption = post.text || '';
      subtitlesLink =
        post.videoMeta?.subtitleLinks?.find(
          (subtitle: { language: string; downloadLink: string }) => subtitle.language === 'eng-US'
        )?.downloadLink || '';
    } else {
      return NextResponse.json({ error: 'Invalid URL. Only Instagram and TikTok URLs are supported.' }, { status: 400 });
    }

    if ((!images || images.length === 0) && !videoUrl) {
      return NextResponse.json({ error: 'No images or video found in the post' }, { status: 404 });
    }

    // Analyze content and extract recipe
    if (videoUrl) {
      // Try subtitles first (TikTok)
      if (subtitlesLink) {
        console.log('Analyzing subtitles from TikTok');
        const analyzeSubtitles = await analyzeService.analyzeSubtitles(subtitlesLink);
        if (analyzeSubtitles.result === 'success' && analyzeSubtitles.data) {
          console.log('Subtitles analyzed successfully');
          // Track achievement
          AchievementService.trackAndCheck(auth.user!.userId, 'recipes_imported').catch(err => 
            console.error('Achievement tracking error:', err)
          );
          return NextResponse.json({ success: true, recipe: analyzeSubtitles.data });
        }
      }

      // Try caption/description
      if (caption) {
        console.log('Analyzing caption');
        const analyzeDescription = await analyzeService.analyzeDescription(caption);
        if (analyzeDescription.result === 'success' && analyzeDescription.data) {
          console.log('Caption analyzed successfully');
          // Track achievement
          AchievementService.trackAndCheck(auth.user!.userId, 'recipes_imported').catch(err => 
            console.error('Achievement tracking error:', err)
          );
          return NextResponse.json({ success: true, recipe: analyzeDescription.data });
        }
      }

      // Try OCR
      console.log('Analyzing OCR');
      const analyzeByOCR = await analyzeService.analyzeByOCR(videoUrl);
      if (analyzeByOCR.result === 'success' && analyzeByOCR.data) {
        console.log('OCR analyzed successfully');
        // Track achievement
        AchievementService.trackAndCheck(auth.user!.userId, 'recipes_imported').catch(err => 
          console.error('Achievement tracking error:', err)
        );
        return NextResponse.json({ success: true, recipe: analyzeByOCR.data });
      }

      // Try voice transcription
      console.log('Analyzing voice');
      const analyzeVoice = await analyzeService.analyzeVoice(videoUrl);
      if (analyzeVoice.result === 'success' && analyzeVoice.data) {
        console.log('Voice analyzed successfully');
        // Track achievement
        AchievementService.trackAndCheck(auth.user!.userId, 'recipes_imported').catch(err => 
          console.error('Achievement tracking error:', err)
        );
        return NextResponse.json({ success: true, recipe: analyzeVoice.data });
      }

      // All methods failed
      return NextResponse.json(
        {
          error: 'Unable to extract recipe information from video',
          attempts: {
            subtitles: subtitlesLink ? 'tried' : 'skipped',
            caption: caption ? 'tried' : 'skipped',
            ocr: 'failed',
            voice: 'failed',
          },
        },
        { status: 400 }
      );
    } else {
      // Analyze images
      console.log('Filtering images');
      const filteredImages = await filterImages(images, 5);
      console.log('Images filtered successfully');

      console.log('Analyzing photo');
      const analyzedPhoto = await analyzeService.analyzePhoto(filteredImages);
      console.log('Photo analyzed successfully');

      // Track achievement
      AchievementService.trackAndCheck(auth.user!.userId, 'recipes_imported').catch(err => 
        console.error('Achievement tracking error:', err)
      );

      return NextResponse.json({ success: true, recipe: analyzedPhoto });
    }
  } catch (error: any) {
    console.error('Import recipe error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Simple filter: pick top N images based on size after lightweight fetch
 */
async function filterImages(images: string[], maxCount: number): Promise<string[]> {
  const results: { url: string; size: number }[] = [];

  for (const img of images) {
    try {
      let size = 0;
      if (img.startsWith('http')) {
        const res = await fetch(img, { method: 'HEAD' });
        const contentLength = res.headers.get('content-length');
        size = contentLength ? parseInt(contentLength, 10) : 0;
      } else {
        const base64 = img.split(',')[1] || '';
        size = base64.length;
      }
      results.push({ url: img, size });
    } catch {
      continue; // skip broken images
    }
  }

  // sort descending by size (likely more informative images)
  results.sort((a, b) => b.size - a.size);

  // pick top N
  return results.slice(0, maxCount).map((r) => r.url);
}

