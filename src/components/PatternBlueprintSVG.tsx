import { PatternShapeType } from '../data/sewingPatterns';

interface PatternBlueprintSVGProps {
  shapeType: PatternShapeType;
}

export function PatternBlueprintSVG({ shapeType }: PatternBlueprintSVGProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] p-4">
      <svg
        viewBox="0 0 380 220"
        className="mx-auto h-auto max-h-[210px] w-full"
        role="img"
        aria-label="재봉 도안 전개도 및 치수 안내"
      >
        <defs>
          <pattern id="atelier-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#E5E1D8"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect width="380" height="220" fill="url(#atelier-grid)" rx="8" />

        {shapeType === 'ecobag' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            {/* Main body */}
            <rect x="44" y="34" width="144" height="152" fill="#FFFFFF" fillOpacity="0.85" />
            <rect x="52" y="42" width="128" height="136" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            {/* Top fold line */}
            <line x1="44" y1="56" x2="188" y2="56" stroke="#C29348" strokeDasharray="3 3" strokeWidth="1.3" />
            {/* Bottom 4x4 dart */}
            <path d="M 44 166 L 64 166 L 64 186" stroke="#A8383B" strokeWidth="1.2" />
            <path d="M 188 166 L 168 166 L 168 186" stroke="#A8383B" strokeWidth="1.2" />
            {/* Strap piece */}
            <rect x="226" y="34" width="38" height="152" fill="#FFFFFF" fillOpacity="0.85" />
            <line x1="245" y1="34" x2="245" y2="186" stroke="#6E7F6B" strokeDasharray="3 3" strokeWidth="1.1" />
            {/* Inner pocket */}
            <rect x="286" y="76" width="66" height="72" fill="#FFFFFF" fillOpacity="0.85" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="116" y="24" textAnchor="middle">본판 36cm (×2)</text>
              <text x="116" y="114" textAnchor="middle" fill="#2B4157">42cm</text>
              <text x="116" y="177" textAnchor="middle" fontSize="9" fill="#A8383B">바닥 다트 4×4cm</text>
              <text x="245" y="24" textAnchor="middle">끈 8×62</text>
              <text x="319" y="68" textAnchor="middle">주머니</text>
              <text x="319" y="116" textAnchor="middle" fontSize="9" fill="#6B655D">18×20cm</text>
            </g>
          </g>
        )}

        {shapeType === 'pouch' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <rect x="44" y="42" width="160" height="120" rx="4" fill="#FFFFFF" fillOpacity="0.88" />
            <rect x="54" y="52" width="140" height="100" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            {/* Zipper line */}
            <line x1="44" y1="42" x2="204" y2="42" stroke="#C29348" strokeWidth="4" />
            <rect x="234" y="54" width="108" height="82" fill="#F6F9F7" stroke="#3D5A47" strokeDasharray="4 3" strokeWidth="1.4" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="124" y="28" textAnchor="middle" fill="#C29348">20cm 지퍼 위치</text>
              <text x="124" y="102" textAnchor="middle">겉감·안감 22×16cm</text>
              <text x="124" y="118" textAnchor="middle" fontSize="9" fill="#6B655D">사방 시접 1cm</text>
              <text x="288" y="96" textAnchor="middle" fill="#3D5A47">접착솜</text>
              <text x="288" y="112" textAnchor="middle" fontSize="9" fill="#3D5A47">20×14cm</text>
            </g>
          </g>
        )}

        {shapeType === 'apron' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            {/* Apron body */}
            <path
              d="M 110 34 L 176 34 C 180 74, 200 88, 224 94 L 224 188 L 62 188 L 62 94 C 86 88, 106 74, 110 34 Z"
              fill="#FFFFFF"
              fillOpacity="0.9"
            />
            {/* Pockets */}
            <rect x="86" y="116" width="44" height="48" stroke="#6E7F6B" strokeDasharray="3 2" strokeWidth="1.2" />
            <rect x="156" y="116" width="44" height="48" stroke="#6E7F6B" strokeDasharray="3 2" strokeWidth="1.2" />
            {/* Straps */}
            <rect x="258" y="34" width="22" height="150" fill="#FFFFFF" fillOpacity="0.85" />
            <rect x="302" y="34" width="22" height="150" fill="#FFFFFF" fillOpacity="0.85" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="143" y="24" textAnchor="middle">가슴폭 26cm</text>
              <text x="143" y="204" textAnchor="middle">몸판 총폭 95 × 길이 88cm</text>
              <text x="108" y="144" textAnchor="middle" fontSize="9" fill="#6B655D">18×20</text>
              <text x="178" y="144" textAnchor="middle" fontSize="9" fill="#6B655D">18×20</text>
              <text x="269" y="24" textAnchor="middle" fontSize="9">어깨끈 68</text>
              <text x="313" y="24" textAnchor="middle" fontSize="9">허리끈 90</text>
            </g>
          </g>
        )}

        {shapeType === 'drawstring' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <rect x="70" y="34" width="128" height="154" fill="#FFFFFF" fillOpacity="0.9" />
            <line x1="70" y1="54" x2="198" y2="54" stroke="#C29348" strokeDasharray="4 3" strokeWidth="1.4" />
            <line x1="70" y1="70" x2="198" y2="70" stroke="#C29348" strokeDasharray="4 3" strokeWidth="1.4" />
            {/* Open gap markers */}
            <line x1="65" y1="54" x2="65" y2="70" stroke="#A8383B" strokeWidth="2.2" />
            <line x1="203" y1="54" x2="203" y2="70" stroke="#A8383B" strokeWidth="2.2" />
            <rect x="234" y="34" width="106" height="154" fill="#F6F9F7" stroke="#3D5A47" strokeDasharray="4 3" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="134" y="24" textAnchor="middle">겉감 24×30cm (×2)</text>
              <text x="134" y="65" textAnchor="middle" fontSize="9" fill="#C29348">끈 채널 (2cm)</text>
              <text x="134" y="130" textAnchor="middle" fontSize="9" fill="#6B655D">양옆 끈 구멍 2cm 비우기</text>
              <text x="287" y="112" textAnchor="middle" fill="#3D5A47">안감 24×30cm</text>
              <text x="287" y="128" textAnchor="middle" fontSize="9" fill="#6B655D">바닥 창구멍 7cm</text>
            </g>
          </g>
        )}

        {shapeType === 'bottle' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <rect x="42" y="40" width="166" height="136" fill="#FFFFFF" fillOpacity="0.9" />
            <rect x="50" y="48" width="150" height="120" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            <circle cx="272" cy="86" r="36" fill="#FFFFFF" fillOpacity="0.9" />
            <circle cx="272" cy="86" r="28" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            <rect x="236" y="144" width="108" height="26" fill="#FFFFFF" fillOpacity="0.9" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="125" y="28" textAnchor="middle">원통 몸판 28×24cm</text>
              <text x="125" y="112" textAnchor="middle" fontSize="9" fill="#6B655D">시접 사방 1cm</text>
              <text x="272" y="90" textAnchor="middle">바닥 ∅9cm</text>
              <text x="290" y="161" textAnchor="middle" fontSize="9">손잡이 6×32cm</text>
            </g>
          </g>
        )}

        {shapeType === 'cushion' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <rect x="34" y="40" width="140" height="140" fill="#FFFFFF" fillOpacity="0.9" />
            <rect x="42" y="48" width="124" height="124" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            {/* Overlap back panels */}
            <rect x="206" y="40" width="140" height="92" fill="#FFFFFF" fillOpacity="0.88" />
            <rect x="206" y="106" width="140" height="74" fill="#F6F9F7" fillOpacity="0.8" stroke="#3D5A47" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="104" y="28" textAnchor="middle">앞판 50×50cm</text>
              <text x="104" y="114" textAnchor="middle" fontSize="9" fill="#6B655D">시접 1.5cm</text>
              <text x="276" y="28" textAnchor="middle">뒷판 2장 겹침 여밈</text>
              <text x="276" y="76" textAnchor="middle" fontSize="9">큰 뒷판 50×38cm</text>
              <text x="276" y="122" textAnchor="middle" fontSize="9" fill="#3D5A47">겹침 약 13cm</text>
              <text x="276" y="158" textAnchor="middle" fontSize="9" fill="#3D5A47">작은 뒷판 50×28cm</text>
            </g>
          </g>
        )}

        {shapeType === 'coaster' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <rect x="52" y="46" width="116" height="116" fill="#FFFFFF" fillOpacity="0.9" />
            <rect x="62" y="56" width="96" height="96" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            <line x1="88" y1="162" x2="132" y2="162" stroke="#FAF9F6" strokeWidth="3" />
            <line x1="88" y1="162" x2="132" y2="162" stroke="#A8383B" strokeDasharray="3 2" strokeWidth="1.8" />
            <rect x="218" y="56" width="96" height="96" fill="#F6F9F7" stroke="#3D5A47" strokeDasharray="4 3" strokeWidth="1.4" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="110" y="34" textAnchor="middle">겉감·안감 11×11cm</text>
              <text x="110" y="108" textAnchor="middle" fontSize="9" fill="#6B655D">시접 0.7cm</text>
              <text x="110" y="178" textAnchor="middle" fontSize="9" fill="#A8383B">창구멍 4cm</text>
              <text x="266" y="108" textAnchor="middle" fill="#3D5A47">접착솜 10×10cm</text>
            </g>
          </g>
        )}

        {shapeType === 'bib' && (
          <g stroke="#2B4157" fill="none" strokeWidth="1.8">
            <path
              d="M 70 64 Q 190 108 310 64 L 306 94 L 204 176 Q 190 186 176 176 L 74 94 Z"
              fill="#FFFFFF"
              fillOpacity="0.9"
            />
            <line x1="190" y1="84" x2="190" y2="180" stroke="#6E7F6B" strokeDasharray="4 3" strokeWidth="1.2" />
            <circle cx="88" cy="82" r="5" fill="#C29348" stroke="none" />
            <circle cx="292" cy="82" r="5" fill="#C29348" stroke="none" />
            <g fill="#262320" stroke="none" fontSize="10" fontWeight="600">
              <text x="190" y="44" textAnchor="middle">전체 가로 34cm · 중앙 높이 22cm</text>
              <text x="190" y="136" textAnchor="middle" fontSize="9" fill="#6B655D">좌우 대칭 골선</text>
              <text x="88" y="104" textAnchor="middle" fontSize="9" fill="#C29348">스냅</text>
              <text x="292" y="104" textAnchor="middle" fontSize="9" fill="#C29348">스냅</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
