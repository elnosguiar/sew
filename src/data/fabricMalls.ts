import {
  FabricComparisonItem,
  FabricMallCategory,
  FabricMallInfo,
  PriceUnit,
} from '../types/atelier';

export const PRICE_UNITS: Array<{ value: PriceUnit; label: string; lengthCm: number }> = [
  { value: '1마', label: '1마 (90cm)', lengthCm: 90 },
  { value: '반마', label: '반마 (45cm)', lengthCm: 45 },
  { value: '1야드', label: '1야드 (91.4cm)', lengthCm: 91.4 },
  { value: '1m', label: '1m (100cm)', lengthCm: 100 },
];

export const MALL_CATEGORIES: Array<'전체' | FabricMallCategory> = [
  '전체',
  '가성비 무지',
  '종합/부자재',
  '의류/트렌드',
  '감성 린넨/프린트',
  '오픈마켓/최저가',
];

export const QUICK_FABRIC_SEARCH_KEYWORDS: string[] = [
  '30수 무지 면',
  '워싱 린넨',
  '10수 캔버스',
  '아기 이중지 거즈',
  '누빔 원단',
  '체크 선염 면',
];

export const KOREAN_FABRIC_MALLS: FabricMallInfo[] = [
  {
    id: 'doufabric',
    name: '도우패브릭',
    category: '가성비 무지',
    url: 'https://doufabric.com',
    searchUrlTemplate: 'https://doufabric.com/product/search.html?keyword={query}',
    defaultShippingFee: 2500,
    freeShippingThreshold: 50000,
    priceTier: '실속 최저가',
    highlight: '기본 무지 면·광목·옥스포드 원단 마당 단가가 동대문 도매 수준으로 저렴한 실속 몰',
    pros: '솔리드(무지) 원단 단가가 매우 싸고 기본 배송비(2,500원)도 부담이 적음',
    cons: '감성 일러스트 프린트나 수입 원단 종류는 상대적으로 적은 편',
    bestFor: ['무지 20수/30수/40수 면', '광목·소창', '옥스포드 무지', '에코백 안감'],
    shippingTip: '기본 배송비 2,500원 · 5만 원 이상 무료배송',
  },
  {
    id: '1000gage',
    name: '천가게',
    category: '종합/부자재',
    url: 'https://www.1000gage.co.kr',
    searchUrlTemplate: 'https://www.1000gage.co.kr/shop/shopbrand.html?search={query}',
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    priceTier: '가성비 우수',
    highlight: '자체 브랜드(잇츠패브릭) 가성비가 뛰어나고 원단·부자재를 한 번에 묶음 구매하기 좋은 대형 몰',
    pros: '두께감·비침·수축률 안내가 친절하고 실·지퍼·접착솜 등 부자재 합배송에 유리',
    cons: '인기 특가 원단은 품절이 빠른 편',
    bestFor: ['잇츠패브릭 면/린넨', '누빔·방수 원단', '디즈니/캐릭터', '부자재 합배송'],
    shippingTip: '평소 5만 원 이상 무료 · 매주 수요일 앱 3만 원 이상 무료배송 쿠폰',
  },
  {
    id: '1004yo',
    name: '천싸요',
    category: '가성비 무지',
    url: 'https://1004yo.com',
    searchUrlTemplate: 'https://1004yo.com/shop/shopbrand.html?search={query}',
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    priceTier: '가성비 우수',
    highlight: '원단 종류가 방대하고 데일리 면·선염 체크·자투리 특가 코너가 알찬 대형 가성비 몰',
    pros: '1마 기준 가격이 전반적으로 합리적이고 대폭 커튼/침구지 및 자투리 할인 상품이 많음',
    cons: '인기 컬러는 재입고까지 시간이 걸릴 수 있음',
    bestFor: ['선염 체크/스트라이프', '가성비 린넨', '대폭 145cm 홈패션', '자투리 묶음'],
    shippingTip: '기본 배송비 3,000원 · 5만 원 이상 무료배송',
  },
  {
    id: '3amsic',
    name: '삼식이원단',
    category: '의류/트렌드',
    url: 'https://3amsic.com',
    searchUrlTemplate: 'https://3amsic.com/product/search.html?keyword={query}',
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    priceTier: '중저가~중가',
    highlight: '트렌디한 의류용 다이마루·워싱 면·거즈 신상이 빠르게 올라오고 기획전이 많은 쇼핑몰',
    pros: '아이옷·원피스·데일리룩 원단 색감이 예쁘고 시즌 기획 세일 할인 폭이 큼',
    cons: '5만 원 미만 소량 구매 시 3,000원 배송비 부담 확인 필요',
    bestFor: ['의류용 다이마루/쭈리', '워싱 60수 아사/면', '이중지 거즈', '린넨 원피스지'],
    shippingTip: '기본 배송비 3,000원 · 5만 원 이상 무료배송',
  },
  {
    id: 'nesshome',
    name: '네스홈',
    category: '감성 린넨/프린트',
    url: 'https://www.nesshome.com',
    searchUrlTemplate: 'https://www.nesshome.com/product/search.html?keyword={query}',
    defaultShippingFee: 3000,
    freeShippingThreshold: 50000,
    priceTier: '디자이너/중고가',
    highlight: '독창적인 자체 디자인 프린트와 블랙라벨 퓨어 린넨으로 유명한 감성 패브릭 몰',
    pros: '퀄리티와 색감이 고급스러워 선물용 파우치·앞치마·의류 완성도가 높아짐',
    cons: '일반 무지 원단 대비 마당 단가가 높은 편이라 세일·리퍼브 코너 공략 추천',
    bestFor: ['자체 디자인 프린트', '블랙라벨 퓨어린넨', '파우치·앞치마 포인트', '쿠션/패브릭 포스터'],
    shippingTip: '조건부 무료배송(시즌 이벤트·쿠폰 확인 추천)',
  },
  {
    id: 'naver-shopping',
    name: '네이버쇼핑 원단 비교',
    category: '오픈마켓/최저가',
    url: 'https://search.naver.com/search.naver?where=shopping&query=%EC%9B%90%EB%8B%A8',
    searchUrlTemplate: 'https://search.naver.com/search.naver?where=shopping&query={query}+원단',
    defaultShippingFee: 3000,
    freeShippingThreshold: 30000,
    priceTier: '실속 최저가',
    highlight: '동대문 소매 스마트스토어들과 여러 쇼핑몰의 1~2마 소량 최저가를 한 번에 검색',
    pros: '3만 원 무료배송 스토어나 네이버 멤버십 적립 덕분에 소량 단품 구매 시 유리한 경우 많음',
    cons: '반마(45cm) 가격을 대표가로 노출하는 판매자가 많아 1마 환산 단가 확인 필수',
    bestFor: ['1~2마 소량 구매', '동대문 직영 스토어', '컷트지/자투리 특가', '실시간 최저가 탐색'],
    shippingTip: '스토어별 3~5만 원 무료배송 · 반마/1마 단위 꼭 확인',
  },
];

