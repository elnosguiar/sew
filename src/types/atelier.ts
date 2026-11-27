export type TabId = 'home' | 'fabrics' | 'projects' | 'toolbox' | 'calculator';

export type FabricCategory =
  | '린넨'
  | '면/코튼'
  | '캔버스'
  | '데님/트윌'
  | '거즈/이중지'
  | '니트/다이마루'
  | '기타';

export type FabricUnit = '마' | 'm';

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
}
