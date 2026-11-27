import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

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

function sanitizeHttpUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return undefined;
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
    const neededYards = Number.isFinite(neededYardsRaw) && neededYardsRaw > 0 ? neededYardsRaw : 3;

    if (!rawQuery) {
      res.status(400).json({ error: '검색할 원단 키워드를 입력해 주세요.' });
      return;
    }

    if (rawQuery.length > 100) {
      res.status(400).json({ error: '검색어는 100자 이내로 입력해 주세요.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          '서버에 GEMINI_API_KEY가 설정되어 있지 않아 실시간 웹검색을 실행할 수 없습니다. 아래 쇼핑몰 바로검색 버튼을 이용해 주세요.',
      });
      return;
    }

    const systemInstruction = [
      '당신은 한국의 홈 미싱·소잉·원단 구매 도우미입니다.',
      '사용자가 입력한 원단 키워드에 대해 Google Search로 실제 한국 원단 쇼핑몰(천가게, 천싸요, 도우패브릭, 삼식이원단, 네스홈, 동대문 원단 쇼핑몰, 네이버 쇼핑 등)의 시세와 판매 정보를 검색해 한국어로 정확히 정리하세요.',
      '반드시 반마(45cm) 미끼 가격과 1마(90cm) 가격을 구분하고, 가능한 경우 1마 기준 가격(원)과 배송비/무료배송 기준을 정확히 추정해 주세요.',
      '반드시 아래 JSON 형식만 출력하세요 (다른 설명 문장을 JSON 앞뒤에 붙이지 마세요):',
      '{',
      '  "marketSummary": "이 원단의 온라인 시세와 특징 요약 (2문장 이내)",',
      '  "priceRangeText": "예상 1마 시세 범위 (예: 1마 3,200원 ~ 6,500원)",',
      '  "shoppingTip": "배송비 절약 또는 혼방/수축률/폭(110cm vs 145cm) 구매 팁 (1~2문장)",',
      '  "candidates": [',
      '    {',
      '      "mallName": "쇼핑몰명",',
      '      "productTitle": "구체적인 원단 품명/규격",',
      '      "estimatedPricePerYard": 4200,',
      '      "unit": "1마",',
      '      "shippingFee": 3000,',
      '      "freeShippingThreshold": 50000,',
      '      "note": "원단 폭이나 특징 메모",',
      '      "url": "검색된 실제 상품/쇼핑몰 URL (없으면 빈 문자열)"',
      '    }',
      '  ]',
      '}',
      'candidates는 검색된 실제 정보 기반으로 최대 5개까지 작성하고, 가격·배송비는 정수 원 단위로만 넣으세요.',
    ].join('\n');

    const prompt = `한국 온라인 원단 쇼핑몰에서 "${rawQuery}" 원단(구매 예정 수량 ${neededYards}마 기준)의 저렴한 판매처, 1마(90cm) 기준 가격대, 기본 배송비 및 무료배송 기준을 검색해서 JSON으로 정리해 주세요.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
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
            .filter((item) => item && typeof item.mallName === 'string' && typeof item.productTitle === 'string')
            .slice(0, 6)
            .map((item) => ({
              mallName: item.mallName!.trim(),
              productTitle: item.productTitle!.trim(),
              estimatedPricePerYard: Math.max(0, Math.round(Number(item.estimatedPricePerYard) || 0)),
              unit: normalizeUnit(item.unit),
              shippingFee: Math.max(0, Math.round(Number(item.shippingFee) || 3000)),
              freeShippingThreshold: Math.max(0, Math.round(Number(item.freeShippingThreshold) || 50000)),
              note: typeof item.note === 'string' ? item.note.trim() : '',
              url: sanitizeHttpUrl(item.url),
            }))
            .filter((item) => item.estimatedPricePerYard > 0)
        : [];

      const marketSummary =
        parsed?.marketSummary?.trim() ||
        (responseText.trim() && !parsed ? responseText.trim().slice(0, 320) : `"${rawQuery}" 원단에 대한 검색 결과를 정리했습니다.`);

      const priceRangeText = parsed?.priceRangeText?.trim() || '쇼핑몰별 옵션 확인 필요';
      const shoppingTip =
        parsed?.shoppingTip?.trim() ||
        '주문 전 1마(90cm) 기준인지 반마(45cm) 기준인지와 원단 폭(110cm/145cm)을 꼭 비교해 보세요.';

      res.json({
        query: rawQuery,
        marketSummary,
        priceRangeText,
        shoppingTip,
        candidates,
        sources: sources.slice(0, 8),
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      if (errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: '검색 요청 한도에 도달했습니다. 잠시 후 다시 시도하거나 아래 쇼핑몰 바로검색을 이용해 주세요.',
        });
        return;
      }
      if (errMessage.includes('403') || errMessage.includes('PERMISSION_DENIED') || errMessage.includes('API_KEY_INVALID')) {
        res.status(403).json({
          error: 'API 키 권한을 확인할 수 없습니다. Settings > Secrets 패널에서 GEMINI_API_KEY를 확인해 주세요.',
        });
        return;
      }
      res.status(502).json({
        error: '실시간 원단 검색 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
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
