export type PatternShapeType =
  | 'ecobag'
  | 'pouch'
  | 'apron'
  | 'drawstring'
  | 'bottle'
  | 'cushion'
  | 'coaster'
  | 'bib';

export interface PatternCutPart {
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  seamCm: number;
  note?: string;
}

export interface SewingPatternGuide {
  id: string;
  title: string;
  category: '가방 · 파우치' | '주방 · 리빙' | '유아 · 선물';
  difficulty: '초입문' | '입문' | '초중급';
  estimatedTime: string;
  finishedSize: string;
  fabricRequirement: string;
  recommendedFabric: string;
  machineSpec: string;
  shapeType: PatternShapeType;
  youtubeQuery: string;
  primaryCutSpec: {
    widthCm: number;
    heightCm: number;
    pieces: number;
    seamCm: number;
  };
  parts: PatternCutPart[];
  materials: string[];
  steps: string[];
  tip: string;
}

export interface FreePatternSource {
  id: string;
  name: string;
  language: '한국어' | '영문(무료 PDF)';
  description: string;
  url: string;
  bestFor: string;
}

export const SEWING_PATTERNS: SewingPatternGuide[] = [
  {
    id: 'pattern-ecobag',
    title: '데일리 다트 에코백',
    category: '가방 · 파우치',
    difficulty: '입문',
    estimatedTime: '약 1시간 30분',
    finishedSize: '가로 36 × 세로 42 × 바닥폭 8cm',
    fabricRequirement: '10수 캔버스 또는 데님 1마 (폭 145cm)',
    recommendedFabric: '10수 바이오 캔버스, 옥스포드, 데님 10oz',
    machineSpec: '14호 바늘 · 코아사 40수 · 땀수 3.0mm',
    shapeType: 'ecobag',
    youtubeQuery: '재봉틀 에코백 만들기 안감 바닥다트',
    primaryCutSpec: { widthCm: 36, heightCm: 42, pieces: 2, seamCm: 1.5 },
    parts: [
      { name: '가방 본판 (앞/뒤)', widthCm: 36, heightCm: 42, quantity: 2, seamCm: 1.5, note: '하단 양 모서리 4×4cm 다트' },
      { name: '어깨끈', widthCm: 8, heightCm: 62, quantity: 2, seamCm: 1, note: '완성 폭 3cm (4등분 접어 상침)' },
      { name: '내부 속주머니', widthCm: 18, heightCm: 20, quantity: 1, seamCm: 1, note: '입구 2cm 접어 박기' },
    ],
    materials: ['겉감 1마 (안감 추가 시 20수 면 1마)', '40수 코아사', '다림질용 시접 자'],
    steps: [
      '원단 선세탁·스팀 다림질 후 본판 2장, 어깨끈 2줄, 속주머니 1장 재단',
      '어깨끈을 반 접어 다린 뒤 양쪽 끝을 안쪽으로 접어 0.3cm 상침',
      '본판 1장 안쪽에 속주머니 부착 후 겉끼리 마주 대고 양옆과 바닥 박기',
      '바닥 양 모서리를 삼각형으로 펴서 8cm 선을 그어 다트 박기',
      '입구 시접을 1cm + 3cm 접어 어깨끈을 안쪽에 끼워 넣고 한 바퀴 상침',
    ],
    tip: '끈이 당겨지는 입구 부분은 사각 X자 박음질(박스 스티치)로 보강하면 무거운 책을 넣어도 튼튼합니다.',
  },
  {
    id: 'pattern-pouch',
    title: '사각 지퍼 파우치 (M)',
    category: '가방 · 파우치',
    difficulty: '입문',
    estimatedTime: '약 50분',
    finishedSize: '가로 20 × 세로 14 × 폭 4cm',
    fabricRequirement: '자투리 면/린넨 원단 0.3마 (안감 별도)',
    recommendedFabric: '선염 체크 면 40수, 옥스포드, 워싱 린넨',
    machineSpec: '11호 바늘 · 지퍼 노루발 · 땀수 2.5mm',
    shapeType: 'pouch',
    youtubeQuery: '재봉틀 사각 지퍼 파우치 만들기 기초',
    primaryCutSpec: { widthCm: 22, heightCm: 16, pieces: 2, seamCm: 1 },
    parts: [
      { name: '겉감 (앞/뒤)', widthCm: 22, heightCm: 16, quantity: 2, seamCm: 1 },
      { name: '안감 (앞/뒤)', widthCm: 22, heightCm: 16, quantity: 2, seamCm: 1 },
      { name: '4온스 접착솜', widthCm: 20, heightCm: 14, quantity: 2, seamCm: 0, note: '시접 제외 크기' },
    ],
    materials: ['20cm 지퍼 1개', '겉감·안감 각 2장', '4온스 접착솜', '지퍼 노루발'],
    steps: [
      '겉감 안쪽에 시접을 뺀 크기의 접착솜을 다림질해 부착',
      '지퍼를 사이에 두고 겉감(겉면 위)과 안감(겉면 아래)을 포개어 지퍼 노루발로 박기',
      '반대편 지퍼 날도 동일하게 겉감·안감 연결 후 지퍼 옆 0.3cm 상침',
      '지퍼를 반쯤 열어둔 채 겉감끼리, 안감끼리 마주 대고 둘레 박기 (안감 바닥 창구멍 8cm)',
      '창구멍으로 뒤집어 모서리를 뺀 뒤 창구멍 공그르기(또는 상침) 마감',
    ],
    tip: '지퍼를 반드시 반쯤 열어두고 둘레를 박아야 뒤집을 수 있습니다.',
  },
  {
    id: 'pattern-apron',
    title: '랩 스타일 린넨 앞치마',
    category: '주방 · 리빙',
    difficulty: '초중급',
    estimatedTime: '약 2시간',
    finishedSize: '총길이 88 × 둘레폭 95cm',
    fabricRequirement: '워싱 린넨 11수 1.5~2마 (대폭 140cm)',
    recommendedFabric: '프렌치 워싱 린넨, 면 20수 바이오 워싱',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.8mm',
    shapeType: 'apron',
    youtubeQuery: '재봉틀 린넨 앞치마 만들기 원피스형',
    primaryCutSpec: { widthCm: 95, heightCm: 88, pieces: 1, seamCm: 2 },
    parts: [
      { name: '앞치마 몸판', widthCm: 95, heightCm: 88, quantity: 1, seamCm: 2, note: '상단 가슴폭 26cm로 사선 재단' },
      { name: '어깨끈', widthCm: 6, heightCm: 68, quantity: 2, seamCm: 1 },
      { name: '허리끈', widthCm: 6, heightCm: 90, quantity: 2, seamCm: 1 },
      { name: '앞주머니', widthCm: 18, heightCm: 20, quantity: 2, seamCm: 1.5 },
    ],
    materials: ['워싱 린넨 1.5~2마', '코아사 60수', '라벨 테이프(선택)'],
    steps: [
      '린넨은 수축률이 크므로 반드시 선세탁 및 다림질 후 재단',
      '주머니 윗단을 1cm + 2cm 접어 박은 뒤 몸판 허리선 아래 위치에 0.3cm 상침 부착',
      '몸판 양 옆선과 밑단을 1cm + 1.5cm 두 번 접어 말아박기',
      '어깨끈과 허리끈을 반 접어 박고 뒤집어 다린 뒤 몸판 사선/허리 위치에 단단히 고정',
    ],
    tip: '몸판 위쪽 겨드랑이 곡선 부분은 바이어스 테이프로 싸거나 0.7cm 두 번 접어 박으면 우글거리지 않습니다.',
  },
  {
    id: 'pattern-drawstring',
    title: '스트링 조리개 파우치',
    category: '가방 · 파우치',
    difficulty: '입문',
    estimatedTime: '약 35분',
    finishedSize: '가로 22 × 세로 26cm',
    fabricRequirement: '체크 면 40수 / 이중지 거즈 0.3마',
    recommendedFabric: '깅엄 체크 면, 30수 면 무지, 얇은 린넨',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.5mm',
    shapeType: 'drawstring',
    youtubeQuery: '재봉틀 스트링 파우치 조리개 주머니 만들기',
    primaryCutSpec: { widthCm: 24, heightCm: 30, pieces: 2, seamCm: 1 },
    parts: [
      { name: '겉감 (앞/뒤)', widthCm: 24, heightCm: 30, quantity: 2, seamCm: 1, note: '위에서 4~6cm 구간 끈 구멍 비움' },
      { name: '안감 (앞/뒤)', widthCm: 24, heightCm: 30, quantity: 2, seamCm: 1 },
    ],
    materials: ['면 끈 5~6mm (65cm × 2줄)', '겉감·안감 각 2장', '옷핀 또는 끈끼우개'],
    steps: [
      '겉감 양 옆선 상단 4cm 아래부터 2cm 구간(끈 구멍)을 남기고 겉감끼리 박기',
      '안감도 동일하게 박되 바닥에 창구멍 7cm 남기기',
      '겉감과 안감 입구를 맞춰 둥글게 박은 뒤 안감 창구멍으로 뒤집어 창구멍 마감',
      '입구에서 아래 2cm, 4cm 지점에 두 줄 평행 상침해 끈 채널 만들기',
      '양쪽 끈 구멍으로 면끈을 한 바퀴씩 교차 통과시켜 끝매듭 묶기',
    ],
    tip: '지퍼 달기가 부담스러운 입문자가 가장 예쁘게 완성할 수 있는 선물용 파우치입니다.',
  },
  {
    id: 'pattern-bottle',
    title: '보틀 · 텀블러 파우치',
    category: '가방 · 파우치',
    difficulty: '초중급',
    estimatedTime: '약 50분',
    finishedSize: '지름 9 × 높이 22cm',
    fabricRequirement: '누빔 원단 또는 옥스포드 0.3마',
    recommendedFabric: '다이아 누빔, 방수 라미네이팅, 10수 캔버스',
    machineSpec: '14호 바늘 · 코아사 40수 · 땀수 2.8mm',
    shapeType: 'bottle',
    youtubeQuery: '재봉틀 텀블러 가방 보틀 파우치 만들기',
    primaryCutSpec: { widthCm: 28, heightCm: 24, pieces: 1, seamCm: 1 },
    parts: [
      { name: '원통 몸판 (겉/안)', widthCm: 28, heightCm: 24, quantity: 2, seamCm: 1 },
      { name: '원형 바닥 (겉/안)', widthCm: 11, heightCm: 11, quantity: 2, seamCm: 1, note: '지름 9cm 원 + 시접 1cm' },
      { name: '손잡이 스트랩', widthCm: 6, heightCm: 32, quantity: 1, seamCm: 1 },
    ],
    materials: ['누빔/겉감 1장', '방수 안감(선택)', 'D링 1개 (선택)'],
    steps: [
      '몸판 세로 옆선을 박아 원통 모양을 만든 뒤 시접을 가름솔 다림질',
      '원통 하단과 원형 바닥 둘레에 4등분 너치(가위집 표시)를 내어 핀/클립 고정 후 천천히 원형 박기',
      '안감도 동일하게 원형 바닥 연결 (바닥 옆 창구멍 남김)',
      '손잡이 끈을 입구 쪽에 끼워 겉감·안감 입구 연결 후 뒤집어 입구 상침',
    ],
    tip: '원형 바닥을 박을 때는 땀수를 2.2mm로 좁히고 1cm마다 노루발을 들어 방향을 조금씩 돌려주면 주름이 지지 않습니다.',
  },
  {
    id: 'pattern-cushion',
    title: '호텔식 쿠션 커버 (50×50)',
    category: '주방 · 리빙',
    difficulty: '초입문',
    estimatedTime: '약 40분',
    finishedSize: '50 × 50cm (지퍼 없이 여밈형)',
    fabricRequirement: '린넨 또는 20수 면 1.2마',
    recommendedFabric: '워싱 린넨, 옥스포드, 광목 20수',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.8mm',
    shapeType: 'cushion',
    youtubeQuery: '재봉틀 지퍼없는 호텔식 쿠션커버 만들기',
    primaryCutSpec: { widthCm: 50, heightCm: 50, pieces: 2, seamCm: 1.5 },
    parts: [
      { name: '앞판', widthCm: 50, heightCm: 50, quantity: 1, seamCm: 1.5 },
      { name: '뒷판 (큰 쪽)', widthCm: 50, heightCm: 38, quantity: 1, seamCm: 1.5, note: '여밈단 3cm 포함' },
      { name: '뒷판 (작은 쪽)', widthCm: 50, heightCm: 28, quantity: 1, seamCm: 1.5, note: '겹침 약 13cm' },
    ],
    materials: ['원단 1.2마', '50×50 쿠션 솜'],
    steps: [
      '뒷판 2장의 겹쳐지는 안쪽 단을 각각 1cm + 2cm 접어 두 번 말아박기',
      '앞판(겉면 위) 위에 뒷판 큰 쪽과 작은 쪽을 겉면끼리 마주 보게 겹쳐 올려놓기',
      '사방 둘레를 시접 1.5cm로 한 바퀴 박은 뒤 네 모서리 시접을 사선으로 깎기',
      '오버록 또는 지그재그로 시접 정리 후 여밈 틈새로 뒤집어 다림질',
    ],
    tip: '쿠션 솜이 빵빵하게 들어가려면 완성 크기를 솜보다 2cm 작게(48×48cm) 잡으면 각이 예쁘게 삽니다.',
  },
  {
    id: 'pattern-coaster',
    title: '양면 사각 티코스터 (4P)',
    category: '주방 · 리빙',
    difficulty: '초입문',
    estimatedTime: '약 25분',
    finishedSize: '10 × 10cm',
    fabricRequirement: '자투리 면/린넨 원단 활용',
    recommendedFabric: '남은 체크 면, 린넨 자투리',
    machineSpec: '11호 바늘 · 코아사 60수 · 땀수 2.5mm',
    shapeType: 'coaster',
    youtubeQuery: '재봉틀 티코스터 컵받침 자투리 원단 만들기',
    primaryCutSpec: { widthCm: 11, heightCm: 11, pieces: 8, seamCm: 0.7 },
    parts: [
      { name: '겉감', widthCm: 11, heightCm: 11, quantity: 4, seamCm: 0.7 },
      { name: '안감', widthCm: 11, heightCm: 11, quantity: 4, seamCm: 0.7 },
      { name: '2온스 접착솜', widthCm: 10, heightCm: 10, quantity: 4, seamCm: 0 },
    ],
    materials: ['자투리 원단', '2온스 접착솜', '면 라벨(선택)'],
    steps: [
      '겉감 뒷면에 접착솜 부착',
      '겉감과 안감을 겉끼리 마주 대고 창구멍 4cm만 남기고 사방 박기',
      '네 모서리 시접을 0.3cm 남기고 사선 자르기 후 뒤집기',
      '다림질로 모양 잡고 둘레 0.2cm 상침으로 창구멍까지 한 번에 마감',
    ],
    tip: '모서리에 면 테이프 고리를 끼워 박으면 걸어둘 수 있는 주방 냄비받침/티코스터가 됩니다.',
  },
  {
    id: 'pattern-bib',
    title: '양면 반다나 스카프 턱받이',
    category: '유아 · 선물',
    difficulty: '입문',
    estimatedTime: '약 30분',
    finishedSize: '목둘레 32~35cm · 앞길이 18cm',
    fabricRequirement: '이중지 거즈 0.3마 (앞/뒤 다른 원단 추천)',
    recommendedFabric: '오가닉 이중거즈, 밤부 거즈, 60수 면',
    machineSpec: '9호~11호 바늘 · 면사 60수 · 땀수 2.4mm',
    shapeType: 'bib',
    youtubeQuery: '재봉틀 아기 반다나 턱받이 스카프빕 만들기 도안',
    primaryCutSpec: { widthCm: 34, heightCm: 22, pieces: 2, seamCm: 1 },
    parts: [
      { name: '앞판 (거즈/면)', widthCm: 34, heightCm: 22, quantity: 1, seamCm: 1, note: '상단 목선 완만한 곡선' },
      { name: '뒷판 (거즈/타올)', widthCm: 34, heightCm: 22, quantity: 1, seamCm: 1 },
    ],
    materials: ['이중거즈 원단', '티단추(스냅 단추) 1~2쌍', '기구(티단추 집게)'],
    steps: [
      'A4 용지에 반쪽 도안을 그려 반 접어 좌우 대칭 본 뜨기 (가로 34×세로 22cm 삼각 라운드)',
      '앞판·뒷판을 겉면끼리 마주 대고 창구멍 5cm 남기고 둘레 박기 (목 곡선은 가위집)',
      '뒤집어 스팀 다림질 후 둘레 0.2cm 상침 마감',
      '양쪽 끝부분에 스냅 단추(사이즈 조절용 2단계 추천) 달기',
    ],
    tip: '거즈 원단은 재봉 시 밀리기 쉬우므로 원더클립으로 촘촘히 고정하고 장력을 0.5 낮춰 박으세요.',
  },
];