export const INITIAL_FABRIC_COMPARISONS: FabricComparisonItem[] = [
  {
    id: 'cmp-1',
    fabricName: '30수 순면 무지 (110cm · 에코백/소품)',
    mallName: '도우패브릭',
    unit: '1마',
    unitPrice: 3400,
    shippingFee: 2500,
    freeShippingThreshold: 50000,
    widthCm: 110,
    productUrl: 'https://doufabric.com/product/search.html?keyword=30%EC%88%98%20%EB%AC%B4%EC%A7%80',
    note: '무지 기본가 저렴 · 2,500원 배송비',
    createdAt: '2026-11-24T09:00:00.000Z',
  },
  {
    id: 'cmp-2',
    fabricName: '30수 순면 무지 (110cm · 잇츠패브릭)',
    mallName: '천가게',
    unit: '반마',
    unitPrice: 1850,
    shippingFee: 3000,
    freeShippingThreshold: 50000,
    widthCm: 110,
    productUrl: 'https://www.1000gage.co.kr/shop/shopbrand.html?search=30%EC%88%98%20%EB%AC%B4%EC%A7%80',
    note: '반마(45cm) 기준 1,850원 → 1마 환산 3,700원 · 수요일 앱 3만원 무배',
    createdAt: '2026-11-24T09:10:00.000Z',
  },
  {
    id: 'cmp-3',
    fabricName: '30수 바이오 워싱 면 무지',
    mallName: '천싸요',
    unit: '1마',
    unitPrice: 3900,
    shippingFee: 3000,
    freeShippingThreshold: 50000,
    widthCm: 110,
    productUrl: 'https://1004yo.com/shop/shopbrand.html?search=30%EC%88%98%20%EB%AC%B4%EC%A7%80',
    note: '바이오 워싱 가공 포함 · 색상 다양',
    createdAt: '2026-11-24T09:20:00.000Z',
  },
  {
    id: 'cmp-4',
    fabricName: '동대문 30수 트윌 면 무지 (소량)',
    mallName: '네이버쇼핑 원단 비교',
    unit: '1마',
    unitPrice: 4100,
    shippingFee: 0,
    freeShippingThreshold: 0,
    widthCm: 110,
    productUrl: 'https://search.naver.com/search.naver?where=shopping&query=30%EC%88%98%20%EB%A9%B4%20%EB%AC%B4%EC%A7%80%20%EC%9B%90%EB%8B%A8',
    note: '배송비 무료 조건 스토어 예시 (소량 1~2마 살 때 유리)',
    createdAt: '2026-11-24T09:30:00.000Z',
  },
];

