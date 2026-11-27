export interface NeedleThreadGuide {
  id: string;
  fabricGroup: string;
  examples: string;
  needleSize: string;
  needleType: string;
  threadSpec: string;
  stitchLengthMm: string;
  presserFoot: string;
  tensionHint: string;
  tips: string[];
}

export const NEEDLE_THREAD_GUIDES: NeedleThreadGuide[] = [
  {
    id: 'thin-cotton-gauze',
    fabricGroup: '얇은 면 · 거즈 · 쉬폰',
    examples: '이중거즈, 60수 아사, 얇은 실크, 레이온',
    needleSize: '9호 (65/9)',
    needleType: '얇은 원단용 예리한 바늘 (Sharp/Microtex)',
    threadSpec: '코아사 60수 2합 또는 80수 얇은 실',
    stitchLengthMm: '1.8 ~ 2.2 mm',
    presserFoot: '기본 노루발 (얇은 천용 직선 노루발 권장)',
    tensionHint: '윗실 장력을 평소보다 0.5~1 정도 살짝 낮추면 우글거림이 줄어듭니다.',
    tips: [
      '원단이 바늘구멍으로 빨려 들어가면 시작 부분 아래에 얇은 종이(트레이싱지)를 대고 박은 뒤 뜯어내세요.',
      '노루발 압력을 약하게 조절하면 원단 밀림을 방지할 수 있습니다.',
    ],
  },
  {
    id: 'medium-cotton-linen',
    fabricGroup: '일반 면 · 워싱 린넨',
    examples: '20~40수 면, 옥스포드 얇은 두께, 프렌치 린넨 11수',
    needleSize: '11호 (75/11)',
    needleType: '가정용 일반 만능 바늘 (Universal)',
    threadSpec: '일반 재봉실 60수 2합 (코아사 / 면사)',
    stitchLengthMm: '2.4 ~ 2.8 mm',
    presserFoot: '기본 지그재그 노루발',
    tensionHint: '표준 장력 (보통 4~5)에서 가장 깔끔한 땀이 나옵니다.',
    tips: [
      '린넨과 면은 세탁 후 수축하므로 재단 전 반드시 선세탁(또는 스팀 다림질)을 해주세요.',
      '겉상침(스티치)을 예쁘게 넣고 싶을 때는 땀수를 3.0mm로 살짝 넓히세요.',
    ],
  },
  {
    id: 'canvas-twill',
    fabricGroup: '캔버스 · 두꺼운 린넨',
    examples: '10수 캔버스, 바이오 워싱 10수, 해링본, 두꺼운 자카드',
    needleSize: '14호 (90/14)',
    needleType: '일반 또는 중후물용 바늘',
    threadSpec: '코아사 40수 3합 (상침은 30수 가능)',
    stitchLengthMm: '2.8 ~ 3.2 mm',
    presserFoot: '기본 노루발 또는 워킹풋(이송 노루발)',
    tensionHint: '두꺼운 실을 윗실로 쓸 경우 장력을 0.5 높여 실이 겉으로 뜨지 않게 합니다.',
    tips: [
      '시접이 4겹 이상 겹치는 모서리는 망치로 살짝 두드려 납작하게 만들면 바늘이 부러지지 않습니다.',
      '단차 구간을 넘을 때 노루발 뒤쪽에 같은 두께의 자투리 천(단차 패드)을 끼우면 수평이 맞습니다.',
    ],
  },
  {
    id: 'denim-heavy',
    fabricGroup: '데님 · 8~14oz 청지',
    examples: '셀비지 데님, 4~8수 캔버스, 두꺼운 골덴(코듀로이)',
    needleSize: '16호 (100/16)',
    needleType: '청바지·데님 전용 바늘 (Jeans/Denim)',
    threadSpec: '30수 또는 20수 청바지 전용 굵은 실 (밑실은 60수/40수 가능)',
    stitchLengthMm: '3.0 ~ 3.5 mm',
    presserFoot: '기본 노루발 + 단차 극복 보조판',
    tensionHint: '윗실이 굵을수록 윗실 장력을 조금 높이고(5~6), 천천히 재봉하세요.',
    tips: [
      '데님은 바늘 끝이 쉽게 무뎌지므로 한 작품 완성 후 바늘 상태를 확인하세요.',
      '두꺼운 겹침 구간에서는 페달 대신 손바퀴(플라이휠)를 몸쪽으로 돌려 한 땀씩 넘어가면 안전합니다.',
    ],
  },
  {
    id: 'knit-jersey',
    fabricGroup: '니트 · 다이마루 · 쭈리',
    examples: '면스판, 티셔츠 원단, 양기모, 시보리',
    needleSize: '11호 ~ 14호 (75/11 ~ 90/14)',
    needleType: '니트·스판 전용 볼포인트 바늘 (Stretch / Ballpoint)',
    threadSpec: '코아사 60수 또는 신축성 있는 울리(모사) 밑실',
    stitchLengthMm: '2.5 ~ 3.0 mm (또는 번개땀/지그재그)',
    presserFoot: '워킹풋(상하 이송 노루발) 강력 추천',
    tensionHint: '원단이 늘어나지 않게 당기지 말고, 미싱 이송 톱니에 맡겨 밀어 넣으세요.',
    tips: [
      '일반 바늘을 쓰면 올이 나가거나 땀이 건너뜁니다. 반드시 끝이 둥근 니트용 바늘을 쓰세요.',
      '직선 박기 시 원단이 늘어나는 곳에는 신축성 심지나 테이프를 대어 박으면 깔끔합니다.',
    ],
  },
  {
    id: 'leather-waterproof',
    fabricGroup: '인조가죽 · 라미네이트 · 방수',
    examples: 'PU 레더, 왁스 캔버스, 코팅 린넨, 타포린',
    needleSize: '14호 ~ 16호 (90/14 ~ 100/16)',
    needleType: '가죽용 바늘(Leather) 또는 14호 티타늄 바늘',
    threadSpec: '코아사 40수 ~ 30수',
    stitchLengthMm: '3.0 ~ 3.5 mm (너무 좁으면 원단이 찢어짐)',
    presserFoot: '테프론 노루발 (롤러 노루발)',
    tensionHint: '땀수를 3.0mm 이상 넓게 잡아야 구멍이 촘촘해져 찢어지는 현상을 막습니다.',
    tips: [
      '핀을 꽂으면 구멍이 영구적으로 남으므로 시침핀 대신 원단 집게(원더클립)를 사용하세요.',
      '일반 금속 노루발이 달라붙어 밀리지 않을 때는 노루발 바닥에 마스킹 테이프를 살짝 붙이면 잘 나갑니다.',
    ],
  },
];

