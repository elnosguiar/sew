import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isDevLifecycle = process.env.npm_lifecycle_event === 'dev';
const distIndexPath = path.resolve(__dirname, 'dist', 'index.html');
const isProduction =
  process.env.NODE_ENV === 'production' ||
  (!isDevLifecycle && fs.existsSync(distIndexPath));

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

interface SearchCandidatePayload {
  mallName: string;
  productTitle: string;
  estimatedPricePerYard: number;
  unit: '1마' | '반마' | '1m' | '1야드';
  shippingFee: number;
  freeShippingThreshold: number;
  note: string;
  url?: string;
}

interface ParsedSearchJson {
  marketSummary?: string;
  priceRangeText?: string;
  shoppingTip?: string;
  candidates?: Array<{
    mallName?: string;
    productTitle?: string;
    estimatedPricePerYard?: number;
    unit?: string;
    shippingFee?: number;
    freeShippingThreshold?: number;
    note?: string;
    url?: string;
  }>;
}

interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channel: string;
  lengthText?: string;
  viewCountText?: string;
  thumbnailUrl: string;
  watchUrl: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonFromText(rawText: string): ParsedSearchJson | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidateStr = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidateStr) as ParsedSearchJson;
  } catch {
    const startIdx = candidateStr.indexOf('{');
    const endIdx = candidateStr.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      try {
        return JSON.parse(candidateStr.slice(startIdx, endIdx + 1)) as ParsedSearchJson;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeUnit(unit?: string): '1마' | '반마' | '1m' | '1야드' {
  if (unit === '반마' || unit === '1m' || unit === '1야드') return unit;
  return '1마';
}

function inferUnitFromTitle(title: string): '1마' | '반마' | '1m' | '1야드' {
  if (/반마|45cm|0\.5마/i.test(title)) return '반마';
  if (/1야드|1yd|yard/i.test(title)) return '1야드';
  if (/\b1m\b|1미터/i.test(title)) return '1m';
  return '1마';
}

function normalizePricePerYard(price: number, unit: '1마' | '반마' | '1m' | '1야드'): number {
  if (unit === '반마') return price * 2;
  if (unit === '1m') return Math.round(price * 0.9);
  if (unit === '1야드') return Math.round(price * (90 / 91.4));
  return price;
}

function sanitizeHttpUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return undefined;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function decodeJsonEscapes(input: string): string {
  try {
    return JSON.parse(`"${input}"`) as string;
  } catch {
    return input.replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

async function fetchCafe24MallProducts(params: {
  mallName: string;
  baseUrl: string;
  searchUrl: string;
  shippingFee: number;
  freeShippingThreshold: number;
  titleSuffixToStrip?: string;
}): Promise<SearchCandidatePayload[]> {
  try {
    const res = await fetch(params.searchUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const blocks = html.match(/<li[^>]*id="anchorBoxId_\d+"[\s\S]*?<\/li>/g) || [];
    const results: SearchCandidatePayload[] = [];

    for (const block of blocks.slice(0, 12)) {
      const href = block.match(/href="(\/product\/[^"]+)"/)?.[1];
      const rawAlt = block.match(/<img[^>]*alt="([^"]+)"/)?.[1] || '';
      let title = decodeHtmlEntities(rawAlt);
      if (params.titleSuffixToStrip && title.endsWith(params.titleSuffixToStrip)) {
        title = title.slice(0, -params.titleSuffixToStrip.length).trim();
      }
      if (!title) continue;

      const priceBlock = block.match(/product_price[\s\S]*?<\/li>/)?.[0] || block;
      const priceMatches = [...priceBlock.matchAll(/([\d,]{3,8})원/g)];
      const price =
        priceMatches.length > 0
          ? Number(priceMatches[priceMatches.length - 1][1].replace(/,/g, ''))
          : 0;

      if (!Number.isFinite(price) || price < 300 || price > 200000) continue;

      const unit = inferUnitFromTitle(title);
      const isPack = /1\+1|묶음|패키지|컷트지/i.test(title);
      const widthMatch = title.match(/(\d{2,3})\s*cm|대폭|소폭/i);
      const widthNote = widthMatch ? `폭 참고: ${widthMatch[0]}` : '';
      const noteParts = [
        isPack ? '묶음/세트 상품 (상세 길이 확인)' : '실시간 쇼핑몰 판매가',
        widthNote,
      ].filter(Boolean);

      results.push({
        mallName: params.mallName,
        productTitle: title,
        estimatedPricePerYard: price,
        unit,
        shippingFee: params.shippingFee,
        freeShippingThreshold: params.freeShippingThreshold,
        note: noteParts.join(' · '),
        url: href ? `${params.baseUrl}${href}` : params.searchUrl,
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function fetchLiveKoreanFabricStores(
  query: string
): Promise<{
  candidates: SearchCandidatePayload[];
  sources: Array<{ title: string; uri: string }>;
}> {
  const encoded = encodeURIComponent(query);
  const douUrl = `https://doufabric.com/product/search.html?keyword=${encoded}`;
  const samsikUrl = `https://3amsic.com/product/search.html?keyword=${encoded}`;

  const [douItems, samsikItems] = await Promise.all([
    fetchCafe24MallProducts({
      mallName: '도우패브릭',
      baseUrl: 'https://doufabric.com',
      searchUrl: douUrl,
      shippingFee: 2500,
      freeShippingThreshold: 50000,
      titleSuffixToStrip: '도우패브릭',
    }),
    fetchCafe24MallProducts({
      mallName: '삼식이원단',
      baseUrl: 'https://3amsic.com',
      searchUrl: samsikUrl,
      shippingFee: 3000,
      freeShippingThreshold: 50000,
    }),
  ]);

  // Interleave & sort cheapest normalized 1-yard price first (preferring single-yard items over 1+1 bundles at top)
  const combined = [...douItems, ...samsikItems].sort((a, b) => {
    const aIsPack = /1\+1|묶음|세트/i.test(a.productTitle) ? 1 : 0;
    const bIsPack = /1\+1|묶음|세트/i.test(b.productTitle) ? 1 : 0;
    if (aIsPack !== bIsPack) return aIsPack - bIsPack;
    return (
      normalizePricePerYard(a.estimatedPricePerYard, a.unit) -
      normalizePricePerYard(b.estimatedPricePerYard, b.unit)
    );
  });

  const sources: Array<{ title: string; uri: string }> = [];
  if (douItems.length > 0) {
    sources.push({ title: `도우패브릭 "${query}" 실시간 검색 결과`, uri: douUrl });
  }
  if (samsikItems.length > 0) {
    sources.push({ title: `삼식이원단 "${query}" 실시간 검색 결과`, uri: samsikUrl });
  }

  return {
    candidates: combined.slice(0, 8),
    sources,
  };
}

async function fetchGeminiGroundedSearch(
  query: string,
  neededYards: number
): Promise<{
  marketSummary?: string;
  priceRangeText?: string;
  shoppingTip?: string;
  candidates: SearchCandidatePayload[];
  sources: Array<{ title: string; uri: string }>;
} | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const systemInstruction = [
    '당신은 한국의 홈 미싱·소잉·원단 구매 도우미입니다.',
    'Google Search로 한국 원단 쇼핑몰(천가게, 천싸요, 도우패브릭, 삼식이원단, 네스홈, 네이버 쇼핑)의 시세와 판매 정보를 정리하세요.',
    '반드시 아래 JSON 형식만 출력하세요:',
    '{',
    '  "marketSummary": "이 원단의 온라인 시세와 특징 요약 (2문장 이내)",',
    '  "priceRangeText": "예상 1마 시세 범위 (예: 1마 3,200원 ~ 6,500원)",',
    '  "shoppingTip": "배송비 절약 또는 혼방/수축률/폭(110cm vs 145cm) 구매 팁 (1~2문장)",',
    '  "candidates": [',
    '    {',
    '      "mallName": "쇼핑몰명",',
    '      "productTitle": "구체적인 원단 품명",',
    '      "estimatedPricePerYard": 4200,',
    '      "unit": "1마",',
    '      "shippingFee": 3000,',
    '      "freeShippingThreshold": 50000,',
    '      "note": "특징 메모",',
    '      "url": "URL"',
    '    }',
    '  ]',
    '}',
  ].join('\n');

  const prompt = `한국 온라인 원단 쇼핑몰에서 "${query}" 원단(구매 예정 ${neededYards}마 기준)의 저렴한 판매처와 1마 기준 가격대를 검색해서 JSON으로 정리해 주세요.`;

  for (const model of ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text ?? '';
      const parsed = extractJsonFromText(responseText);

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const seenUrls = new Set<string>();
      const sources: Array<{ title: string; uri: string }> = [];

      for (const chunk of rawChunks) {
        const uri = sanitizeHttpUrl(chunk.web?.uri);
        if (!uri || seenUrls.has(uri)) continue;
        seenUrls.add(uri);
        sources.push({
          title: chunk.web?.title?.trim() || uri,
          uri,
        });
      }

      const candidates: SearchCandidatePayload[] = Array.isArray(parsed?.candidates)
        ? parsed.candidates
            .filter(
              (item) =>
                item && typeof item.mallName === 'string' && typeof item.productTitle === 'string'
            )
            .slice(0, 4)
            .map((item) => ({
              mallName: item.mallName!.trim(),
              productTitle: item.productTitle!.trim(),
              estimatedPricePerYard: Math.max(
                0,
                Math.round(Number(item.estimatedPricePerYard) || 0)
              ),
              unit: normalizeUnit(item.unit),
              shippingFee: Math.max(0, Math.round(Number(item.shippingFee) || 3000)),
              freeShippingThreshold: Math.max(
                0,
                Math.round(Number(item.freeShippingThreshold) || 50000)
              ),
              note: typeof item.note === 'string' ? item.note.trim() : '',
              url: sanitizeHttpUrl(item.url),
            }))
            .filter((item) => item.estimatedPricePerYard > 0)
        : [];

      return {
        marketSummary: parsed?.marketSummary?.trim(),
        priceRangeText: parsed?.priceRangeText?.trim(),
        shoppingTip: parsed?.shoppingTip?.trim(),
        candidates,
        sources,
      };
    } catch {
      // Try next model or fall back cleanly to live Korean fabric store results
    }
  }

  return null;
}

async function searchYouTubeSewingTutorials(rawQuery: string): Promise<YouTubeVideoItem[]> {
  const hasSewingKeyword = /재봉틀|미싱|소잉|sewing|diy|만들기/i.test(rawQuery);
  const searchQuery = hasSewingKeyword
    ? rawQuery
    : `재봉틀 ${rawQuery} 만들기`;

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    throw new Error(`YouTube HTTP ${res.status}`);
  }

  const html = await res.text();
  const chunks = html.split('"videoRenderer":{').slice(1, 20);
  const seenIds = new Set<string>();
  const videos: YouTubeVideoItem[] = [];

  for (const chunk of chunks) {
    const videoId = chunk.match(/^"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1];
    if (!videoId || seenIds.has(videoId)) continue;

    const rawTitle = chunk.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1];
    if (!rawTitle) continue;

    const rawChannel =
      chunk.match(/"longBylineText":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1] ||
      chunk.match(/"ownerText":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/)?.[1] ||
      '유튜브 크리에이터';

    const lengthText = chunk.match(
      /"lengthText":\{[^}]*"simpleText":"([^"]+)"/
    )?.[1];
    const viewCountText = chunk.match(
      /"viewCountText":\{"simpleText":"([^"]+)"/
    )?.[1];

    seenIds.add(videoId);
    videos.push({
      videoId,
      title: decodeJsonEscapes(rawTitle),
      channel: decodeJsonEscapes(rawChannel),
      lengthText,
      viewCountText,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });

    if (videos.length >= 8) break;
  }

  return videos;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/fabric-search', async (req: Request, res: Response) => {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    const neededYardsRaw = Number(req.body?.neededYards);
    const neededYards =
      Number.isFinite(neededYardsRaw) && neededYardsRaw > 0 ? neededYardsRaw : 3;

    if (!rawQuery) {
      res.status(400).json({ error: '검색할 원단 키워드를 입력해 주세요.' });
      return;
    }

    if (rawQuery.length > 100) {
      res.status(400).json({ error: '검색어는 100자 이내로 입력해 주세요.' });
      return;
    }

    try {
      const [liveStoreData, geminiData] = await Promise.all([
        fetchLiveKoreanFabricStores(rawQuery),
        fetchGeminiGroundedSearch(rawQuery, neededYards),
      ]);

      const mergedCandidates: SearchCandidatePayload[] = [];
      const seenKeys = new Set<string>();

      for (const item of [...liveStoreData.candidates, ...(geminiData?.candidates ?? [])]) {
        const key = `${item.mallName}:${item.productTitle}`.toLowerCase();
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        mergedCandidates.push(item);
      }

      const mergedSources: Array<{ title: string; uri: string }> = [];
      const seenUris = new Set<string>();
      for (const src of [...liveStoreData.sources, ...(geminiData?.sources ?? [])]) {
        if (seenUris.has(src.uri)) continue;
        seenUris.add(src.uri);
        mergedSources.push(src);
      }

      if (mergedCandidates.length === 0 && !geminiData) {
        res.status(502).json({
          error:
            '실시간 검색 결과가 비어 있습니다. 검색어를 조금 더 짧게(예: 린넨, 30수, 캔버스, 거즈) 입력하거나 아래 쇼핑몰 바로검색을 이용해 주세요.',
        });
        return;
      }

      // Compute real price range from fetched candidates if Gemini summary wasn't available
      const perYardPrices = mergedCandidates
        .map((c) => normalizePricePerYard(c.estimatedPricePerYard, c.unit))
        .filter((p) => p > 0);
      const minPrice = perYardPrices.length > 0 ? Math.min(...perYardPrices) : 0;
      const maxPrice = perYardPrices.length > 0 ? Math.max(...perYardPrices) : 0;

      const computedPriceRange =
        minPrice > 0
          ? minPrice === maxPrice
            ? `1마 약 ${minPrice.toLocaleString('ko-KR')}원`
            : `1마 ${minPrice.toLocaleString('ko-KR')}원 ~ ${maxPrice.toLocaleString('ko-KR')}원`
          : '쇼핑몰별 옵션 확인';

      const marketSummary =
        geminiData?.marketSummary ||
        `국내 원단 쇼핑몰에서 "${rawQuery}" 실시간 판매 상품을 ${mergedCandidates.length}건 찾았습니다. 배송비와 1마·반마 단위를 확인해 비교표에 담아보세요.`;

      const priceRangeText = geminiData?.priceRangeText || computedPriceRange;

      const shoppingTip =
        geminiData?.shoppingTip ||
        '1+1 묶음 상품은 2마/2m 기준 가격인 경우가 많으니 상세 페이지에서 판매 길이를 확인한 뒤 비교표에 넣어주세요.';

      res.json({
        query: rawQuery,
        marketSummary,
        priceRangeText,
        shoppingTip,
        candidates: mergedCandidates.slice(0, 8),
        sources: mergedSources.slice(0, 8),
      });
    } catch {
      res.status(502).json({
        error:
          '실시간 원단 시세를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    }
  });

  app.post('/api/sewing-videos', async (req: Request, res: Response) => {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query.trim() : '';

    if (!rawQuery) {
      res.status(400).json({ error: '추천받을 소품이나 작품 이름을 입력해 주세요.' });
      return;
    }

    if (rawQuery.length > 80) {
      res.status(400).json({ error: '검색어는 80자 이내로 입력해 주세요.' });
      return;
    }

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      /재봉틀|미싱|만들기/i.test(rawQuery) ? rawQuery : `재봉틀 ${rawQuery} 만들기`
    )}`;

    try {
      const videos = await searchYouTubeSewingTutorials(rawQuery);
      res.json({
        query: rawQuery,
        searchUrl,
        videos,
      });
    } catch {
      res.status(502).json({
        error: '유튜브 추천 영상을 불러오는 중 일시적인 오류가 발생했습니다.',
        searchUrl,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
