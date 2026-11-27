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
  widthCm?: number;
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

const ALLOWED_KOREAN_DOMAINS = [
  'doufabric.com',
  '3amsic.com',
  '1000gage.co.kr',
  '1004yo.com',
  'nesshome.com',
  'naver.com',
  'daum.net',
  'tistory.com',
];

function sanitizeKoreanUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return undefined;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isKorean =
      host.endsWith('.kr') ||
      ALLOWED_KOREAN_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    return isKorean ? trimmed : undefined;
  } catch {
    return undefined;
  }
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

const FABRIC_PURPOSE_FALLBACKS: Array<{ pattern: RegExp; keywords: string[] }> = [
  { pattern: /에코백|토트백|가방/, keywords: ['캔버스', '옥스포드'] },
  { pattern: /파우치|지갑/, keywords: ['옥스포드', '선염 체크'] },
  { pattern: /앞치마/, keywords: ['워싱 린넨', '20수 면'] },
  { pattern: /쿠션|커버|커튼|침구/, keywords: ['린넨', '옥스포드'] },
  { pattern: /아기|유아|턱받이|블랭킷|속싸개|배냇/, keywords: ['거즈', '이중거즈'] },
  { pattern: /원피스|의류|블라우스|바지|치마/, keywords: ['린넨', '아사'] },
  { pattern: /티코스터|컵받침|냄비/, keywords: ['린넨', '체크'] },
];