export const FREE_PATTERN_SOURCES: FreePatternSource[] = [
  {
    id: 'naver-free-pdf',
    name: '네이버 블로그 · 카페 무료 소잉 도안 검색',
    language: '한국어',
    description: '국내 핸드메이더들이 공유하는 에코백, 파우치, 앞치마, 아기옷 A4 무료 PDF 도안을 검색할 수 있습니다.',
    url: 'https://search.naver.com/search.naver?where=blog&query=재봉틀+소품+무료+도안+PDF',
    bestFor: '한국어 설명 + A4 프린트 도안',
  },
  {
    id: 'youtube-free-pattern',
    name: '유튜브 "무료도안 포함" 소잉 영상 모음',
    language: '한국어',
    description: '영상 더보기란에 실물 PDF 도안 다운로드 링크를 함께 제공하는 국내 소잉 유튜버 영상 검색 결과입니다.',
    url: 'https://www.youtube.com/results?search_query=재봉틀+소품+만들기+무료도안+PDF',
    bestFor: '영상 따라하기 + 무료 PDF 도안',
  },
  {
    id: 'pinterest-pattern',
    name: '핀터레스트 무료 패턴 도안 보드',
    language: '한국어',
    description: '치수가 적힌 파우치·가방·의류 전개도 이미지와 무료 PDF 도안 링크가 가장 많이 모여 있습니다.',
    url: 'https://www.pinterest.com/search/pins/?q=sewing+bag+pouch+free+pattern+pdf',
    bestFor: '시각적 전개도 · 다양한 디자인 참고',
  },
  {
    id: 'sewcanshe',
    name: 'Sew Can She 무료 가방·파우치 도안',
    language: '영문(무료 PDF)',
    description: '수백 가지 지퍼 파우치, 토트백, 정리함 무료 패턴과 단계별 사진 설명을 제공하는 유명 해외 소잉 사이트입니다.',
    url: 'https://www.sewcanshe.com/free-patterns',
    bestFor: '파우치 · 토트백 · 퀼트 소품 (브라우저 번역 추천)',
  },
  {
    id: 'soseweasy',
    name: 'So Sew Easy 무료 패턴 아카이브',
    language: '영문(무료 PDF)',
    description: '가방부터 앞치마, 생활 소품, 간편 의류까지 무료 PDF 다운로드 도안이 체계적으로 정리되어 있습니다.',
    url: 'https://so-sew-easy.com/free-sewing-patterns/',
    bestFor: '앞치마 · 데일리 가방 · 여성 의류',
  },
];
