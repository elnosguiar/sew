import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckSquare,
  Copy,
  Plus,
  Ruler,
  Scissors,
  Square,
  Wrench,
} from 'lucide-react';
import {
  NEEDLE_THREAD_GUIDES,
  QUICK_PATTERN_SPECS,
  QuickPatternSpec,
  SEWING_TROUBLESHOOTING,
} from '../data/sewingGuides';

interface SewingToolboxProps {
  onCreateProjectWithSpec: (preset: {
    title?: string;
    machineSpec: string;
    memo?: string;
  }) => void;
}

type ToolboxSubTab = 'guide' | 'cutting' | 'troubleshoot';

export function SewingToolbox({ onCreateProjectWithSpec }: SewingToolboxProps) {
  const [subTab, setSubTab] = useState<ToolboxSubTab>('guide');

  // 1. Needle & Thread Guide state
  const [selectedGuideId, setSelectedGuideId] = useState<string>(
    NEEDLE_THREAD_GUIDES[1].id
  );
  const [copiedGuideId, setCopiedGuideId] = useState<string | null>(null);

  const activeGuide = useMemo(
    () =>
      NEEDLE_THREAD_GUIDES.find((g) => g.id === selectedGuideId) ??
      NEEDLE_THREAD_GUIDES[0],
    [selectedGuideId]
  );

  // 2. Unit converter state
  const [maStandardCm, setMaStandardCm] = useState<90 | 91.44>(90);
  const [cmValue, setCmValue] = useState<string>('90');

  const parsedCm = Math.max(0, Number(cmValue) || 0);
  const convertedMa = parsedCm / maStandardCm;
  const convertedMeter = parsedCm / 100;
  const convertedInch = parsedCm / 2.54;

  const handleSetCmFromUnit = (raw: string, factorToCm: number) => {
    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      setCmValue('0');
      return;
    }
    setCmValue(String(Math.round(val * factorToCm * 100) / 100));
  };

  // 3. Cutting layout calculator state
  const [fabricWidthCm, setFabricWidthCm] = useState<number>(145);
  const [pieceWidthCm, setPieceWidthCm] = useState<string>('36');
  const [pieceHeightCm, setPieceHeightCm] = useState<string>('42');
  const [seamCm, setSeamCm] = useState<number>(1.5);
  const [pieceCount, setPieceCount] = useState<string>('2');
  const [allowRotate, setAllowRotate] = useState<boolean>(true);

  const cuttingResult = useMemo(() => {
    const w = Math.max(1, Number(pieceWidthCm) || 0) + seamCm * 2;
    const h = Math.max(1, Number(pieceHeightCm) || 0) + seamCm * 2;
    const count = Math.max(1, Math.floor(Number(pieceCount) || 1));
    const rollW = Math.max(30, fabricWidthCm || 110);

    // Orientation A: piece width along fabric width
    const colsA = Math.floor(rollW / w);
    const rowsA = colsA > 0 ? Math.ceil(count / colsA) : Infinity;
    const lenA = colsA > 0 ? rowsA * h : Infinity;

    // Orientation B: rotated 90 degrees
    const colsB = allowRotate ? Math.floor(rollW / h) : 0;
    const rowsB = colsB > 0 ? Math.ceil(count / colsB) : Infinity;
    const lenB = colsB > 0 ? rowsB * w : Infinity;

    const useB = allowRotate && lenB < lenA;
    const pieceW = useB ? h : w;
    const pieceH = useB ? w : h;
    const cols = useB ? colsB : colsA;
    const rows = useB ? rowsB : rowsA;
    const totalLengthCm = useB ? lenB : lenA;
    const fits = Number.isFinite(totalLengthCm);
    const neededMa = fits ? totalLengthCm / maStandardCm : 0;

    return {
      fits,
      rotated: useB,
      pieceW: Math.round(pieceW * 10) / 10,
      pieceH: Math.round(pieceH * 10) / 10,
      cols,
      rows,
      count,
      rollW,
      totalLengthCm: fits ? Math.round(totalLengthCm * 10) / 10 : 0,
      neededMa: fits ? Math.ceil(neededMa * 10) / 10 : 0,
    };
  }, [
    pieceWidthCm,
    pieceHeightCm,
    seamCm,
    pieceCount,
    fabricWidthCm,
    allowRotate,
    maStandardCm,
  ]);

  const handleApplyQuickPattern = (spec: QuickPatternSpec) => {
    setPieceWidthCm(String(spec.widthCm));
    setPieceHeightCm(String(spec.heightCm));
    setPieceCount(String(spec.pieces));
    setSeamCm(spec.seamCm);
  };

  // 4. Troubleshooting checked steps
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [expandedIssueId, setExpandedIssueId] = useState<string>(
    SEWING_TROUBLESHOOTING[0].id
  );

  const toggleStep = (key: string) => {
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopySpec = async () => {
    const text = `${activeGuide.fabricGroup} 권장 세팅: ${activeGuide.needleSize} (${activeGuide.needleType}) · ${activeGuide.threadSpec} · 땀수 ${activeGuide.stitchLengthMm}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedGuideId(activeGuide.id);
      setTimeout(() => setCopiedGuideId(null), 2000);
    } catch {
      // Clipboard may be restricted in some environments; create project directly remains available
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="font-atelier-serif text-2xl font-bold text-[#262320]">
          미싱 도구함
        </h1>
        <p className="mt-1 text-xs text-[#6B655D] sm:text-sm">
          재봉틀 옆에 띄워두고 바로 확인하는 바늘·실 조합, 원단 환산, 재단 계산, 응급처치 가이드입니다.
        </p>
      </div>

      {/* Sub-tool Segmented Control */}
      <div
        className="grid grid-cols-3 gap-1 rounded-2xl border border-[#E5E1D8] bg-[#F3F1EC] p-1 sm:max-w-lg"
        role="tablist"
        aria-label="미싱 도구 선택"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'guide'}
          onClick={() => setSubTab('guide')}
          className={`inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
            subTab === 'guide'
              ? 'bg-white text-[#262320] shadow-xs'
              : 'text-[#6B655D] hover:text-[#262320]'
          }`}
        >
          <Scissors className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>바늘 · 실 표</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'cutting'}
          onClick={() => setSubTab('cutting')}
          className={`inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
            subTab === 'cutting'
              ? 'bg-white text-[#262320] shadow-xs'
              : 'text-[#6B655D] hover:text-[#262320]'
          }`}
        >
          <Ruler className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>환산 · 재단</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'troubleshoot'}
          onClick={() => setSubTab('troubleshoot')}
          className={`inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
            subTab === 'troubleshoot'
              ? 'bg-white text-[#262320] shadow-xs'
              : 'text-[#6B655D] hover:text-[#262320]'
          }`}
        >
          <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>응급처치</span>
        </button>
      </div>

      {/* 1. Needle & Thread Guide */}
      {subTab === 'guide' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Fabric Type Selector */}
          <div className="space-y-2 lg:col-span-5">
            <p className="text-xs font-semibold text-[#4A453F]">
              지금 박을 원단을 선택하세요
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {NEEDLE_THREAD_GUIDES.map((guide) => {
                const active = guide.id === activeGuide.id;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`flex min-h-[60px] cursor-pointer flex-col justify-center rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#2B4157] ${
                      active
                        ? 'border-[#2B4157] bg-[#2B4157] text-white'
                        : 'border-[#E5E1D8] bg-white text-[#262320] hover:border-[#2B4157]/50'
                    }`}
                  >
                    <span className="text-sm font-semibold">{guide.fabricGroup}</span>
                    <span
                      className={`mt-0.5 line-clamp-1 text-xs ${
                        active ? 'text-white/80' : 'text-[#6B655D]'
                      }`}
                    >
                      {guide.examples}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Spec Card */}
          <section className="rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0EDE6] pb-4">
              <div>
                <p className="text-xs font-medium text-[#6B655D]">
                  권장 미싱 세팅
                </p>
                <h2 className="mt-0.5 font-atelier-serif text-xl font-bold text-[#262320]">
                  {activeGuide.fabricGroup}
                </h2>
                <p className="mt-1 text-xs text-[#7A736A]">{activeGuide.examples}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySpec}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
                >
                  {copiedGuideId === activeGuide.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#3D5A47]" aria-hidden="true" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>세팅 복사</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onCreateProjectWithSpec({
                      machineSpec: `${activeGuide.needleSize} · ${activeGuide.threadSpec.split('(')[0].trim()} · 땀수 ${activeGuide.stitchLengthMm}`,
                      memo: `노루발: ${activeGuide.presserFoot}\n장력 팁: ${activeGuide.tensionHint}`,
                    })
                  }
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-3.5 text-xs font-semibold text-white hover:bg-[#213345]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>작업에 적용</span>
                </button>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <dt className="text-xs font-medium text-[#6B655D]">바늘 호수 · 종류</dt>
                <dd className="tabular-nums mt-1 text-base font-bold text-[#2B4157]">
                  {activeGuide.needleSize}
                </dd>
                <dd className="mt-0.5 text-xs text-[#4A453F]">{activeGuide.needleType}</dd>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4">
                <dt className="text-xs font-medium text-[#6B655D]">추천 땀수 길이</dt>
                <dd className="tabular-nums mt-1 text-base font-bold text-[#2B4157]">
                  {activeGuide.stitchLengthMm}
                </dd>
                <dd className="mt-0.5 text-xs text-[#4A453F]">
                  노루발: {activeGuide.presserFoot}
                </dd>
              </div>

              <div className="rounded-2xl bg-[#FAF9F6] p-4 sm:col-span-2">
                <dt className="text-xs font-medium text-[#6B655D]">추천 재봉실</dt>
                <dd className="mt-1 text-sm font-semibold text-[#262320]">
                  {activeGuide.threadSpec}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-3 border-t border-[#F0EDE6] pt-4">
              <div>
                <h3 className="text-xs font-semibold text-[#4A453F]">윗실 장력 팁</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#262320]">
                  {activeGuide.tensionHint}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#4A453F]">미싱 작업 요령</h3>
                <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-[#4A453F]">
                  {activeGuide.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2B4157]" aria-hidden="true" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 2. Unit Converter & Fabric Cutting Calculator */}
      {subTab === 'cutting' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Real-time Unit Converter */}
          <section className="space-y-4 rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#262320] md:text-lg">
                  마 · cm · 인치 환산기
                </h2>
                <p className="mt-0.5 text-xs text-[#6B655D]">
                  어느 칸에 입력해도 나머지 단위가 바로 바뀝니다.
                </p>
              </div>
            </div>

            {/* 1마 기준 선택 */}
            <div className="flex items-center justify-between rounded-2xl bg-[#FAF9F6] px-3.5 py-2.5 text-xs">
              <span className="font-medium text-[#524C46]">1마 계산 기준</span>
              <div className="flex items-center gap-1 rounded-xl border border-[#E5E1D8] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setMaStandardCm(90)}
                  className={`min-h-[32px] cursor-pointer rounded-lg px-2.5 text-xs font-medium whitespace-nowrap ${
                    maStandardCm === 90
                      ? 'bg-[#2B4157] text-white'
                      : 'text-[#6B655D] hover:text-[#262320]'
                  }`}
                >
                  국내 90cm
                </button>
                <button
                  type="button"
                  onClick={() => setMaStandardCm(91.44)}
                  className={`min-h-[32px] cursor-pointer rounded-lg px-2.5 text-xs font-medium whitespace-nowrap ${
                    maStandardCm === 91.44
                      ? 'bg-[#2B4157] text-white'
                      : 'text-[#6B655D] hover:text-[#262320]'
                  }`}
                >
                  1야드 91.44cm
                </button>
              </div>
            </div>

            {/* 4 Unit Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="conv-ma" className="block text-xs font-semibold text-[#4A453F]">
                  마 (원단 단위)
                </label>
                <input
                  id="conv-ma"
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min="0"
                  value={Math.round(convertedMa * 100) / 100}
                  onChange={(e) => handleSetCmFromUnit(e.target.value, maStandardCm)}
                  className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3.5 text-base font-semibold text-[#2B4157] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="conv-cm" className="block text-xs font-semibold text-[#4A453F]">
                  센티미터 (cm)
                </label>
                <input
                  id="conv-cm"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={cmValue}
                  onChange={(e) => setCmValue(e.target.value)}
                  className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3.5 text-base font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="conv-m" className="block text-xs font-semibold text-[#4A453F]">
                  미터 (m)
                </label>
                <input
                  id="conv-m"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={Math.round(convertedMeter * 100) / 100}
                  onChange={(e) => handleSetCmFromUnit(e.target.value, 100)}
                  className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3.5 text-base font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="conv-inch" className="block text-xs font-semibold text-[#4A453F]">
                  인치 (inch)
                </label>
                <input
                  id="conv-inch"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={Math.round(convertedInch * 100) / 100}
                  onChange={(e) => handleSetCmFromUnit(e.target.value, 2.54)}
                  className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3.5 text-base font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Yardage Buttons */}
            <div className="space-y-1.5 border-t border-[#F0EDE6] pt-3">
              <p className="text-xs font-medium text-[#6B655D]">자주 쓰는 길이 바로 누르기</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '1/4마', ma: 0.25 },
                  { label: '반마 (0.5)', ma: 0.5 },
                  { label: '1마', ma: 1 },
                  { label: '1.5마', ma: 1.5 },
                  { label: '2마', ma: 2 },
                  { label: '3마', ma: 3 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setCmValue(String(Math.round(preset.ma * maStandardCm * 10) / 10))
                    }
                    className="min-h-[38px] cursor-pointer rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] px-3 text-xs font-medium text-[#262320] hover:border-[#2B4157] hover:text-[#2B4157]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Fabric Roll Cutting Calculator */}
          <section className="space-y-5 rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6 lg:col-span-7">
            <div>
              <h2 className="text-base font-semibold text-[#262320] md:text-lg">
                원단 재단 소요량 계산기
              </h2>
              <p className="mt-0.5 text-xs text-[#6B655D]">
                만들 조각 크기와 시접을 넣으면 원단이 몇 cm(몇 마) 필요한지 계산해 드립니다.
              </p>
            </div>

            {/* Quick Item Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-[#6B655D]">소품 예시:</span>
              {QUICK_PATTERN_SPECS.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleApplyQuickPattern(spec)}
                  className="min-h-[36px] cursor-pointer rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] px-3 text-xs font-medium text-[#4A453F] hover:border-[#2B4157] hover:text-[#2B4157]"
                >
                  {spec.name.split('(')[0].trim()}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 space-y-1.5 sm:col-span-3">
                <span className="block text-xs font-semibold text-[#4A453F]">
                  원단 폭 선택 (소폭 / 대폭)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: '소폭 110cm', width: 110 },
                    { label: '대폭 145cm', width: 145 },
                    { label: '광폭 150cm', width: 150 },
                  ].map((opt) => (
                    <button
                      key={opt.width}
                      type="button"
                      onClick={() => setFabricWidthCm(opt.width)}
                      className={`min-h-[40px] cursor-pointer rounded-xl px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                        fabricWidthCm === opt.width
                          ? 'bg-[#2B4157] text-white'
                          : 'border border-[#DFDBD2] bg-white text-[#524C46] hover:border-[#2B4157]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={fabricWidthCm}
                      onChange={(e) => setFabricWidthCm(Number(e.target.value) || 110)}
                      aria-label="원단 폭 직접 입력(cm)"
                      className="tabular-nums min-h-[40px] w-20 rounded-xl border border-[#DFDBD2] bg-white px-2.5 text-xs font-semibold text-[#262320]"
                    />
                    <span className="text-xs text-[#6B655D]">cm</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="cut-w" className="block text-xs font-semibold text-[#4A453F]">
                  조각 가로 (cm)
                </label>
                <input
                  id="cut-w"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  value={pieceWidthCm}
                  onChange={(e) => setPieceWidthCm(e.target.value)}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cut-h" className="block text-xs font-semibold text-[#4A453F]">
                  조각 세로 (cm)
                </label>
                <input
                  id="cut-h"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  value={pieceHeightCm}
                  onChange={(e) => setPieceHeightCm(e.target.value)}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="cut-qty" className="block text-xs font-semibold text-[#4A453F]">
                  필요 조각 수
                </label>
                <input
                  id="cut-qty"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="40"
                  value={pieceCount}
                  onChange={(e) => setPieceCount(e.target.value)}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Seam allowance + Rotation toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#4A453F]">사방 시접:</span>
                {[0, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeamCm(s)}
                    className={`min-h-[36px] cursor-pointer rounded-xl px-2.5 text-xs font-medium ${
                      seamCm === s
                        ? 'bg-[#2B4157] text-white'
                        : 'border border-[#DFDBD2] bg-white text-[#524C46]'
                    }`}
                  >
                    {s === 0 ? '시접 포함됨' : `+${s}cm`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setAllowRotate((v) => !v)}
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 text-xs font-medium text-[#4A453F]"
              >
                {allowRotate ? (
                  <CheckSquare className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
                ) : (
                  <Square className="h-4 w-4 text-[#9C9488]" aria-hidden="true" />
                )}
                <span>원단 방향 회전 배치 허용 (무지 원단)</span>
              </button>
            </div>

            {/* Result Summary + Visual Cutting Layout Diagram */}
            {!cuttingResult.fits ? (
              <div className="rounded-2xl border border-[#E7C2C3] bg-[#FDF2F2] p-4 text-sm text-[#A8383B]">
                조각 크기(시접 포함 {cuttingResult.pieceW}cm)가 선택한 원단 폭({cuttingResult.rollW}cm)보다 큽니다. 원단 폭을 넓히거나 회전 배치를 켜주세요.
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl bg-[#FAF9F6] p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#6B655D]">
                      필요 원단 길이 (시접 포함 {cuttingResult.pieceW}×{cuttingResult.pieceH}cm · {cuttingResult.count}장)
                    </p>
                    <p className="tabular-nums mt-1 text-2xl font-bold text-[#2B4157]">
                      {cuttingResult.totalLengthCm}cm
                      <span className="ml-2 text-base font-semibold text-[#3D5A47]">
                        (약 {cuttingResult.neededMa}마)
                      </span>
                    </p>
                  </div>
                  <p className="tabular-nums text-xs text-[#6B655D]">
                    가로 {cuttingResult.cols}장 × 세로 {cuttingResult.rows}줄
                    {cuttingResult.rotated ? ' · 90° 회전 배치' : ''}
                  </p>
                </div>

                {/* Simple Scaled Cutting Layout Diagram */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[#7A736A]">
                    재단 배치 미리보기 (원단 폭 {cuttingResult.rollW}cm)
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[#DFDBD2] bg-white p-2.5">
                    <div
                      className="relative w-full border border-dashed border-[#B8B1A5] bg-[#FAF9F6]"
                      style={{
                        aspectRatio: `${cuttingResult.rollW} / ${Math.max(
                          40,
                          cuttingResult.totalLengthCm
                        )}`,
                        maxHeight: '220px',
                      }}
                    >
                      {Array.from({ length: cuttingResult.count }).map((_, idx) => {
                        const col = idx % cuttingResult.cols;
                        const row = Math.floor(idx / cuttingResult.cols);
                        const leftPct =
                          ((col * cuttingResult.pieceW) / cuttingResult.rollW) * 100;
                        const widthPct =
                          (cuttingResult.pieceW / cuttingResult.rollW) * 100;
                        const topPct =
                          ((row * cuttingResult.pieceH) /
                            cuttingResult.totalLengthCm) *
                          100;
                        const heightPct =
                          (cuttingResult.pieceH / cuttingResult.totalLengthCm) *
                          100;
                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`,
                              height: `${heightPct}%`,
                            }}
                            className="absolute flex items-center justify-center border border-[#2B4157] bg-[#2B4157]/12 text-[11px] font-semibold text-[#2B4157] tabular-nums"
                          >
                            #{idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* 3. Sewing Troubleshooting Checklist */}
      {subTab === 'troubleshoot' && (
        <div className="space-y-3">
          {SEWING_TROUBLESHOOTING.map((issue) => {
            const isOpen = expandedIssueId === issue.id;
            const checkedCount = issue.checks.filter(
              (_, i) => checkedSteps[`${issue.id}-${i}`]
            ).length;

            return (
              <section
                key={issue.id}
                className="overflow-hidden rounded-3xl border border-[#E5E1D8] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIssueId(isOpen ? '' : issue.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAF9F6]"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#2B4157]"
                      aria-hidden="true"
                    />
                    <div>
                      <h2 className="text-sm font-semibold text-[#262320] sm:text-base">
                        {issue.symptom}
                      </h2>
                      <p className="mt-0.5 text-xs text-[#6B655D]">{issue.summary}</p>
                    </div>
                  </div>
                  <span className="tabular-nums shrink-0 text-xs font-medium text-[#6B655D]">
                    {checkedCount}/{issue.checks.length} 확인
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-[#F0EDE6] bg-[#FAF9F6]/60 px-5 py-4">
                    <ul className="space-y-2">
                      {issue.checks.map((step, idx) => {
                        const key = `${issue.id}-${idx}`;
                        const done = Boolean(checkedSteps[key]);
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => toggleStep(key)}
                              className="flex min-h-[44px] w-full cursor-pointer items-start gap-3 rounded-2xl border border-[#E5E1D8] bg-white p-3.5 text-left transition-colors hover:border-[#2B4157]/40"
                            >
                              {done ? (
                                <CheckSquare
                                  className="mt-0.5 h-4 w-4 shrink-0 text-[#3D5A47]"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Square
                                  className="mt-0.5 h-4 w-4 shrink-0 text-[#9C9488]"
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={`text-sm leading-relaxed ${
                                  done
                                    ? 'text-[#7A736A] line-through'
                                    : 'text-[#262320]'
                                }`}
                              >
                                {step}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