function buildFabricFallbackKeywords(rawQuery: string): string[] {
  const candidates: string[] = [];
  const cleaned = rawQuery
    .replace(/(원단|천|소품|만들기|추천|저렴한|최저가|1마|반마)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned && cleaned !== rawQuery) {
    candidates.push(cleaned);
  }

  for (const rule of FABRIC_PURPOSE_FALLBACKS) {
    if (rule.pattern.test(rawQuery)) {
      candidates.push(...rule.keywords);
    }
  }

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 || t === '면');

  if (tokens.length >= 2) {
    // Last 2 tokens (e.g. "프렌치 워싱 린넨" -> "워싱 린넨", "아기 이중지 거즈" -> "이중지 거즈")
    candidates.push(tokens.slice(-2).join(' '));
  }

  // Try core material tokens from right to left (e.g. "린넨", "거즈", "면")
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token === '면') {
      candidates.push('면 무지');
    } else {
      candidates.push(token);
    }
  }

  // Common material keywords embedded without spaces (e.g. "이중지거즈" -> "거즈")
  const knownMaterials = ['린넨', '캔버스', '옥스포드', '거즈', '누빔', '광목', '데님', '트윌', '아사', '체크', '다이마루', '쭈리', '코듀로이', '무지'];
  for (const mat of knownMaterials) {
    if (rawQuery.includes(mat)) {
      candidates.push(mat);
    }
  }

  const seen = new Set<string>([rawQuery]);
  return candidates.filter((kw) => {
    const k = kw.trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function stripHtmlTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function inferWidthCm(text: string): number | undefined {
  const cmMatch = text.match(/(\d{2,3})\s*cm/i);
  if (cmMatch) {
    const val = Number(cmMatch[1]);
    if (val >= 70 && val <= 260) return val;
  }
  if (/대폭|광폭/.test(text)) return 145;
  if (/소폭/.test(text)) return 110;
  return undefined;
}

function extractEffectiveCafe24Price(block: string): number {
  // 1. Explicit discounted sale price attribute (3amsic / Cafe24 themes)
  const attrSale = block.match(/data-sale-price="([\d,]+)"/)?.[1];
  if (attrSale) {
    const n = Number(attrSale.replace(/,/g, ''));
    if (Number.isFinite(n) && n >= 300 && n <= 200000) return n;
  }

  // 2. Cafe24 discounted price row (할인판매가)
  const saleLi = block.match(/<li[^>]*product_sale_price[\s\S]*?<\/li>/)?.[0];
  if (saleLi) {
    const m = saleLi.match(/([\d,]{3,8})\s*원/);
    if (m) {
      const n = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n >= 300 && n <= 200000) return n;
    }
  }

  // 3. Cafe24 regular selling price row (판매가 - never 소비자가 product_custom!)
  const priceLi = block.match(/<li[^>]*product_price[\s\S]*?<\/li>/)?.[0];
  if (priceLi) {
    const m = priceLi.match(/([\d,]{3,8})\s*원/);
    if (m) {
      const n = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n >= 300 && n <= 200000) return n;
    }
  }

  // 4. Explicit prod price attribute
  const attrProd = block.match(/data-prod-price="([\d,]+)"/)?.[1];
  if (attrProd) {
    const n = Number(attrProd.replace(/,/g, ''));
    if (Number.isFinite(n) && n >= 300 && n <= 200000) return n;
  }

  return 0;
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
    // Split on outer product <li> so nested <li class="product_price"> is always preserved
    const rawParts = html.split(/<li[^>]*id="anchorBoxId_/).slice(1, 18);
    const results: SearchCandidatePayload[] = [];

    for (const part of rawParts) {
      const prodId = part.match(/^(\d+)"/)?.[1] || '';
      const href = part.match(/href="(\/product\/[^"]+)"/)?.[1];

      const nameLinkHtml =
        part.match(/class="df-prl__name[^"]*"[^>]*>([\s\S]*?)<\/a>/)?.[1] ||
        part.match(/<div class="name">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1] ||
        '';
      const rawAlt = part.match(/<img[^>]*alt="([^"]+)"/)?.[1] || '';

      let title = nameLinkHtml
        ? stripHtmlTags(nameLinkHtml).replace(/^상품명\s*:\s*/, '').trim()
        : decodeHtmlEntities(rawAlt);

      if (params.titleSuffixToStrip && title.endsWith(params.titleSuffixToStrip)) {
        title = title.slice(0, -params.titleSuffixToStrip.length).trim();
      }
      if (prodId && title.endsWith(` ${prodId}`)) {
        title = title.slice(0, -prodId.length).trim();
      }
      if (!title) continue;

      const summaryLi = part.match(/<li[^>]*summary_desc[\s\S]*?<\/li>/)?.[0] || '';
      const summaryText = summaryLi
        ? stripHtmlTags(summaryLi).replace(/^상품요약정보\s*:\s*/, '').trim()
        : '';

      const price = extractEffectiveCafe24Price(part);
      if (!Number.isFinite(price) || price < 500 || price > 200000) continue;
      if (price < 1300 && /샘플|스와치|견본|10cm/i.test(title)) continue;

      const specText = `${title} ${summaryText}`;
      const unit = inferUnitFromTitle(specText);
      const widthCm = inferWidthCm(specText);
      const isPack = /1\+1|묶음|패키지|컷트지/i.test(title);
      const noteParts = [
        isPack ? '묶음/세트 상품 (상세 길이 확인)' : '실시간 쇼핑몰 판매가',
        widthCm ? `폭 ${widthCm}cm` : '',
        summaryText && summaryText.length <= 40 ? summaryText : '',
      ].filter(Boolean);

      results.push({
        mallName: params.mallName,
        productTitle: title,
        estimatedPricePerYard: price,
        unit,
        shippingFee: params.shippingFee,
        freeShippingThreshold: params.freeShippingThreshold,
        widthCm,
        note: noteParts.join(' · '),
        url: href ? `${params.baseUrl}${href}` : params.searchUrl,
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function fetch1000gageProducts(keyword: string): Promise<{
  items: SearchCandidatePayload[];
  searchUrl: string;
}> {
  const searchUrl = `https://www.1000gage.co.kr/shop/shopbrand.html?search=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return { items: [], searchUrl };
    const html = await res.text();
    const listArea = html.split('<div class="prd-list">')[1]?.split('<!-- //prd-list')[0] || '';
    const cells = listArea.split('<div class="tb-center">').slice(1, 14);
    const items: SearchCandidatePayload[] = [];

    for (const cell of cells) {
      const branduid = cell.match(/branduid=(\d+)/)?.[1];
      const titleRaw = cell.match(/<li class="dsc">([\s\S]*?)<\/li>/)?.[1] || '';
      const title = stripHtmlTags(titleRaw);
      if (!title) continue;

      const subRaw = cell.match(/<li class="subname">([\s\S]*?)<\/li>/)?.[1] || '';
      const subText = stripHtmlTags(subRaw);

      const priceHtml = cell.match(/<span class="price">([\s\S]*?)<\/span>/)?.[1] || '';
      const priceMatch = priceHtml.match(/([\d,]{3,8})\s*원/);
      const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 0;
      if (!Number.isFinite(price) || price < 500 || price > 200000) continue;
      if (price < 1300 && /샘플|스와치|견본|10cm/i.test(title)) continue;

      const specText = `${title} ${subText}`;
      const unit = inferUnitFromTitle(specText);
      const widthCm = inferWidthCm(specText);
      const isPack = /1\+1|묶음|패키지|컷트지/i.test(title);
      const noteParts = [
        isPack ? '묶음/세트 상품 (상세 길이 확인)' : '실시간 쇼핑몰 판매가',
        widthCm ? `폭 ${widthCm}cm` : '',
      ].filter(Boolean);

      items.push({
        mallName: '천가게',
        productTitle: title,
        estimatedPricePerYard: price,
        unit,
        shippingFee: 3000,
        freeShippingThreshold: 50000,
        widthCm,
        note: noteParts.join(' · '),
        url: branduid
          ? `https://www.1000gage.co.kr/shop/shopdetail.html?branduid=${branduid}`
          : searchUrl,
      });
    }

    return { items, searchUrl };
  } catch {
    return { items: [], searchUrl };
  }
}

