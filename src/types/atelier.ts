export type TabId = 'home' | 'compare' | 'fabrics' | 'projects' | 'toolbox' | 'calculator';

export type FabricCategory =
  | '린넨'
  | '면/코튼'
  | '캔버스'
  | '데님/트윌'
  | '거즈/이중지'
  | '니트/다이마루'
  | '기타';

export type FabricUnit = '마' | 'm';

export type PriceUnit = '1마' | '반마' | '1m' | '1야드';

export interface FabricItem {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  category: FabricCategory;
  quantity: number;
  unit: FabricUnit;
  widthCm?: number;
  price: number;
  note?: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface FabricComparisonItem {
  id: string;
  fabricName: string;
  mallName: string;
  unit: PriceUnit;
  unitPrice: number;
  shippingFee: number;
  freeShippingThreshold: number;
  widthCm?: number;
  productUrl?: string;
  note?: string;
  createdAt: string;
}

export type FabricMallCategory =
  | '가성비 무지'
  | '종합/부자재'
  | '의류/트렌드'
  | '감성 린넨/프린트'
  | '오픈마켓/최저가';

export interface FabricMallInfo {
  id: string;
  name: string;
  category: FabricMallCategory;
  url: string;
  searchUrlTemplate: string;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  priceTier: '실속 최저가' | '가성비 우수' | '중저가~중가' | '디자이너/중고가';
  highlight: string;
  pros: string;
  cons: string;
  bestFor: string[];
  shippingTip: string;
}

export interface FabricSearchCandidate {
  mallName: string;
  productTitle: string;
  estimatedPricePerYard: number;
  unit: PriceUnit;
  shippingFee: number;
  freeShippingThreshold: number;
  widthCm?: number;
  note: string;
  url?: string;
}

export interface FabricSearchSource {
  title: string;
  uri: string;
}

export interface FabricSearchResponse {
  query: string;
  marketSummary: string;
  priceRangeText: string;
  shoppingTip: string;
  candidates: FabricSearchCandidate[];
  sources: FabricSearchSource[];
}

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channel: string;
  lengthText?: string;
  viewCountText?: string;
  thumbnailUrl: string;
  watchUrl: string;
}

export interface YouTubeSearchResponse {
  query: string;
  searchUrl: string;
  videos: YouTubeVideoItem[];
}

export type ProjectStatus = '준비 중' | '작업 중' | '마무리' | '제작 완료';

export interface ProjectChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  startDate: string;
  completedDate?: string;
  status: ProjectStatus;
  memo: string;
  machineSpec?: string;
  fabricId?: string;
  usedFabricAmount?: number;
  fabricDeducted?: boolean;
  checklist?: ProjectChecklistItem[];
  completedImageUrl?: string | null;
  createdAt: string;
}

export interface CostRecord {
  id: string;
  title: string;
  fabricCost: number;
  notionsCost: number;
  otherCost: number;
  totalCost: number;
  createdAt: string;
}

export interface AtelierBackupPayload {
  version: 1;
  exportedAt: string;
  fabrics: FabricItem[];
  projects: ProjectItem[];
  costRecords: CostRecord[];
  comparisons?: FabricComparisonItem[];
}
