import { useEffect, useMemo, useState } from 'react';
import { BookmarkCheck, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { CostRecord, FabricItem } from '../types/atelier';
import { formatKRW } from '../utils/formatters';

export interface CostDraftPreset {
  id: string;
  title: string;
  fabricCost: number;
}

interface CostCalculatorProps {
  fabrics: FabricItem[];
  records: CostRecord[];
  draftPreset?: CostDraftPreset | null;
  onSaveRecord: (record: Omit<CostRecord, 'id' | 'createdAt'>) => void;
  onDeleteRecord: (id: string) => void;
}

const NOTION_PRESETS = [
  { label: '재봉실 +1,500', amount: 1500 },
  { label: '지퍼 +2,000', amount: 2000 },
  { label: '단추/스냅 +1,000', amount: 1000 },
  { label: '접착심지 +1,500', amount: 1500 },
];

export function CostCalculator({
  fabrics,
  records,
  draftPreset,
  onSaveRecord,
  onDeleteRecord,
}: CostCalculatorProps) {
  const [title, setTitle] = useState(draftPreset?.title ?? '');
  const [fabricCost, setFabricCost] = useState<string>(
    draftPreset ? String(draftPreset.fabricCost) : '14000'
  );
  const [notionsCost, setNotionsCost] = useState<string>('3500');
  const [otherCost, setOtherCost] = useState<string>('1000');

  useEffect(() => {
    if (!draftPreset) return;
    setTitle(draftPreset.title);
    setFabricCost(String(draftPreset.fabricCost));
  }, [draftPreset]);

  // Helper state to calculate fabric cost from registered fabrics
  const [showFabricHelper, setShowFabricHelper] = useState(false);
  const [selectedFabricId, setSelectedFabricId] = useState<string>(
    fabrics[0]?.id ?? ''
  );
  const [usedAmount, setUsedAmount] = useState<string>('1');
  const [savedNotice, setSavedNotice] = useState(false);

  // Optional labor & handmade value simulator
  const [laborHours, setLaborHours] = useState<string>('1.5');
  const [hourlyRate, setHourlyRate] = useState<string>('15000');

  const parsedFabric = Math.max(0, Number(fabricCost) || 0);
  const parsedNotions = Math.max(0, Number(notionsCost) || 0);
  const parsedOther = Math.max(0, Number(otherCost) || 0);
  const totalCost = parsedFabric + parsedNotions + parsedOther;

  const estimatedLabor = Math.round(
    Math.max(0, Number(laborHours) || 0) * Math.max(0, Number(hourlyRate) || 0)
  );
  const suggestedWithLabor = totalCost + estimatedLabor;

  const breakdown = useMemo(() => {
    if (totalCost === 0) {
      return { fabricPct: 0, notionsPct: 0, otherPct: 0 };
    }
    return {
      fabricPct: Math.round((parsedFabric / totalCost) * 100),
      notionsPct: Math.round((parsedNotions / totalCost) * 100),
      otherPct: Math.max(
        0,
        100 -
          Math.round((parsedFabric / totalCost) * 100) -
          Math.round((parsedNotions / totalCost) * 100)
      ),
    };
  }, [parsedFabric, parsedNotions, parsedOther, totalCost]);

  const handleApplyFabricCalc = () => {
    const target = fabrics.find((f) => f.id === selectedFabricId);
    if (!target || target.quantity <= 0) return;
    const unitPrice = target.price / target.quantity;
    const used = Math.max(0, Number(usedAmount) || 0);
    const calculated = Math.round(unitPrice * used);
    setFabricCost(String(calculated));
    setShowFabricHelper(false);
  };

  const handleAddNotionsPreset = (amount: number) => {
    setNotionsCost(String(parsedNotions + amount));
  };

  const handleReset = () => {
    setTitle('');
    setFabricCost('');
    setNotionsCost('');
    setOtherCost('');
    setSavedNotice(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCost <= 0) return;
    onSaveRecord({
      title: title.trim() || '이름 없는 제작 원가',
      fabricCost: parsedFabric,
      notionsCost: parsedNotions,
      otherCost: parsedOther,
      totalCost,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleLoadRecord = (record: CostRecord) => {
    setTitle(record.title);
    setFabricCost(String(record.fabricCost));
    setNotionsCost(String(record.notionsCost));
    setOtherCost(String(record.otherCost));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-atelier-serif text-2xl font-bold text-[#262320]">
            원가 계산기
          </h1>
          <p className="mt-1 text-xs text-[#6B655D] sm:text-sm">
            원단·부자재·기타 비용을 입력하면 총 제작 원가와 핸드메이드 적정 가치가 계산됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-xs font-medium text-[#524C46] transition-colors hover:border-[#2B4157] hover:text-[#262320]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>초기화</span>
        </button>
      </div>

      {/* Main Responsive Layout: Total + Form on left, Saved Records on right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          {/* Auto-Calculated Total Cost Card */}
          <section
            aria-label="총 제작 원가 요약"
            className="rounded-3xl bg-[#2B4157] p-5 text-white sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/75 sm:text-sm">
                  순수 재료 원가 (자동 계산)
                </p>
                <p className="tabular-nums mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
                  {formatKRW(totalCost)}
                </p>
              </div>
              <div className="text-right text-xs text-white/80 tabular-nums">
                <p>원단 {breakdown.fabricPct}%</p>
                <p className="mt-0.5">부자재 {breakdown.notionsPct}%</p>
                <p className="mt-0.5">기타 {breakdown.otherPct}%</p>
              </div>
            </div>

            {/* Proportion Bar */}
            <div
              className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-white/15"
              aria-hidden="true"
            >
              <div
                className="bg-[#EDE7DB] transition-all duration-200"
                style={{ width: `${breakdown.fabricPct}%` }}
              />
              <div
                className="bg-[#C29348] transition-all duration-200"
                style={{ width: `${breakdown.notionsPct}%` }}
              />
              <div
                className="bg-[#7D9B86] transition-all duration-200"
                style={{ width: `${breakdown.otherPct}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/80 tabular-nums">
              <span>원단 {formatKRW(parsedFabric)}</span>
              <span aria-hidden="true">·</span>
              <span>부자재 {formatKRW(parsedNotions)}</span>
              <span aria-hidden="true">·</span>
              <span>기타 {formatKRW(parsedOther)}</span>
            </div>
          </section>

          {/* Cost Input Form */}
          <form
            onSubmit={handleSave}
            className="space-y-5 rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6"
          >
            {/* 1. 원단 비용 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="calc-fabric-cost"
                  className="text-sm font-semibold text-[#262320]"
                >
                  원단 비용 (원)
                </label>
                {fabrics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFabricHelper((v) => !v)}
                    className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 text-xs font-medium text-[#2B4157] hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {showFabricHelper ? '직접 입력만 보기' : '보유 원단에서 계산'}
                    </span>
                  </button>
                )}
              </div>

              {showFabricHelper && fabrics.length > 0 && (
                <div className="space-y-2.5 rounded-2xl border border-[#E5E1D8] bg-[#FAF9F6] p-3.5">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <select
                      value={selectedFabricId}
                      onChange={(e) => setSelectedFabricId(e.target.value)}
                      aria-label="원단 선택"
                      className="min-h-[44px] rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs text-[#262320] sm:col-span-2"
                    >
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({formatKRW(f.price)} / {f.quantity}
                          {f.unit})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        value={usedAmount}
                        onChange={(e) => setUsedAmount(e.target.value)}
                        aria-label="사용 수량"
                        placeholder="사용량"
                        className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs text-[#262320]"
                      />
                      <span className="shrink-0 text-xs text-[#6B655D]">
                        {fabrics.find((f) => f.id === selectedFabricId)?.unit ?? '마'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyFabricCalc}
                    className="min-h-[40px] w-full cursor-pointer rounded-xl bg-[#2B4157] text-xs font-medium text-white hover:bg-[#213345]"
                  >
                    원단 비용에 적용하기
                  </button>
                </div>
              )}

              <div className="relative">
                <input
                  id="calc-fabric-cost"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  value={fabricCost}
                  onChange={(e) => setFabricCost(e.target.value)}
                  placeholder="0"
                  className="tabular-nums min-h-[50px] w-full rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] pr-10 pl-4 text-lg font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#6B655D]">
                  원
                </span>
              </div>
            </div>

            {/* 2. 부자재 비용 */}
            <div className="space-y-2">
              <label
                htmlFor="calc-notions-cost"
                className="block text-sm font-semibold text-[#262320]"
              >
                부자재 비용 (실 · 지퍼 · 단추 · 심지 등)
              </label>
              <div className="relative">
                <input
                  id="calc-notions-cost"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  value={notionsCost}
                  onChange={(e) => setNotionsCost(e.target.value)}
                  placeholder="0"
                  className="tabular-nums min-h-[50px] w-full rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] pr-10 pl-4 text-lg font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#6B655D]">
                  원
                </span>
              </div>

              {/* One-Handed Quick Add Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {NOTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddNotionsPreset(preset.amount)}
                    className="min-h-[38px] cursor-pointer rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] px-3 text-xs font-medium text-[#4A453F] transition-colors hover:border-[#2B4157] hover:text-[#2B4157] active:scale-[0.97]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 기타 비용 */}
            <div className="space-y-2">
              <label
                htmlFor="calc-other-cost"
                className="block text-sm font-semibold text-[#262320]"
              >
                기타 비용 (라벨 · 포장 · 패턴 등)
              </label>
              <div className="relative">
                <input
                  id="calc-other-cost"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  placeholder="0"
                  className="tabular-nums min-h-[50px] w-full rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] pr-10 pl-4 text-lg font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#6B655D]">
                  원
                </span>
              </div>
            </div>

            {/* Save Calculation Row */}
            <div className="border-t border-[#F0EDE6] pt-4">
              <label
                htmlFor="calc-record-title"
                className="mb-1.5 block text-xs font-semibold text-[#4A453F]"
              >
                계산 내역 이름 (선택)
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="calc-record-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 린넨 랩 앞치마 원가"
                  className="min-h-[46px] flex-1 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={totalCost <= 0}
                  className="inline-flex min-h-[46px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#2B4157] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#213345] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{savedNotice ? '저장되었습니다' : '기록 저장'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Handmade Value & Labor Simulator */}
          <section
            aria-label="작업 공임 및 적정 가치 참고"
            className="rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-[#262320] sm:text-base">
              작업 시간 포함 핸드메이드 적정 가치 참고
            </h2>
            <p className="mt-0.5 text-xs text-[#6B655D]">
              선물이나 프리마켓 판매 시 공임을 포함한 적정 가격대를 가늠해 볼 수 있습니다.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="labor-hours" className="block text-xs font-semibold text-[#4A453F]">
                  예상 작업 시간 (시간)
                </label>
                <input
                  id="labor-hours"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="hourly-rate" className="block text-xs font-semibold text-[#4A453F]">
                  시간당 공임 기준 (원)
                </label>
                <input
                  id="hourly-rate"
                  type="number"
                  inputMode="numeric"
                  step="1000"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[#F0EDE6] pt-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF9F6] px-4 py-3">
                <p className="text-xs text-[#6B655D]">재료비 + 공임 합계</p>
                <p className="tabular-nums mt-0.5 text-lg font-bold text-[#2B4157]">
                  {formatKRW(suggestedWithLabor)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#FAF9F6] px-4 py-3">
                <p className="text-xs text-[#6B655D]">재료 원가 2배 기준 (간편 계산)</p>
                <p className="tabular-nums mt-0.5 text-lg font-bold text-[#3D5A47]">
                  {formatKRW(totalCost * 2)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Saved Cost Records Column */}
        <section className="rounded-3xl border border-[#E5E1D8] bg-white p-5 sm:p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-[#262320] md:text-lg">
            저장된 원가 내역
          </h2>
          <p className="mt-1 text-xs text-[#6B655D]">
            항목을 누르면 계산기에 다시 불러옵니다.
          </p>

          {records.length === 0 ? (
            <div className="mt-5 border-t border-[#F0EDE6] py-10 text-center">
              <p className="text-sm font-medium text-[#6B655D]">
                아직 저장된 원가 기록이 없습니다.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#F0EDE6] border-t border-[#F0EDE6]">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadRecord(record)}
                    className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                  >
                    <p className="truncate text-sm font-semibold text-[#262320]">
                      {record.title}
                    </p>
                    <p className="tabular-nums mt-0.5 text-xs text-[#6B655D]">
                      원단 {formatKRW(record.fabricCost)} · 부자재{' '}
                      {formatKRW(record.notionsCost)} · 기타{' '}
                      {formatKRW(record.otherCost)}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="tabular-nums text-sm font-bold text-[#2B4157]">
                      {formatKRW(record.totalCost)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      aria-label={`${record.title} 원가 기록 삭제`}
                      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-[#7A736A] transition-colors hover:bg-[#FDF2F2] hover:text-[#A8383B]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