export interface TroubleshootingItem {
  id: string;
  symptom: string;
  summary: string;
  checks: string[];
}

export const SEWING_TROUBLESHOOTING: TroubleshootingItem[] = [
  {
    id: 'birds-nest',
    symptom: '원단 아랫면(밑실)이 뭉치고 엉켜요',
    summary: '대부분 밑실 문제가 아니라 윗실 장력 걸림 오류입니다.',
    checks: [
      '노루발을 반드시 "올린" 상태에서 윗실을 처음부터 끝까지 다시 끼워 보세요. (노루발이 내려가 있으면 장력판이 닫혀 윗실에 장력이 걸리지 않습니다)',
      '실 채기(위아래로 움직이는 고리)에 윗실이 정확히 걸려 있는지 확인하세요.',
      '보빈(밑실 토리)이 북집에 올바른 방향(보통 시계 반대 방향 P자 모양)으로 풀리도록 들어갔는지 확인하세요.',
    ],
  },
  {
    id: 'upper-thread-break',
    symptom: '윗실이 자꾸 끊어지거나 보풀이 생겨요',
    summary: '바늘 방향·마모 또는 윗실 걸림을 먼저 확인하세요.',
    checks: [
      '바늘이 원단 두께에 비해 너무 가늘지 않은지 확인하세요. (두꺼운 천에는 14~16호)',
      '바늘이 살짝 휘었거나 끝이 무뎌졌으면 새 바늘로 교체하세요. (가정용 바늘은 편평한 면이 뒤쪽을 향해야 합니다)',
      '실패 꽂이에서 실이 어딘가에 걸려 팽팽하게 당겨지고 있지 않은지 확인하세요.',
      '윗실 장력 다이얼이 너무 높게(7~9) 설정되어 있다면 4~5로 낮추세요.',
    ],
  },
  {
    id: 'skipped-stitches',
    symptom: '박음질 땀이 중간중간 건너뛰어요 (땀뜀)',
    summary: '신축성 원단이거나 바늘이 원단과 맞지 않을 때 자주 생깁니다.',
    checks: [
      '니트/스판 원단이라면 일반 바늘 대신 니트 전용 바늘(블루팁/볼포인트)로 교체하세요.',
      '바늘을 끼울 때 끝까지 깊숙이 밀어 넣고 나사를 조였는지 확인하세요.',
      '바늘 귀(구멍)에 실이 너무 굵어 뻑뻑하면 얇은 실이나 큰 바늘로 바꾸세요.',
    ],
  },
  {
    id: 'puckering',
    symptom: '박고 나면 원단이 우글우글 울어요',
    summary: '장력이 너무 강하거나 얇은 원단이 톱니에 끌릴 때 발생합니다.',
    checks: [
      '윗실 장력을 한 단계씩(예: 5 → 3.5) 낮춰 자투리 천에 테스트해 보세요.',
      '땀수 길이를 조금 더 넓혀(예: 2.0 → 2.6mm) 장력을 분산시키세요.',
      '바늘을 더 가는 호수(11호 → 9호)로 바꾸고, 재봉 중 원단을 손으로 잡아당기지 마세요.',
    ],
  },
  {
    id: 'needle-break',
    symptom: '바늘이 부러졌어요',
    summary: '단차 구간 과속 또는 원단 당김이 가장 흔한 원인입니다.',
    checks: [
      '시침핀을 뽑지 않고 그대로 위를 박다가 부딪혔는지 확인하고, 부러진 바늘 조각을 반드시 모두 찾으세요.',
      '재봉 중 원단을 억지로 당기거나 밀면 바늘이 휘어 침판에 부딪혀 부러집니다.',
      '두꺼운 겹침 구간을 지날 때는 페달을 밟지 말고 손바퀴를 직접 돌려 천천히 통과하세요.',
    ],
  },
];