async function fetch1004yoProducts(keyword: string): Promise<{
  items: SearchCandidatePayload[];
  searchUrl: string;
}> {
  const searchUrl = `https://1004yo.com/shop/shopbrand.html?search=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return { items: [], searchUrl };
    const buf = await res.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);
    const listArea = html.split('class="prdList')[1] || '';
    const cells = listArea.split(/<li class="item"/).slice(1, 14);
    const items: SearchCandidatePayload[] = [];

    for (const cell of cells) {
      const branduid = cell.match(/branduid=(\d+)/)?.[1];
      const nameHtml = cell.match(/<p class="name">([\s\S]*?)<\/p>/)?.[1] || '';
      const cleanedNameHtml = nameHtml.replace(/<div[^>]*display\s*:\s*none[^>]*>[\s\S]*?<\/div>/gi, ' ');
      const title = stripHtmlTags(cleanedNameHtml);
      if (!title) continue;

      const priceMatch = cell.match(/<li class="price">\s*([\d,]{3,8})\s*원/);
      const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 0;
      if (!Number.isFinite(price) || price < 500 || price > 200000) continue;
      if (price < 1300 && /샘플|스와치|견본|10cm/i.test(title)) continue;

      const unit = inferUnitFromTitle(title);
      const widthCm = inferWidthCm(title);
      const isPack = /1\+1|묶음|패키지|컷트지/i.test(title);
      const noteParts = [
        isPack ? '묶음/세트 상품 (상세 길이 확인)' : '실시간 쇼핑몰 판매가',
        widthCm ? `폭 ${widthCm}cm` : '',
      ].filter(Boolean);

      items.push({
        mallName: '천싸요',
        productTitle: title,
        estimatedPricePerYard: price,
        unit,
        shippingFee: 3000,
        freeShippingThreshold: 50000,
        widthCm,
        note: noteParts.join(' · '),
        url: branduid
          ? `https://1004yo.com/shop/shopdetail.html?branduid=${branduid}`
          : searchUrl,
      });
    }

    return { items, searchUrl };
  } catch {
    return { items: [], searchUrl };
  }
}

async function queryMallsOnce(keyword: string): Promise<{
  douItems: SearchCandidatePayload[];
  samsikItems: SearchCandidatePayload[];
  gageItems: SearchCandidatePayload[];
  sayoItems: SearchCandidatePayload[];
  douUrl: string;
  samsikUrl: string;
  gageUrl: string;
  sayoUrl: string;
}> {
  const encoded = encodeURIComponent(keyword);
  const douUrl = `https://doufabric.com/product/search.html?keyword=${encoded}`;
  const samsikUrl = `https://3amsic.com/product/search.html?keyword=${encoded}`;

  const [douItems, samsikItems, gageRes, sayoRes] = await Promise.all([
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
    fetch1000gageProducts(keyword),
    fetch1004yoProducts(keyword),
  ]);

  return {
    douItems,
    samsikItems,
    gageItems: gageRes.items,
    sayoItems: sayoRes.items,
    douUrl,
    samsikUrl,
    gageUrl: gageRes.searchUrl,
    sayoUrl: sayoRes.searchUrl,
  };
}

