import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  ExternalLink,
  Layers,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Store,
  Trash2,
  Truck,
} from 'lucide-react';
import {
  buildMallSearchUrl,
  calculateComparisonMetrics,
  ComparisonCalculation,
  INITIAL_FABRIC_COMPARISONS,
  KOREAN_FABRIC_MALLS,
  MALL_CATEGORIES,
  normalizePricePerYard,
  PRICE_UNITS,
  QUICK_FABRIC_SEARCH_KEYWORDS,
} from '../data/fabricMalls';
import {
  FabricComparisonItem,
  FabricMallCategory,
  FabricMallInfo,
  FabricSearchCandidate,
  FabricSearchResponse,
  PriceUnit,
} from '../types/atelier';
import { formatKRW, formatQuantity } from '../utils/formatters';
import { ResponsiveSheet } from './ResponsiveSheet';

export interface ComparisonDraftPreset {
  fabricName?: string;
  mallName?: string;
  unit?: PriceUnit;
  unitPrice?: number;
  shippingFee?: number;
  freeShippingThreshold?: number;
  widthCm?: number;
  productUrl?: string;
  note?: string;
}

interface FabricPriceCompareProps {
  comparisons: FabricComparisonItem[];
  isSheetOpen: boolean;
  editingItem: FabricComparisonItem | null;
  draftPreset: ComparisonDraftPreset | null;
  onOpenCreate: (preset?: ComparisonDraftPreset) => void;
  onOpenEdit: (item: FabricComparisonItem) => void;
  onCloseSheet: () => void;
  onSaveComparison: (
    data: Omit<FabricComparisonItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
  onDeleteComparison: (id: string) => void;
  onResetSamples: () => void;
  onSendToInventory: (
    item: FabricComparisonItem,
    metrics: ComparisonCalculation,
    neededYards: number
  ) => void;
  onSendToCalculator: (
    item: FabricComparisonItem,
    metrics: ComparisonCalculation,
    neededYards: number
  ) => void;
}

const YARD_PRESETS = [1, 2, 3, 5, 10];

export function FabricPriceCompare({
  comparisons,
  isSheetOpen,
  editingItem,
  draftPreset,
  onOpenCreate,
  onOpenEdit,
  onCloseSheet,
  onSaveComparison,
  onDeleteComparison,
  onResetSamples,
  onSendToInventory,
  onSendToCalculator,
}: FabricPriceCompareProps) {
  const [neededYards, setNeededYards] = useState<number>(3);
  const [tableFilterQuery, setTableFilterQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Live Web Search states
  const [searchKeyword, setSearchKeyword] = useState('30수 무지 면');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState<FabricSearchResponse | null>(null);
  const [addedCandidateKeys, setAddedCandidateKeys] = useState<Record<string, boolean>>({});
  const searchRequestIdRef = useRef(0);

  // Mall Directory filter
  const [selectedMallCategory, setSelectedMallCategory] = useState<'전체' | FabricMallCategory>('전체');

  const computedList = useMemo(() => {
    const q = tableFilterQuery.trim().toLowerCase();
    return comparisons
      .filter((item) => {
        if (!q) return true;
        return (
          item.fabricName.toLowerCase().includes(q) ||
          item.mallName.toLowerCase().includes(q) ||
          (item.note ?? '').toLowerCase().includes(q)
        );
      })
      .map((item) => ({
        item,
        metrics: calculateComparisonMetrics(item, neededYards),
      }))
      .sort((a, b) => a.metrics.effectiveTotal - b.metrics.effectiveTotal);
  }, [comparisons, neededYards, tableFilterQuery]);

  const lowestEntry = computedList[0] ?? null;
  const secondEntry = computedList[1] ?? null;
  const savingsVsSecond =
    lowestEntry && secondEntry
      ? Math.max(0, secondEntry.metrics.effectiveTotal - lowestEntry.metrics.effectiveTotal)
      : 0;

  const filteredMalls = useMemo(() => {
    if (selectedMallCategory === '전체') return KOREAN_FABRIC_MALLS;
    return KOREAN_FABRIC_MALLS.filter((mall) => mall.category === selectedMallCategory);
  }, [selectedMallCategory]);

  const adjustYards = (delta: number) => {
    setNeededYards((prev) => {
      const next = Math.max(0.5, Math.round((prev + delta) * 10) / 10);
      return next;
    });
  };

  const runLiveSearch = useCallback(
    async (overrideQuery?: string) => {
      const query = (overrideQuery ?? searchKeyword).trim();
      if (!query) return;
      if (overrideQuery) {
        setSearchKeyword(overrideQuery);
      }

      const reqId = ++searchRequestIdRef.current;
      setSearchStatus('loading');
      setSearchError('');

      try {
        const res = await fetch('/api/fabric-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, neededYards }),
        });
        const data = (await res.json()) as FabricSearchResponse & { error?: string };
        if (reqId !== searchRequestIdRef.current) return;
        if (!res.ok) {
          setSearchStatus('error');
          setSearchError(data.error || '실시간 원단 검색 중 오류가 발생했습니다.');
          return;
        }
        setSearchResult(data);
        setAddedCandidateKeys({});
        setSearchStatus('success');
      } catch {
        if (reqId !== searchRequestIdRef.current) return;
        setSearchStatus('error');
        setSearchError(
          '서버와 연결하지 못했습니다. 잠시 후 다시 시도하거나 아래 쇼핑몰 바로검색을 이용해 주세요.'
        );
      }
    },
    [neededYards, searchKeyword]
  );

  useEffect(() => {
    void runLiveSearch('30수 무지 면');
    // Run initial live market lookup once when entering the comparison view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCandidateToCompare = (candidate: FabricSearchCandidate, index: number) => {
    onSaveComparison({
      fabricName: candidate.productTitle,
      mallName: candidate.mallName,
      unit: candidate.unit,
      unitPrice: candidate.estimatedPricePerYard,
      shippingFee: candidate.shippingFee,
      freeShippingThreshold: candidate.freeShippingThreshold,
      productUrl: candidate.url,
      note: candidate.note || '실시간 검색에서 추가됨',
    });
    const key = `${candidate.mallName}-${candidate.productTitle}-${index}`;
    setAddedCandidateKeys((prev) => ({ ...prev, [key]: true }));
  };

  const handleUseMallPresetForCompare = (mall: FabricMallInfo) => {
    onOpenCreate({
      fabricName: searchKeyword.trim() ? `${searchKeyword.trim()} 원단` : '',
      mallName: mall.name,
      unit: '1마',
      shippingFee: mall.defaultShippingFee,
      freeShippingThreshold: mall.freeShippingThreshold,
      productUrl: buildMallSearchUrl(mall, searchKeyword),
      note: mall.shippingTip,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-atelier-serif text-2xl font-bold text-[#262320] md:text-3xl">
            원단 가격비교
          </h1>
          <p className="mt-1 text-xs text-[#6B655D] sm:text-sm">
            반마·1야드·1m 가격을 1마(90cm) 단가로 자동 환산하고 배송비 포함 실질 최저가를 계산합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreate()}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#213345] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="whitespace-nowrap">비교 원단 추가</span>
        </button>
      </div>

      {/* Target Purchase Length + Real Lowest Price Summary */}
      <section
        aria-label="구매 예정 길이 및 최저가 요약"
        className="rounded-3xl border border-[#E5E1D8] bg-white p-5 md:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold text-[#262320]">
                이번에 살 원단 길이 (마)
              </span>
              <span className="text-xs text-[#7A736A]">
                1마 = 90cm · 반마 = 45cm · 1야드 = 91.4cm · 1m = 100cm
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center overflow-hidden rounded-xl border border-[#DFDBD2] bg-[#FAF9F6]">
                <button
                  type="button"
                  onClick={() => adjustYards(-0.5)}
                  aria-label="필요 길이 0.5마 감소"
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-[#262320] transition-colors hover:bg-[#EFECE5]"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="flex items-center border-x border-[#E5E1D8] bg-white px-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    step="0.5"
                    aria-label="필요한 원단 길이(마)"
                    value={neededYards}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (Number.isFinite(val) && val > 0) {
                        setNeededYards(Math.min(100, val));
                      }
                    }}
                    className="tabular-nums min-h-[44px] w-14 text-center text-base font-bold text-[#262320] focus:outline-none"
                  />
                  <span className="pr-1.5 text-xs font-medium text-[#6B655D]">마</span>
                </div>
                <button
                  type="button"
                  onClick={() => adjustYards(0.5)}
                  aria-label="필요 길이 0.5마 증가"
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-[#262320] transition-colors hover:bg-[#EFECE5]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {YARD_PRESETS.map((yard) => {
                  const active = neededYards === yard;
                  return (
                    <button
                      key={yard}
                      type="button"
                      onClick={() => setNeededYards(yard)}
                      className={`min-h-[40px] cursor-pointer rounded-xl px-3 text-xs font-medium tabular-nums transition-colors ${
                        active
                          ? 'bg-[#2B4157] text-white'
                          : 'border border-[#DFDBD2] bg-white text-[#524C46] hover:border-[#2B4157]/50'
                      }`}
                    >
                      {yard}마
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {lowestEntry && (
            <div className="rounded-2xl border border-[#3D5A47]/25 bg-[#F6F9F7] px-4 py-3.5 lg:min-w-[290px]">
              <p className="text-xs font-medium text-[#3D5A47]">
                {formatQuantity(neededYards)}마 기준 실질 최저가 · {lowestEntry.item.mallName}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <p className="tabular-nums text-2xl font-bold tracking-tight text-[#262320]">
                  {formatKRW(lowestEntry.metrics.effectiveTotal)}
                </p>
                <span className="tabular-nums text-xs font-medium text-[#524C46]">
                  실질 1마당 {formatKRW(lowestEntry.metrics.effectivePerYard)}
                </span>
              </div>
              {savingsVsSecond > 0 && (
                <p className="tabular-nums mt-0.5 text-xs text-[#3D5A47]">
                  2위({secondEntry.item.mallName})보다 총 {formatKRW(savingsVsSecond)} 절약
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 1: 1마당 실질 단가 & 배송비 자동 비교표 */}
      <section aria-label="1마당 실질 단가 비교표" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#262320]">
              내 원단 단가 비교표 ({computedList.length}건)
            </h2>
            <p className="text-xs text-[#6B655D]">
              배송비를 합산한 실질 총 결제액이 가장 저렴한 순으로 자동 정렬됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7A736A]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={tableFilterQuery}
                onChange={(e) => setTableFilterQuery(e.target.value)}
                placeholder="비교 목록 내 검색..."
                aria-label="비교 목록 검색"
                className="min-h-[42px] w-full rounded-xl border border-[#DFDBD2] bg-white pr-3 pl-9 text-xs text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none sm:text-sm"
              />
            </div>

            {comparisons.length === 0 && (
              <button
                type="button"
                onClick={onResetSamples}
                className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#524C46] hover:border-[#2B4157]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>예시 채우기</span>
              </button>
            )}
          </div>
        </div>

        {computedList.length === 0 ? (
          <div className="rounded-3xl border border-[#E5E1D8] bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-[#262320]">
              비교할 원단이 아직 없습니다
            </p>
            <p className="mt-1 text-xs text-[#6B655D] sm:text-sm">
              아래에서 원단을 검색해 추가하거나 직접 가격과 배송비를 입력해 비교해 보세요.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCreate()}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 text-sm font-medium text-white hover:bg-[#213345]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>직접 추가하기</span>
              </button>
              <button
                type="button"
                onClick={onResetSamples}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-4 text-sm font-medium text-[#262320] hover:border-[#2B4157]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>비교 예시 불러오기</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {computedList.map(({ item, metrics }, index) => {
              const isBest = index === 0;
              const confirmingDelete = deleteConfirmId === item.id;
              const diffFromBest =
                lowestEntry && !isBest
                  ? metrics.effectiveTotal - lowestEntry.metrics.effectiveTotal
                  : 0;

              return (
                <article
                  key={item.id}
                  className={`rounded-3xl border p-4 transition-colors sm:p-5 ${
                    isBest
                      ? 'border-[#3D5A47]/45 bg-[#F6F9F7]'
                      : 'border-[#E5E1D8] bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Title + Clean Unboxed Metadata */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span
                          className={`font-semibold tabular-nums ${
                            isBest ? 'text-[#3D5A47]' : 'text-[#2B4157]'
                          }`}
                        >
                          {isBest ? '1위 · 실질 최저가' : `${index + 1}위`}
                        </span>
                        <span className="text-[#9C9488]" aria-hidden="true">·</span>
                        <span className="font-semibold text-[#262320]">{item.mallName}</span>
                        {item.widthCm && (
                          <>
                            <span className="text-[#9C9488]" aria-hidden="true">·</span>
                            <span className="tabular-nums text-[#6B655D]">폭 {item.widthCm}cm</span>
                          </>
                        )}
                        {diffFromBest > 0 && (
                          <>
                            <span className="text-[#9C9488]" aria-hidden="true">·</span>
                            <span className="tabular-nums text-[#A8383B]">
                              최저가보다 +{formatKRW(diffFromBest)}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-[#262320] sm:text-lg">
                        {item.fabricName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B655D] tabular-nums">
                        <span>
                          판매가 {formatKRW(item.unitPrice)} / {item.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#262320]">
                          1마 환산 {formatKRW(metrics.normalizedPerYard)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.freeShippingThreshold > 0
                            ? `${formatKRW(item.freeShippingThreshold)} 이상 무료배송`
                            : item.shippingFee === 0
                              ? '무료배송 조건'
                              : `배송비 ${formatKRW(item.shippingFee)}`}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs leading-relaxed text-[#7A736A]">
                          {item.note}
                        </p>
                      )}
                    </div>

                    {/* Right: Tabular Price Breakdown + Actions */}
                    <div className="flex flex-col gap-3 border-t border-[#E5E1D8]/80 pt-3 lg:shrink-0 lg:items-end lg:border-t-0 lg:pt-0">
                      <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:text-right">
                        <div>
                          <p className="text-[11px] text-[#7A736A]">
                            원단 {formatQuantity(neededYards)}마
                          </p>
                          <p className="tabular-nums text-sm font-semibold text-[#262320]">
                            {formatKRW(metrics.merchandiseTotal)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-[#7A736A]">배송비</p>
                          <p
                            className={`tabular-nums text-sm font-semibold ${
                              metrics.isFreeShipping ? 'text-[#3D5A47]' : 'text-[#262320]'
                            }`}
                          >
                            {metrics.isFreeShipping ? '무료' : formatKRW(metrics.appliedShipping)}
                          </p>
                          {metrics.remainingForFreeShipping > 0 && (
                            <p className="tabular-nums text-[10px] text-[#7A736A]">
                              무배까지 {formatKRW(metrics.remainingForFreeShipping)}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] text-[#7A736A]">실질 총액</p>
                          <p
                            className={`tabular-nums text-base font-bold sm:text-lg ${
                              isBest ? 'text-[#3D5A47]' : 'text-[#2B4157]'
                            }`}
                          >
                            {formatKRW(metrics.effectiveTotal)}
                          </p>
                          <p className="tabular-nums text-[11px] text-[#6B655D]">
                            마당 {formatKRW(metrics.effectivePerYard)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSendToInventory(item, metrics, neededYards)}
                          className="inline-flex min-h-[40px] cursor-pointer items-center gap-1 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#262320] transition-colors hover:border-[#2B4157] hover:text-[#2B4157]"
                        >
                          <Layers className="h-3.5 w-3.5 text-[#2B4157]" aria-hidden="true" />
                          <span className="whitespace-nowrap">원단함에 담기</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSendToCalculator(item, metrics, neededYards)}
                          className="inline-flex min-h-[40px] cursor-pointer items-center gap-1 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#262320] transition-colors hover:border-[#2B4157] hover:text-[#2B4157]"
                        >
                          <Calculator className="h-3.5 w-3.5 text-[#2B4157]" aria-hidden="true" />
                          <span className="whitespace-nowrap">원가 계산</span>
                        </button>

                        {item.productUrl && (
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#2B4157] transition-colors hover:border-[#2B4157]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="whitespace-nowrap">사이트</span>
                          </a>
                        )}

                        {confirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteComparison(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="min-h-[40px] cursor-pointer rounded-xl bg-[#A8383B] px-2.5 text-xs font-medium text-white"
                            >
                              삭제 확인
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="min-h-[40px] cursor-pointer rounded-xl border border-[#DFDBD2] bg-white px-2.5 text-xs font-medium text-[#6B655D]"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(item)}
                              aria-label={`${item.fabricName} 비교 항목 수정`}
                              className="flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#EFECE5] hover:text-[#262320]"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              aria-label={`${item.fabricName} 비교 항목 삭제`}
                              className="flex min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#FDF2F2] hover:text-[#A8383B]"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: 실시간 원단 최저가 웹검색 + 쇼핑몰 바로검색 */}
      <section
        aria-label="실시간 원단 웹검색"
        className="space-y-4 rounded-3xl border border-[#E5E1D8] bg-white p-5 md:p-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-[#262320]">
            실시간 원단 시세 검색 · 쇼핑몰 바로 찾기
          </h2>
          <p className="mt-0.5 text-xs text-[#6B655D] sm:text-sm">
            원하는 원단 이름을 검색하면 실시간 온라인 시세와 판매처를 정리해 드리고, 각 쇼핑몰 검색 페이지로 바로 이동할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runLiveSearch();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A736A]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="예: 30수 무지 면, 프렌치 워싱 린넨, 10수 옥스포드"
              aria-label="실시간 원단 검색어"
              className="min-h-[46px] w-full rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] pr-4 pl-10 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searchStatus === 'loading' || !searchKeyword.trim()}
            className="inline-flex min-h-[46px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2B4157] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#213345] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searchStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap">
              {searchStatus === 'loading' ? '검색 중...' : '실시간 시세 검색'}
            </span>
          </button>
        </form>

        {/* Quick Keyword Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-[#7A736A]">자주 찾는 원단:</span>
          {QUICK_FABRIC_SEARCH_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => runLiveSearch(kw)}
              className="min-h-[36px] cursor-pointer rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] px-3 text-xs font-medium text-[#4A453F] transition-colors hover:border-[#2B4157] hover:text-[#2B4157]"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Direct Store Search Links */}
        <div className="border-t border-[#F0EDE6] pt-4">
          <p className="mb-2 text-xs font-semibold text-[#4A453F]">
            입력한 검색어({searchKeyword.trim() || '원단'})로 쇼핑몰에서 바로 검색하기
          </p>
          <div className="flex flex-wrap gap-2">
            {KOREAN_FABRIC_MALLS.map((mall) => (
              <a
                key={mall.id}
                href={buildMallSearchUrl(mall, searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-xs font-medium text-[#262320] transition-colors hover:border-[#2B4157] hover:text-[#2B4157]"
              >
                <span className="whitespace-nowrap">{mall.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#7A736A]" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Search States: Loading / Error / Success */}
        {searchStatus === 'loading' && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#E5E1D8] bg-[#FAF9F6] p-4 text-sm text-[#524C46]">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2B4157]" aria-hidden="true" />
            <span>
              &ldquo;{searchKeyword}&rdquo; 원단의 국내 온라인 판매처와 1마당 시세를 검색하고 있습니다...
            </span>
          </div>
        )}

        {searchStatus === 'error' && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E7C2C3] bg-[#FDF2F2] p-4 sm:flex-row sm:items-center">
            <p className="text-xs font-medium text-[#A8383B] sm:text-sm">{searchError}</p>
            <button
              type="button"
              onClick={() => runLiveSearch()}
              className="min-h-[40px] shrink-0 cursor-pointer rounded-xl border border-[#E7C2C3] bg-white px-3.5 text-xs font-semibold text-[#A8383B] hover:bg-[#FAF9F6]"
            >
              다시 시도
            </button>
          </div>
        )}

        {searchStatus === 'success' && searchResult && (
          <div className="space-y-4 border-t border-[#F0EDE6] pt-4">
            <div className="rounded-2xl bg-[#FAF9F6] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#262320]">
                  &ldquo;{searchResult.query}&rdquo; 실시간 시세 요약
                </h3>
                <span className="tabular-nums text-sm font-bold text-[#2B4157]">
                  {searchResult.priceRangeText}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#524C46] sm:text-sm">
                {searchResult.marketSummary}
              </p>
              <p className="mt-2 text-xs font-medium text-[#3D5A47]">
                구매 팁: {searchResult.shoppingTip}
              </p>
            </div>

            {searchResult.candidates.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-[#4A453F]">
                  검색된 원단 후보 (버튼을 누르면 위 단가 비교표에 바로 추가됩니다)
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {searchResult.candidates.map((candidate, idx) => {
                    const key = `${candidate.mallName}-${candidate.productTitle}-${idx}`;
                    const isAdded = Boolean(addedCandidateKeys[key]);
                    const estTotal =
                      normalizePricePerYard(candidate.estimatedPricePerYard, candidate.unit) *
                      neededYards;

                    return (
                      <div
                        key={key}
                        className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E5E1D8] bg-white p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-xs text-[#6B655D]">
                            <span className="font-semibold text-[#2B4157]">
                              {candidate.mallName}
                            </span>
                            <span className="tabular-nums">
                              배송비 {formatKRW(candidate.shippingFee)} ·{' '}
                              {formatKRW(candidate.freeShippingThreshold)}↑ 무배
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#262320]">
                            {candidate.productTitle}
                          </p>
                          <p className="tabular-nums text-xs font-medium text-[#262320]">
                            예상가 {formatKRW(candidate.estimatedPricePerYard)} / {candidate.unit}{' '}
                            <span className="font-normal text-[#7A736A]">
                              ({formatQuantity(neededYards)}마 기준 약 {formatKRW(estTotal)})
                            </span>
                          </p>
                          {candidate.note && (
                            <p className="text-xs text-[#7A736A]">{candidate.note}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddCandidateToCompare(candidate, idx)}
                            disabled={isAdded}
                            className={`inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors ${
                              isAdded
                                ? 'border border-[#3D5A47]/40 bg-[#F6F9F7] text-[#3D5A47]'
                                : 'bg-[#2B4157] text-white hover:bg-[#213345]'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>비교표에 추가됨</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>비교표에 추가</span>
                              </>
                            )}
                          </button>

                          {candidate.url && (
                            <a
                              href={candidate.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#DFDBD2] px-3 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
                            >
                              <span>링크</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {searchResult.sources.length > 0 && (
              <div className="border-t border-[#F0EDE6] pt-3">
                <p className="mb-1.5 text-xs font-medium text-[#7A736A]">
                  검색 출처 링크
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {searchResult.sources.map((source) => (
                    <a
                      key={source.uri}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#2B4157] underline-offset-2 hover:underline"
                    >
                      <span className="max-w-[220px] truncate">{source.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 3: 국내 저렴한 원단 쇼핑몰 디렉토리 */}
      <section aria-label="국내 원단 쇼핑몰 디렉토리" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#262320]">
              국내 알뜰 원단 쇼핑몰 모음
            </h2>
            <p className="text-xs text-[#6B655D] sm:text-sm">
              쇼핑몰별 주력 품목, 장단점, 무료배송 기준을 비교하고 바로 이동할 수 있습니다.
            </p>
          </div>
        </div>

        <div
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label="쇼핑몰 성격 필터"
        >
          {MALL_CATEGORIES.map((category) => {
            const active = selectedMallCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedMallCategory(category)}
                className={`min-h-[40px] shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  active
                    ? 'bg-[#2B4157] text-white'
                    : 'border border-[#E5E1D8] bg-white text-[#6B655D] hover:text-[#262320]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredMalls.map((mall) => (
            <article
              key={mall.id}
              className="flex flex-col justify-between rounded-3xl border border-[#E5E1D8] bg-white p-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#6B655D]">
                      <span>{mall.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#3D5A47]">{mall.priceTier}</span>
                    </div>
                    <h3 className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-[#262320] sm:text-lg">
                      <Store className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
                      <span>{mall.name}</span>
                    </h3>
                  </div>

                  <a
                    href={mall.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-xs font-medium text-[#2B4157] hover:border-[#2B4157]"
                  >
                    <span>사이트 열기</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-xs leading-relaxed text-[#262320] sm:text-sm">
                  {mall.highlight}
                </p>

                <div className="space-y-1.5 border-t border-[#F0EDE6] pt-3 text-xs">
                  <p className="text-[#4A453F]">
                    <span className="font-semibold text-[#3D5A47]">장점: </span>
                    {mall.pros}
                  </p>
                  <p className="text-[#6B655D]">
                    <span className="font-semibold text-[#7A5C43]">참고: </span>
                    {mall.cons}
                  </p>
                  <p className="text-[#524C46]">
                    <span className="font-semibold text-[#262320]">추천 품목: </span>
                    {mall.bestFor.join(' · ')}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#F0EDE6] pt-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#524C46]">
                  <Truck className="h-3.5 w-3.5 text-[#2B4157]" aria-hidden="true" />
                  <span>{mall.shippingTip}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleUseMallPresetForCompare(mall)}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1 rounded-xl bg-[#FAF9F6] px-3 text-xs font-semibold text-[#2B4157] transition-colors hover:bg-[#EFECE5]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="whitespace-nowrap">이 배송 조건으로 비교 추가</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Create / Edit Comparison Sheet */}
      <ComparisonFormSheet
        key={
          editingItem
            ? editingItem.id
            : draftPreset
              ? `preset-${draftPreset.mallName}-${draftPreset.fabricName}`
              : isSheetOpen
                ? 'new-compare'
                : 'closed'
        }
        open={isSheetOpen}
        editingItem={editingItem}
        draftPreset={draftPreset}
        onClose={onCloseSheet}
        onSave={onSaveComparison}
      />
    </div>
  );
}

interface ComparisonFormSheetProps {
  open: boolean;
  editingItem: FabricComparisonItem | null;
  draftPreset: ComparisonDraftPreset | null;
  onClose: () => void;
  onSave: (
    data: Omit<FabricComparisonItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
}

function ComparisonFormSheet({
  open,
  editingItem,
  draftPreset,
  onClose,
  onSave,
}: ComparisonFormSheetProps) {
  const [fabricName, setFabricName] = useState(
    editingItem?.fabricName ?? draftPreset?.fabricName ?? ''
  );
  const [mallName, setMallName] = useState(
    editingItem?.mallName ?? draftPreset?.mallName ?? '도우패브릭'
  );
  const [unit, setUnit] = useState<PriceUnit>(
    editingItem?.unit ?? draftPreset?.unit ?? '1마'
  );
  const [unitPrice, setUnitPrice] = useState(
    editingItem
      ? String(editingItem.unitPrice)
      : draftPreset?.unitPrice
        ? String(draftPreset.unitPrice)
        : ''
  );
  const [shippingFee, setShippingFee] = useState(
    editingItem
      ? String(editingItem.shippingFee)
      : draftPreset?.shippingFee !== undefined
        ? String(draftPreset.shippingFee)
        : '2500'
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    editingItem
      ? String(editingItem.freeShippingThreshold)
      : draftPreset?.freeShippingThreshold !== undefined
        ? String(draftPreset.freeShippingThreshold)
        : '50000'
  );
  const [widthCm, setWidthCm] = useState(
    editingItem?.widthCm
      ? String(editingItem.widthCm)
      : draftPreset?.widthCm
        ? String(draftPreset.widthCm)
        : '110'
  );
  const [productUrl, setProductUrl] = useState(
    editingItem?.productUrl ?? draftPreset?.productUrl ?? ''
  );
  const [note, setNote] = useState(
    editingItem?.note ?? draftPreset?.note ?? ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  const previewNormalized = normalizePricePerYard(Number(unitPrice) || 0, unit);

  const handleSelectMallPreset = (mall: FabricMallInfo) => {
    setMallName(mall.name);
    setShippingFee(String(mall.defaultShippingFee));
    setFreeShippingThreshold(String(mall.freeShippingThreshold));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFabric = fabricName.trim();
    const trimmedMall = mallName.trim();
    const parsedUnitPrice = Math.max(0, Math.round(Number(unitPrice) || 0));

    if (!trimmedFabric) {
      setErrorMsg('원단 이름을 입력해 주세요.');
      return;
    }
    if (!trimmedMall) {
      setErrorMsg('쇼핑몰 이름을 입력해 주세요.');
      return;
    }
    if (parsedUnitPrice <= 0) {
      setErrorMsg('표시 가격(원)을 0보다 크게 입력해 주세요.');
      return;
    }

    const parsedWidth = Number(widthCm);
    const trimmedUrl = productUrl.trim();

    onSave(
      {
        fabricName: trimmedFabric,
        mallName: trimmedMall,
        unit,
        unitPrice: parsedUnitPrice,
        shippingFee: Math.max(0, Math.round(Number(shippingFee) || 0)),
        freeShippingThreshold: Math.max(
          0,
          Math.round(Number(freeShippingThreshold) || 0)
        ),
        widthCm: parsedWidth > 0 ? parsedWidth : undefined,
        productUrl:
          trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
            ? trimmedUrl
            : undefined,
        note: note.trim() || undefined,
      },
      editingItem?.id
    );
    onClose();
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={editingItem ? '가격비교 항목 수정' : '비교 원단 추가'}
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 cursor-pointer rounded-xl border border-[#DFDBD2] bg-white text-sm font-medium text-[#262320] hover:bg-[#F3F1EC]"
          >
            취소
          </button>
          <button
            type="submit"
            form="compare-form"
            className="min-h-[48px] flex-[2] cursor-pointer rounded-xl bg-[#2B4157] text-sm font-semibold text-white hover:bg-[#213345] active:scale-[0.98]"
          >
            {editingItem ? '수정 저장' : '비교표에 저장'}
          </button>
        </div>
      }
    >
      <form id="compare-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <p className="rounded-xl border border-[#E7C2C3] bg-[#FDF2F2] px-3.5 py-2.5 text-xs font-medium text-[#A8383B]">
            {errorMsg}
          </p>
        )}

        {/* Mall Quick Select */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-[#4A453F]">
            쇼핑몰 배송 조건 자동 채우기
          </span>
          <div className="flex flex-wrap gap-1.5">
            {KOREAN_FABRIC_MALLS.map((mall) => (
              <button
                key={mall.id}
                type="button"
                onClick={() => handleSelectMallPreset(mall)}
                className={`min-h-[36px] cursor-pointer rounded-xl px-3 text-xs font-medium transition-colors ${
                  mallName === mall.name
                    ? 'bg-[#2B4157] text-white'
                    : 'border border-[#DFDBD2] bg-white text-[#524C46] hover:border-[#2B4157]/50'
                }`}
              >
                {mall.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="cmp-mall" className="block text-xs font-semibold text-[#4A453F]">
              판매처 (쇼핑몰)
            </label>
            <input
              id="cmp-mall"
              type="text"
              required
              value={mallName}
              onChange={(e) => setMallName(e.target.value)}
              placeholder="예: 도우패브릭"
              className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cmp-name" className="block text-xs font-semibold text-[#4A453F]">
              원단 이름
            </label>
            <input
              id="cmp-name"
              type="text"
              required
              value={fabricName}
              onChange={(e) => setFabricName(e.target.value)}
              placeholder="예: 30수 순면 무지"
              className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>
        </div>

        {/* Unit & Price */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#4A453F]">
            판매 단위 (반마/1마/야드/m 자동 환산)
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {PRICE_UNITS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                className={`min-h-[40px] cursor-pointer rounded-xl px-2 text-xs font-medium transition-colors ${
                  unit === u.value
                    ? 'bg-[#2B4157] text-white'
                    : 'border border-[#DFDBD2] bg-white text-[#524C46]'
                }`}
              >
                {u.value}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="cmp-price" className="block text-xs font-semibold text-[#4A453F]">
              표시 가격 ({unit} 기준 · 원)
            </label>
            <input
              id="cmp-price"
              type="number"
              inputMode="numeric"
              min="0"
              step="10"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="예: 3400"
              className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm font-semibold text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
            {previewNormalized > 0 && (
              <p className="tabular-nums text-xs font-medium text-[#3D5A47]">
                1마(90cm) 환산 단가: {formatKRW(previewNormalized)}
              </p>
            )}
          </div>
        </div>

        {/* Shipping Fee & Free Shipping Threshold */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="cmp-shipping" className="block text-xs font-semibold text-[#4A453F]">
              기본 배송비 (원)
            </label>
            <input
              id="cmp-shipping"
              type="number"
              inputMode="numeric"
              min="0"
              step="500"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cmp-free" className="block text-xs font-semibold text-[#4A453F]">
              무료배송 기준 (원 · 0은 무배없음)
            </label>
            <input
              id="cmp-free"
              type="number"
              inputMode="numeric"
              min="0"
              step="5000"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="cmp-width" className="block text-xs font-semibold text-[#4A453F]">
              원단 폭 (cm · 선택)
            </label>
            <input
              id="cmp-width"
              type="number"
              inputMode="numeric"
              min="0"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              placeholder="110"
              className="tabular-nums min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="cmp-url" className="block text-xs font-semibold text-[#4A453F]">
              상품 링크 URL (선택)
            </label>
            <input
              id="cmp-url"
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
              className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cmp-note" className="block text-xs font-semibold text-[#4A453F]">
            메모 (선택)
          </label>
          <input
            id="cmp-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 수요일 앱 3만원 무배 쿠폰 적용 가능"
            className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
          />
        </div>
      </form>
    </ResponsiveSheet>
  );
}

export { INITIAL_FABRIC_COMPARISONS };