export interface QuickPatternSpec {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  pieces: number;
  seamCm: number;
  fabricRecommend: string;
  note: string;
}

export const QUICK_PATTERN_SPECS: QuickPatternSpec[] = [
  {
    id: 'ecobag',
    name: '데일리 에코백 (본판 2장)',
    widthCm: 36,
    heightCm: 42,
    pieces: 2,
    seamCm: 1.5,
    fabricRecommend: '10수 캔버스 / 데님 0.5~1마',
    note: '끈 2개(폭 8cm×길이 62cm) 별도 재단. 바닥 다트 8cm 추천.',
  },
  {
    id: 'apron',
    name: '심플 랩 앞치마 몸판',
    widthCm: 95,
    heightCm: 88,
    pieces: 1,
    seamCm: 2,
    fabricRecommend: '워싱 린넨 11수 1.5마',
    note: '어깨끈(68cm×2), 허리끈(90cm×2), 앞주머니 추가 시 총 1.5~2마 필요.',
  },
  {
    id: 'pouch',
    name: '지퍼 파우치 M (겉감 2장)',
    widthCm: 22,
    heightCm: 16,
    pieces: 2,
    seamCm: 1,
    fabricRecommend: '면 20수 / 체크 코튼 자투리 활용',
    note: '20cm 지퍼 + 겉감/안감 각 2장 + 4온스 접착솜 조합.',
  },
  {
    id: 'cushion',
    name: '50×50 쿠션 커버 (앞/뒤)',
    widthCm: 50,
    heightCm: 50,
    pieces: 2,
    seamCm: 1.5,
    fabricRecommend: '린넨 / 면 20수 약 1.2마',
    note: '호텔식 여밈 뒷판으로 만들 경우 뒷판 2장(38×50cm) 겹침 여유 추가.',
  },
];