function isRelevantFabricProduct(title: string, rawQuery: string): boolean {
  if (!/(패턴|도안)/i.test(rawQuery) && /(가방패턴|종이패턴|실물패턴|\[P\d+\])/i.test(title)) {
    return false;
  }
  if (
    !/(웨이빙|가방끈|스트랩|지퍼|라벨|단추|바늘|실|바이어스)/i.test(rawQuery) &&
    /(웨이빙|가방끈|스트랩|지퍼|라벨|단추|바이어스)/i.test(title)
  ) {
    return false;
  }
  if (!/(배경지|촬영)/i.test(rawQuery) && /촬영용\s*배경지/i.test(title)) {
    return false;
  }
  return true;
}

async function fetchLiveKoreanFabricStores(
  query: string
): Promise<{
  candidates: SearchCandidatePayload[];
  sources: Array<{ title: string; uri: string }>;
  matchedKeyword: string;
}> {
  const filterItems = (items: SearchCandidatePayload[]) =>
    items.filter((item) => isRelevantFabricProduct(item.productTitle, query));

  const primary = await queryMallsOnce(query);
  const pDou = filterItems(primary.douItems);
  const pGage = filterItems(primary.gageItems);
  const pSayo = filterItems(primary.sayoItems);
  const pSamsik = filterItems(primary.samsikItems);

  let allItems = [
    ...pDou.slice(0, 3),
    ...pGage.slice(0, 3),
    ...pSayo.slice(0, 3),
    ...pSamsik.slice(0, 3),
  ];
  const sources: Array<{ title: string; uri: string }> = [];
  let matchedKeyword = query;

  if (pDou.length > 0) {
    sources.push({ title: `도우패브릭 "${query}" 검색 결과`, uri: primary.douUrl });
  }
  if (pGage.length > 0) {
    sources.push({ title: `천가게 "${query}" 검색 결과`, uri: primary.gageUrl });
  }
  if (pSayo.length > 0) {
    sources.push({ title: `천싸요 "${query}" 검색 결과`, uri: primary.sayoUrl });
  }
  if (pSamsik.length > 0) {
    sources.push({ title: `삼식이원단 "${query}" 검색 결과`, uri: primary.samsikUrl });
  }

  // Fallback to simplified Korean fabric keywords if exact phrase returned too few results
  if (allItems.length < 4) {
    const fallbacks = buildFabricFallbackKeywords(query).slice(0, 3);
    for (const fb of fallbacks) {
      const res = await queryMallsOnce(fb);
      const fDou = filterItems(res.douItems);
      const fGage = filterItems(res.gageItems);
      const fSayo = filterItems(res.sayoItems);
      const fSamsik = filterItems(res.samsikItems);
      const fbItems = [
        ...fDou.slice(0, 3),
        ...fGage.slice(0, 3),
        ...fSayo.slice(0, 3),
        ...fSamsik.slice(0, 3),
      ];
      if (fbItems.length > 0) {
        if (allItems.length === 0) {
          matchedKeyword = fb;
        }
        allItems = [...allItems, ...fbItems];
        if (fDou.length > 0) {
          sources.push({ title: `도우패브릭 "${fb}" 검색 결과`, uri: res.douUrl });
        }
        if (fGage.length > 0) {
          sources.push({ title: `천가게 "${fb}" 검색 결과`, uri: res.gageUrl });
        }
        if (fSayo.length > 0) {
          sources.push({ title: `천싸요 "${fb}" 검색 결과`, uri: res.sayoUrl });
        }
        if (fSamsik.length > 0) {
          sources.push({ title: `삼식이원단 "${fb}" 검색 결과`, uri: res.samsikUrl });
        }
        if (allItems.length >= 8) break;
      }
    }
  }

  // Always include working Naver Shopping search link (zero foreign URLs)
  sources.push({
    title: `네이버쇼핑 "${query}" 원단 가격비교`,
    uri: `https://search.naver.com/search.naver?where=shopping&query=${encodeURIComponent(`${query} 원단`)}`,
  });

  // Deduplicate & sort cheapest normalized 1-yard price first
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    const k = `${item.mallName}:${item.productTitle}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const sortByPrice = (a: SearchCandidatePayload, b: SearchCandidatePayload) => {
    const aIsPack = /1\+1|묶음|세트/i.test(a.productTitle) ? 1 : 0;
    const bIsPack = /1\+1|묶음|세트/i.test(b.productTitle) ? 1 : 0;
    if (aIsPack !== bIsPack) return aIsPack - bIsPack;
    return (
      normalizePricePerYard(a.estimatedPricePerYard, a.unit) -
      normalizePricePerYard(b.estimatedPricePerYard, b.unit)
    );
  };

  deduped.sort(sortByPrice);

  // Pick up to 2 cheapest from each mall first so multiple malls are represented, then fill up to 8
  const picked: SearchCandidatePayload[] = [];
  const mallCounts = new Map<string, number>();
  for (const item of deduped) {
    const count = mallCounts.get(item.mallName) ?? 0;
    if (count < 2) {
      picked.push(item);
      mallCounts.set(item.mallName, count + 1);
    }
    if (picked.length >= 8) break;
  }
  if (picked.length < 8) {
    for (const item of deduped) {
      if (!picked.includes(item)) {
        picked.push(item);
      }
      if (picked.length >= 8) break;
    }
  }
  picked.sort(sortByPrice);

  return {
    candidates: picked,
    sources: sources.slice(0, 6),
    matchedKeyword,
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
    '한국 원단 쇼핑몰(도우패브릭, 천가게, 천싸요, 삼식이원단, 네스홈, 네이버 쇼핑)의 시세와 판매 정보만 정리하세요. 해외 사이트는 제외하세요.',
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
    '      "url": "한국 쇼핑몰 URL"',
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
        const uri = sanitizeKoreanUrl(chunk.web?.uri);
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
              url: sanitizeKoreanUrl(item.url),
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

function extractVideosFromYtData(root: unknown): YouTubeVideoItem[] {
  const videos: YouTubeVideoItem[] = [];
  const seenIds = new Set<string>();

  function walk(node: unknown) {
    if (!node || typeof node !== 'object' || videos.length >= 8) return;

    const obj = node as Record<string, unknown>;
    const vr = obj.videoRenderer as Record<string, unknown> | undefined;
    if (vr && typeof vr.videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(vr.videoId)) {
      if (!seenIds.has(vr.videoId)) {
        const titleObj = vr.title as
          | { runs?: Array<{ text?: string }>; simpleText?: string }
          | undefined;
        const title =
          titleObj?.runs?.map((r) => r.text ?? '').join('').trim() ||
          titleObj?.simpleText?.trim() ||
          '';

        if (title) {
          seenIds.add(vr.videoId);
          const longByline = vr.longBylineText as
            | { runs?: Array<{ text?: string }> }
            | undefined;
          const ownerText = vr.ownerText as
            | { runs?: Array<{ text?: string }> }
            | undefined;
          const channel =
            longByline?.runs?.[0]?.text?.trim() ||
            ownerText?.runs?.[0]?.text?.trim() ||
            '유튜브 크리에이터';

          const lengthText = (vr.lengthText as { simpleText?: string } | undefined)?.simpleText;
          const viewCountText = (vr.viewCountText as { simpleText?: string } | undefined)
            ?.simpleText;

          videos.push({
            videoId: vr.videoId,
            title,
            channel,
            lengthText,
            viewCountText,
            thumbnailUrl: `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
            watchUrl: `https://www.youtube.com/watch?v=${vr.videoId}`,
          });
        }
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
    } else {
      for (const value of Object.values(obj)) walk(value);
    }
  }

  walk(root);
  return videos;
}

