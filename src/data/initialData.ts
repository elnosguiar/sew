import heroBannerImg from '../assets/images/atelier_hero_banner_1795795552893.jpg';
import fabricCheckCottonImg from '../assets/images/fabric_check_cotton_1795795561329.jpg';
import fabricIndigoDenimImg from '../assets/images/fabric_indigo_denim_1795795553523.jpg';
import fabricLinenIvoryImg from '../assets/images/fabric_linen_ivory_1795795553501.jpg';
import {
  CostRecord,
  FabricCategory,
  FabricItem,
  ProjectChecklistItem,
  ProjectItem,
  ProjectStatus,
} from '../types/atelier';

export const FABRIC_CATEGORIES: FabricCategory[] = [
  '린넨',
  '면/코튼',
  '캔버스',
  '데님/트윌',
  '거즈/이중지',
  '니트/다이마루',
  '기타',
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  '준비 중',
  '작업 중',
  '마무리',
  '제작 완료',
];

export const DEFAULT_PROJECT_CHECKLIST: Array<{ text: string }> = [
  { text: '선세탁 · 스팀 다림질' },
  { text: '패턴 배치 · 시접 재단' },
  { text: '심지 부착 · 초크 표시' },
  { text: '본봉 · 오버록 박기' },
  { text: '완성 다림질 · 실밥 정리' },
];

export function createChecklistFromTemplate(
  items: string[] = DEFAULT_PROJECT_CHECKLIST.map((i) => i.text)
): ProjectChecklistItem[] {
  return items.map((text, idx) => ({
    id: `chk-${Date.now()}-${idx}`,
    text,
    done: false,
  }));
}

export interface ProjectTemplate {
  label: string;
  title: string;
  machineSpec: string;
  memo: string;
  steps: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    label: '에코백',
    title: '데일리 에코백',
    machineSpec: '14호 바늘 · 코아사 40수 · 땀수 3.0mm',
    memo: '바닥 다트 8cm, 어깨끈 길이 62cm(폭 3.5cm 완성). 입구 안단 4cm 두 번 접어 상침.',
    steps: [
      '원단 선세탁 및 다림질',
      '본판 2장 · 끈 2줄 · 안주머니 재단',
      '어깨끈 양끝 0.3cm 상침',
      '본판 합봉 및 바닥 다트 박기',
      '입구 안단 접어 끈 고정 후 상침',
    ],
  },
  {
    label: '린넨 앞치마',
    title: '랩 스타일 린넨 앞치마',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.8mm',
    memo: '어깨끈 길이 68cm, 주머니 위치 허리선 아래 6cm. 밑단 2cm 두 번 접어 박기.',
    steps: [
      '린넨 선세탁 및 결 정리',
      '몸판 · 끈 · 앞주머니 재단',
      '주머니 윗단 박고 몸판에 부착',
      '옆선 · 밑단 말아박기',
      '어깨끈 달고 스팀 마무리',
    ],
  },
  {
    label: '지퍼 파우치',
    title: '사각 지퍼 파우치',
    machineSpec: '11호 바늘 · 지퍼 노루발 · 땀수 2.5mm',
    memo: '겉감에 4온스 접착솜 부착. 창구멍 8cm 남기고 뒤집은 뒤 공그르기 마감.',
    steps: [
      '겉감 · 안감 · 접착솜 재단',
      '겉감에 접착솜 다림질 부착',
      '지퍼 노루발로 지퍼 달기',
      '겉감/안감 합봉 (안감 창구멍 남기기)',
      '뒤집어 다림질 후 창구멍 마감',
    ],
  },
];

export const ATELIER_COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: '내추럴 아이보리', hex: '#EDE7DB' },
  { name: '오트밀 베이지', hex: '#D6CBB8' },
  { name: '세이지 올리브', hex: '#6E7F6B' },
  { name: '딥 인디고', hex: '#2B4157' },
  { name: '월넛 브라운', hex: '#7A5C43' },
  { name: '차콜 그레이', hex: '#434340' },
  { name: '더스티 로즈', hex: '#B88480' },
  { name: '머스타드 오커', hex: '#C29348' },
];

export const STUDIO_SAMPLE_IMAGES: Array<{ label: string; url: string }> = [
  {
    label: '내추럴 워싱 린넨',
    url: fabricLinenIvoryImg,
  },
  {
    label: '인디고 데님 & 샴브레이',
    url: fabricIndigoDenimImg,
  },
  {
    label: '세이지 깅엄 체크 면',
    url: fabricCheckCottonImg,
  },
];

export const HERO_BANNER_IMAGE = heroBannerImg;