export function normalizePricePerYard(unitPrice: number, unit: PriceUnit): number {
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  switch (unit) {
    case '1마':
      return safePrice;
    case '반마':
      return safePrice * 2;
    case '1m':
      // 1m = 100cm, 1마 = 90cm -> price for 90cm = price * 0.9
      return Math.round(safePrice * 0.9);
    case '1야드':
      // 1yd = 91.4cm, 1마 = 90cm
      return Math.round(safePrice * (90 / 91.4));
    default:
      return safePrice;
  }
}

export interface ComparisonCalculation {
  normalizedPerYard: number;
  merchandiseTotal: number;
  isFreeShipping: boolean;
  appliedShipping: number;
  effectiveTotal: number;
  effectivePerYard: number;
  remainingForFreeShipping: number;
}

export function calculateComparisonMetrics(
  item: FabricComparisonItem,
  neededYards: number
): ComparisonCalculation {
  const safeYards = Math.max(0.5, Number(neededYards) || 1);
  const normalizedPerYard = normalizePricePerYard(item.unitPrice, item.unit);
  const merchandiseTotal = Math.round(normalizedPerYard * safeYards);

  const isFreeShipping =
    item.shippingFee <= 0 ||
    (item.freeShippingThreshold > 0 && merchandiseTotal >= item.freeShippingThreshold);

  const appliedShipping = isFreeShipping ? 0 : Math.max(0, item.shippingFee);
  const effectiveTotal = merchandiseTotal + appliedShipping;
  const effectivePerYard = Math.round(effectiveTotal / safeYards);
  const remainingForFreeShipping =
    !isFreeShipping && item.freeShippingThreshold > 0
      ? Math.max(0, item.freeShippingThreshold - merchandiseTotal)
      : 0;

  return {
    normalizedPerYard,
    merchandiseTotal,
    isFreeShipping,
    appliedShipping,
    effectiveTotal,
    effectivePerYard,
    remainingForFreeShipping,
  };
}

export function buildMallSearchUrl(mall: FabricMallInfo, query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return mall.url;
  return mall.searchUrlTemplate.replace('{query}', encodeURIComponent(trimmed));
}

export function repairFabricProductUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  let trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (/^javascript:/i.test(trimmed)) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Fix broken 천가게 URL (/shop/search.php -> /shop/shopbrand.html?search=)
    if (host.includes('1000gage.co.kr') && parsed.pathname.includes('search.php')) {
      const q = parsed.searchParams.get('search_text') || parsed.searchParams.get('search') || '';
      return q
        ? `https://www.1000gage.co.kr/shop/shopbrand.html?search=${encodeURIComponent(q)}`
        : 'https://www.1000gage.co.kr';
    }

    // Fix broken 천싸요 URL (/product/search.html -> /shop/shopbrand.html?search=)
    if (host.includes('1004yo.com') && parsed.pathname.includes('/product/search.html')) {
      const q = parsed.searchParams.get('keyword') || parsed.searchParams.get('search') || '';
      return q
        ? `https://1004yo.com/shop/shopbrand.html?search=${encodeURIComponent(q)}`
        : 'https://1004yo.com';
    }

    // Fix broken 네스홈 URL (/shop/shopbrand.html -> /product/search.html?keyword=)
    if (host.includes('nesshome.com') && parsed.pathname.includes('shopbrand.html')) {
      const q = parsed.searchParams.get('search') || parsed.searchParams.get('keyword') || '';
      return q
        ? `https://www.nesshome.com/product/search.html?keyword=${encodeURIComponent(q)}`
        : 'https://www.nesshome.com';
    }

    // Fix Naver Shopping redirect/418 URL -> Naver Shopping unified search
    if (host === 'search.shopping.naver.com' || host === 'shopping.naver.com') {
      const q = parsed.searchParams.get('query') || '';
      return q
        ? `https://search.naver.com/search.naver?where=shopping&query=${encodeURIComponent(q)}`
        : 'https://search.naver.com/search.naver?where=shopping&query=%EC%9B%90%EB%8B%A8';
    }

    if (
      parsed.protocol === 'http:' &&
      /(doufabric\.com|1000gage\.co\.kr|1004yo\.com|3amsic\.com|nesshome\.com|naver\.com)$/i.test(
        host
      )
    ) {
      parsed.protocol = 'https:';
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function resolveComparisonSiteUrl(item: {
  productUrl?: string;
  mallName: string;
  fabricName: string;
}): string {
  const repaired = repairFabricProductUrl(item.productUrl);
  if (repaired) return repaired;

  const compactMall = item.mallName.replace(/\s+/g, '');
  const matchedMall = KOREAN_FABRIC_MALLS.find((m) => {
    const compactName = m.name.replace(/\s+/g, '');
    return (
      compactName === compactMall ||
      compactMall.includes(compactName) ||
      compactName.includes(compactMall)
    );
  });
  const cleanQuery = item.fabricName.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (matchedMall) {
    return buildMallSearchUrl(matchedMall, cleanQuery);
  }
  return `https://search.naver.com/search.naver?where=shopping&query=${encodeURIComponent(
    `${item.mallName} ${cleanQuery} 원단`.trim()
  )}`;
}