async function fetchYouTubeVideosOnce(searchQuery: string): Promise<YouTubeVideoItem[]> {
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

  // Primary: parse ytInitialData JSON reliably regardless of key ordering
  const jsonMatch = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as unknown;
      const fromData = extractVideosFromYtData(parsed);
      if (fromData.length > 0) return fromData;
    } catch {
      // Fallback to youtubei/v1/search below
    }
  }

  // Secondary: YouTube internal search API (works cleanly without HTML shell scraping)
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  if (apiKey) {
    try {
      const apiRes = await fetch(
        `https://www.youtube.com/youtubei/v1/search?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': BROWSER_UA,
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: 'WEB',
                clientVersion: '2.20250101.00.00',
                hl: 'ko',
                gl: 'KR',
              },
            },
            query: searchQuery,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (apiRes.ok) {
        const apiJson = (await apiRes.json()) as unknown;
        const fromApi = extractVideosFromYtData(apiJson);
        if (fromApi.length > 0) return fromApi;
      }
    } catch {
      // Return empty if both fail
    }
  }

  return [];
}

async function searchYouTubeSewingTutorials(rawQuery: string): Promise<{
  videos: YouTubeVideoItem[];
  usedQuery: string;
}> {
  const hasSewingKeyword = /재봉틀|미싱|소잉|sewing|diy|만들기/i.test(rawQuery);
  const primaryQuery = hasSewingKeyword ? rawQuery : `재봉틀 ${rawQuery} 만들기`;

  const firstAttempt = await fetchYouTubeVideosOnce(primaryQuery);
  if (firstAttempt.length > 0) {
    return { videos: firstAttempt, usedQuery: primaryQuery };
  }

  // Simplify overly specific multi-word queries (e.g. "재봉틀 에코백 만들기 안감 바닥다트" -> "재봉틀 에코백 만들기")
  const coreTokens = rawQuery
    .replace(/(재봉틀|미싱|소잉|만들기|도안|기초|무료|안감|바닥다트|원피스형|자투리|원단)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (coreTokens.length > 0) {
    const simplified = `재봉틀 ${coreTokens.slice(0, 2).join(' ')} 만들기`;
    if (simplified !== primaryQuery) {
      const secondAttempt = await fetchYouTubeVideosOnce(simplified);
      if (secondAttempt.length > 0) {
        return { videos: secondAttempt, usedQuery: simplified };
      }
    }

    if (coreTokens.length > 1) {
      const shortest = `재봉틀 ${coreTokens[0]} 만들기`;
      const thirdAttempt = await fetchYouTubeVideosOnce(shortest);
      if (thirdAttempt.length > 0) {
        return { videos: thirdAttempt, usedQuery: shortest };
      }
    }
  }

  return { videos: [], usedQuery: primaryQuery };
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

      // Sort merged candidates by effective total (including shipping fee / free-shipping threshold) for neededYards
      const computeEffectiveTotal = (c: SearchCandidatePayload) => {
        const perYard = normalizePricePerYard(c.estimatedPricePerYard, c.unit);
        const merch = Math.round(perYard * neededYards);
        const isFree =
          c.shippingFee <= 0 ||
          (c.freeShippingThreshold > 0 && merch >= c.freeShippingThreshold);
        return merch + (isFree ? 0 : c.shippingFee);
      };

      mergedCandidates.sort((a, b) => {
        const aIsPack = /1\+1|묶음|세트/i.test(a.productTitle) ? 1 : 0;
        const bIsPack = /1\+1|묶음|세트/i.test(b.productTitle) ? 1 : 0;
        if (aIsPack !== bIsPack) return aIsPack - bIsPack;
        return computeEffectiveTotal(a) - computeEffectiveTotal(b);
      });

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

      const keywordNote =
        liveStoreData.matchedKeyword !== rawQuery
          ? ` (핵심 키워드 "${liveStoreData.matchedKeyword}" 기준 검색)`
          : '';

      const marketSummary =
        geminiData?.marketSummary ||
        (mergedCandidates.length > 0
          ? `국내 원단 쇼핑몰에서 "${rawQuery}"${keywordNote} 실시간 판매 상품 ${mergedCandidates.length}건을 찾았습니다. 배송비와 1마·반마 단위를 확인해 비교표에 담아보세요.`
          : `"${rawQuery}"와 정확히 일치하는 실시간 상품이 적어 아래 국내 원단 쇼핑몰 바로검색 링크를 준비했습니다.`);

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
        sources: mergedSources.slice(0, 6),
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

    const fallbackSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      /재봉틀|미싱|만들기/i.test(rawQuery) ? rawQuery : `재봉틀 ${rawQuery} 만들기`
    )}`;

    try {
      const { videos, usedQuery } = await searchYouTubeSewingTutorials(rawQuery);
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(usedQuery)}`;
      res.json({
        query: rawQuery,
        searchUrl,
        videos,
      });
    } catch {
      res.status(502).json({
        error: '유튜브 추천 영상을 불러오는 중 일시적인 오류가 발생했습니다.',
        searchUrl: fallbackSearchUrl,
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
