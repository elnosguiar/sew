import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ATELIER_COLOR_PRESETS,
  FABRIC_CATEGORIES,
  STUDIO_SAMPLE_IMAGES,
} from '../data/initialData';
import { FabricCategory, FabricItem, FabricUnit } from '../types/atelier';
import { compressImageFile, formatKRW, formatQuantity } from '../utils/formatters';
import { FabricThumbnail } from './FabricThumbnail';
import { ResponsiveSheet } from './ResponsiveSheet';

interface FabricManagerProps {
  fabrics: FabricItem[];
  isSheetOpen: boolean;
  editingFabric: FabricItem | null;
  onOpenCreate: () => void;
  onOpenEdit: (fabric: FabricItem) => void;
  onCloseSheet: () => void;
  onSaveFabric: (
    data: Omit<FabricItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
  onDeleteFabric: (id: string) => void;
  onAdjustQuantity: (id: string, delta: number) => void;
}

export function FabricManager({
  fabrics,
  isSheetOpen,
  editingFabric,
  onOpenCreate,
  onOpenEdit,
  onCloseSheet,
  onSaveFabric,
  onDeleteFabric,
  onAdjustQuantity,
}: FabricManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredFabrics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fabrics.filter((item) => {
      const matchesCat =
        selectedCategory === '전체' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.colorName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.note ?? '').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [fabrics, searchQuery, selectedCategory]);

  const totalInventoryValue = useMemo(
    () => fabrics.reduce((sum, item) => sum + item.price, 0),
    [fabrics]
  );

  return (
    <div className="space-y-5">
      {/* Page Title & Action Row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-atelier-serif text-2xl font-bold text-[#262320]">
            원단 관리
          </h1>
          <p className="mt-1 text-xs text-[#6B655D] tabular-nums sm:text-sm">
            등록 원단 {fabrics.length}종 · 누적 구매액 {formatKRW(totalInventoryValue)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#213345] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="whitespace-nowrap">원단 등록</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A736A]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="원단 이름, 색상, 종류, 메모 검색..."
            aria-label="원단 검색"
            className="min-h-[44px] w-full rounded-2xl border border-[#DFDBD2] bg-white pr-4 pl-10 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>

        <div
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label="원단 종류 필터"
        >
          {['전체', ...FABRIC_CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:text-sm ${
                  active
                    ? 'bg-[#2B4157] text-white'
                    : 'border border-[#E5E1D8] bg-white text-[#6B655D] hover:text-[#262320]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric Cards Grid */}
      {filteredFabrics.length === 0 ? (
        <div className="rounded-3xl border border-[#E5E1D8] bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-[#262320]">
            조건에 맞는 원단이 없습니다
          </p>
          <p className="mt-1 text-sm text-[#6B655D]">
            검색어를 바꾸거나 새로운 원단을 등록해 보세요.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#213345]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>새 원단 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFabrics.map((fabric) => {
            const confirmingDelete = deleteConfirmId === fabric.id;
            const isLowStock = fabric.quantity > 0 && fabric.quantity <= 0.5;
            const isOutOfStock = fabric.quantity === 0;

            return (
              <article
                key={fabric.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-[#E5E1D8] bg-white"
              >
                <FabricThumbnail
                  imageUrl={fabric.imageUrl}
                  colorHex={fabric.colorHex}
                  name={fabric.name}
                  className="aspect-[4/3] w-full border-b border-[#F0EDE6]"
                />

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold text-[#262320]">
                        {fabric.name}
                      </h2>
                      <span className="tabular-nums shrink-0 text-sm font-semibold text-[#262320]">
                        {formatKRW(fabric.price)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#6B655D]">
                      <span>{fabric.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/15"
                        style={{ backgroundColor: fabric.colorHex }}
                        aria-hidden="true"
                      />
                      <span>{fabric.colorName}</span>
                      {fabric.widthCm && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">폭 {fabric.widthCm}cm</span>
                        </>
                      )}
                    </div>

                    {(isLowStock || isOutOfStock) && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#A8383B]">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isOutOfStock ? '보유 소진' : '잔여 소량 (0.5 이하)'}</span>
                      </p>
                    )}

                    {fabric.note && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#7A736A]">
                        {fabric.note}
                      </p>
                    )}
                  </div>

                  {/* Thumb-Friendly Quantity Stepper & Actions */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#F0EDE6] pt-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onAdjustQuantity(fabric.id, -0.5)}
                        aria-label={`${fabric.name} 수량 0.5 감소`}
                        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="tabular-nums min-w-[60px] text-center text-sm font-semibold text-[#262320]">
                        {formatQuantity(fabric.quantity)}
                        <span className="ml-0.5 text-xs font-normal text-[#6B655D]">
                          {fabric.unit}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdjustQuantity(fabric.id, 0.5)}
                        aria-label={`${fabric.name} 수량 0.5 증가`}
                        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {confirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteFabric(fabric.id);
                            setDeleteConfirmId(null);
                          }}
                          className="min-h-[44px] cursor-pointer rounded-xl bg-[#A8383B] px-3 text-xs font-medium text-white hover:bg-[#8E2D30]"
                        >
                          삭제 확인
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="min-h-[44px] cursor-pointer rounded-xl border border-[#DFDBD2] px-2.5 text-xs font-medium text-[#6B655D]"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(fabric)}
                          aria-label={`${fabric.name} 수정`}
                          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#F3F1EC] hover:text-[#262320] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(fabric.id)}
                          aria-label={`${fabric.name} 삭제`}
                          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#FDF2F2] hover:text-[#A8383B] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Fabric Bottom Sheet */}
      <FabricFormSheet
        key={editingFabric ? editingFabric.id : isSheetOpen ? 'new-open' : 'closed'}
        open={isSheetOpen}
        editingFabric={editingFabric}
        onClose={onCloseSheet}
        onSave={onSaveFabric}
      />
    </div>
  );
}

interface FabricFormSheetProps {
  open: boolean;
  editingFabric: FabricItem | null;
  onClose: () => void;
  onSave: (data: Omit<FabricItem, 'id' | 'createdAt'>, existingId?: string) => void;
}

function FabricFormSheet({
  open,
  editingFabric,
  onClose,
  onSave,
}: FabricFormSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(editingFabric?.name ?? '');
  const [category, setCategory] = useState<FabricCategory>(
    editingFabric?.category ?? '린넨'
  );
  const [colorName, setColorName] = useState(
    editingFabric?.colorName ?? '내추럴 아이보리'
  );
  const [colorHex, setColorHex] = useState(editingFabric?.colorHex ?? '#EDE7DB');
  const [quantity, setQuantity] = useState(
    editingFabric ? String(editingFabric.quantity) : '2'
  );
  const [unit, setUnit] = useState<FabricUnit>(editingFabric?.unit ?? '마');
  const [widthCm, setWidthCm] = useState(
    editingFabric?.widthCm ? String(editingFabric.widthCm) : '145'
  );
  const [price, setPrice] = useState(
    editingFabric ? String(editingFabric.price) : ''
  );
  const [note, setNote] = useState(editingFabric?.note ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(
    editingFabric?.imageUrl ?? null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImg(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch {
      setErrorMsg('사진을 처리하지 못했습니다. 다른 이미지를 선택해 주세요.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('원단 이름을 입력해 주세요.');
      return;
    }
    const parsedQty = Math.max(0, Number(quantity) || 0);
    const parsedPrice = Math.max(0, Number(price) || 0);
    const parsedWidth = Number(widthCm);

    onSave(
      {
        name: trimmedName,
        category,
        colorName: colorName.trim() || '기본 색상',
        colorHex,
        quantity: parsedQty,
        unit,
        widthCm: parsedWidth > 0 ? parsedWidth : undefined,
        price: parsedPrice,
        note: note.trim() || undefined,
        imageUrl,
      },
      editingFabric?.id
    );
    onClose();
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={editingFabric ? '원단 정보 수정' : '새 원단 등록'}
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
            form="fabric-form"
            className="min-h-[48px] flex-[2] cursor-pointer rounded-xl bg-[#2B4157] text-sm font-semibold text-white hover:bg-[#213345] active:scale-[0.98]"
          >
            {editingFabric ? '수정 저장' : '원단 저장'}
          </button>
        </div>
      }
    >
      <form id="fabric-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <p className="rounded-xl border border-[#E7C2C3] bg-[#FDF2F2] px-3.5 py-2.5 text-xs font-medium text-[#A8383B]">
            {errorMsg}
          </p>
        )}

        {/* 원단 사진 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#4A453F]">
            원단 사진
          </label>
          <div className="flex items-center gap-3.5">
            <FabricThumbnail
              imageUrl={imageUrl}
              colorHex={colorHex}
              name={name || '원단 미리보기'}
              className="h-20 w-24 shrink-0 rounded-2xl border border-[#E5E1D8]"
            />
            <div className="flex flex-1 flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessingImg}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3.5 py-2 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
              >
                <Camera className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
                <span>{isProcessingImg ? '불러오는 중...' : '사진 선택 / 촬영'}</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="min-h-[44px] cursor-pointer rounded-xl px-3 text-xs font-medium text-[#6B655D] hover:text-[#A8383B]"
                >
                  사진 지우기
                </button>
              )}
            </div>
          </div>

          {/* Studio Swatch Presets */}
          <div className="pt-1">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] text-[#7A736A]">
              <Upload className="h-3 w-3" aria-hidden="true" />
              <span>기본 공방 샘플 사진으로 선택하기</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STUDIO_SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.url}
                  type="button"
                  onClick={() => setImageUrl(sample.url)}
                  className={`group overflow-hidden rounded-xl border text-left transition-all ${
                    imageUrl === sample.url
                      ? 'border-[#2B4157] ring-2 ring-[#2B4157]/25'
                      : 'border-[#E5E1D8] hover:border-[#B8B1A5]'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 원단 이름 */}
        <div className="space-y-1.5">
          <label
            htmlFor="fabric-name"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            원단 이름
          </label>
          <input
            id="fabric-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 프렌치 워싱 린넨 11수"
            className="min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>

        {/* 원단 종류 */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-[#4A453F]">
            원단 종류
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FABRIC_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[40px] cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#2B4157] text-white'
                      : 'border border-[#DFDBD2] bg-white text-[#524C46] hover:border-[#2B4157]/50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 색상 */}
        <div className="space-y-2">
          <label
            htmlFor="fabric-color-name"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            색상
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              aria-label="원단 색상 직접 선택"
              className="h-[46px] w-[52px] shrink-0 cursor-pointer rounded-xl border border-[#DFDBD2] bg-white p-1"
            />
            <input
              id="fabric-color-name"
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="색상명 (예: 딥 인디고)"
              className="min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {ATELIER_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setColorName(preset.name);
                  setColorHex(preset.hex);
                }}
                title={preset.name}
                aria-label={`${preset.name} 색상 선택`}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-transform active:scale-95 ${
                  colorHex.toLowerCase() === preset.hex.toLowerCase()
                    ? 'border-[#2B4157] ring-2 ring-[#2B4157]/30'
                    : 'border-black/15'
                }`}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
          </div>
        </div>

        {/* 보유 수량 & 구매 가격 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="fabric-qty"
              className="block text-xs font-semibold text-[#4A453F]"
            >
              보유 수량
            </label>
            <div className="flex overflow-hidden rounded-xl border border-[#DFDBD2] bg-white focus-within:border-[#2B4157]">
              <input
                id="fabric-qty"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="tabular-nums min-h-[46px] w-full px-3 text-sm text-[#262320] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setUnit((prev) => (prev === '마' ? 'm' : '마'))}
                className="min-h-[46px] shrink-0 cursor-pointer border-l border-[#E5E1D8] bg-[#FAF9F6] px-3 text-xs font-semibold text-[#2B4157]"
                title="단위 전환 (마 / m)"
              >
                {unit}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="fabric-price"
              className="block text-xs font-semibold text-[#4A453F]"
            >
              구매 가격 (원)
            </label>
            <input
              id="fabric-price"
              type="number"
              inputMode="numeric"
              min="0"
              step="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 35000"
              className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
            />
          </div>
        </div>

        {/* 원단 폭 (cm) */}
        <div className="space-y-1.5">
          <label
            htmlFor="fabric-width"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            원단 폭 (cm · 선택)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="fabric-width"
              type="number"
              inputMode="numeric"
              min="0"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              placeholder="예: 145"
              className="tabular-nums min-h-[44px] w-28 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
            {[
              { label: '소폭 110cm', value: '110' },
              { label: '대폭 145cm', value: '145' },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setWidthCm(preset.value)}
                className={`min-h-[40px] cursor-pointer rounded-xl px-3 text-xs font-medium ${
                  widthCm === preset.value
                    ? 'bg-[#2B4157] text-white'
                    : 'border border-[#DFDBD2] bg-white text-[#524C46]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 세탁 / 구매처 메모 */}
        <div className="space-y-1.5">
          <label
            htmlFor="fabric-note"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            메모 (선세탁 여부 · 구매처 등)
          </label>
          <input
            id="fabric-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 선세탁 완료, 동대문 종합시장 B동 구입"
            className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>
      </form>
    </ResponsiveSheet>
  );
}