export const INITIAL_FABRICS: FabricItem[] = [
  {
    id: 'fab-1',
    name: '프렌치 워싱 린넨 11수',
    colorName: '내추럴 아이보리',
    colorHex: '#EDE7DB',
    category: '린넨',
    quantity: 3.5,
    unit: '마',
    widthCm: 140,
    price: 49000,
    note: '선세탁 완료 · 수축률 약 3%',
    imageUrl: fabricLinenIvoryImg,
    createdAt: '2026-11-10T09:30:00.000Z',
  },
  {
    id: 'fab-2',
    name: '셀비지 워싱 데님 10oz',
    colorName: '딥 인디고',
    colorHex: '#2B4157',
    category: '데님/트윌',
    quantity: 2.0,
    unit: '마',
    widthCm: 145,
    price: 36000,
    note: '단독 물빠짐 세탁 1회 완료',
    imageUrl: fabricIndigoDenimImg,
    createdAt: '2026-11-14T14:20:00.000Z',
  },
  {
    id: 'fab-3',
    name: '선염 깅엄 체크 코튼 40수',
    colorName: '세이지 올리브',
    colorHex: '#6E7F6B',
    category: '면/코튼',
    quantity: 4.0,
    unit: '마',
    widthCm: 110,
    price: 38000,
    note: '소폭 110cm · 파우치/에코백 안감용',
    imageUrl: fabricCheckCottonImg,
    createdAt: '2026-11-18T11:00:00.000Z',
  },
  {
    id: 'fab-4',
    name: '바이오 10수 캔버스 무지',
    colorName: '오트밀 베이지',
    colorHex: '#D6CBB8',
    category: '캔버스',
    quantity: 2.5,
    unit: 'm',
    widthCm: 145,
    price: 27500,
    note: '가방 겉감용 탄탄한 두께',
    imageUrl: null,
    createdAt: '2026-11-21T16:40:00.000Z',
  },
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'prj-1',
    title: '랩 스타일 린넨 앞치마',
    startDate: '2026-11-22',
    status: '작업 중',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 3.0mm',
    memo: '어깨끈 길이 68cm로 재단 완료. 주머니 두 개 달고 밑단 2cm 두 번 접어 박기.',
    fabricId: 'fab-1',
    usedFabricAmount: 1.5,
    fabricDeducted: false,
    checklist: [
      { id: 'c1', text: '린넨 선세탁 및 스팀 다림질', done: true },
      { id: 'c2', text: '몸판 · 어깨끈 · 주머니 재단', done: true },
      { id: 'c3', text: '주머니 윗단 박고 몸판 부착', done: false },
      { id: 'c4', text: '밑단 2cm 말아박기 및 끈 연결', done: false },
    ],
    createdAt: '2026-11-22T10:15:00.000Z',
  },
  {
    id: 'prj-2',
    title: '인디고 데님 데일리 에코백',
    startDate: '2026-11-25',
    status: '준비 중',
    machineSpec: '16호 청바지 바늘 · 30수 실 · 땀수 3.2mm',
    memo: '안감은 오트밀 캔버스 사용 예정. 가방 바닥 다트 8cm, 내부 포켓 지퍼 18cm 준비.',
    fabricId: 'fab-2',
    usedFabricAmount: 1.0,
    fabricDeducted: false,
    checklist: [
      { id: 'c5', text: '겉감 · 안감 · 끈 재단', done: true },
      { id: 'c6', text: '내부 지퍼 포켓 달기', done: false },
      { id: 'c7', text: '바닥 다트 8cm 박기', done: false },
      { id: 'c8', text: '입구 상침 및 끈 고정', done: false },
    ],
    createdAt: '2026-11-25T08:40:00.000Z',
  },
  {
    id: 'prj-3',
    title: '체크 스트링 파우치 2종',
    startDate: '2026-11-05',
    completedDate: '2026-11-12',
    status: '제작 완료',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.5mm',
    memo: '선물용 M/L 사이즈 제작 완료. 면끈 6mm 통과시키고 끝부분 매듭 마감.',
    fabricId: 'fab-3',
    usedFabricAmount: 0.5,
    fabricDeducted: true,
    checklist: [
      { id: 'c9', text: '겉감·안감 재단 및 끈 구멍 표시', done: true },
      { id: 'c10', text: '스트링 채널 박기', done: true },
      { id: 'c11', text: '면끈 통과 후 매듭 마무리', done: true },
    ],
    createdAt: '2026-11-05T13:00:00.000Z',
  },
  {
    id: 'prj-4',
    title: '주방 린넨 티코스터 세트 (4P)',
    startDate: '2026-11-15',
    completedDate: '2026-11-19',
    status: '제작 완료',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.6mm',
    memo: '안쪽 4온스 접착솜 부착 후 창구멍 공그르기 마무리. 세탁 테스트 완료.',
    fabricId: 'fab-1',
    usedFabricAmount: 0.5,
    fabricDeducted: true,
    createdAt: '2026-11-15T15:30:00.000Z',
  },
];

export const INITIAL_COST_RECORDS: CostRecord[] = [
  {
    id: 'cost-1',
    title: '랩 스타일 린넨 앞치마',
    fabricCost: 21000,
    notionsCost: 3500,
    otherCost: 1500,
    totalCost: 26000,
    createdAt: '2026-11-22T11:00:00.000Z',
  },
  {
    id: 'cost-2',
    title: '체크 스트링 파우치 (개당)',
    fabricCost: 4800,
    notionsCost: 1800,
    otherCost: 700,
    totalCost: 7300,
    createdAt: '2026-11-12T17:10:00.000Z',
  },
];
