import { useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock3,
  PackageMinus,
  Pencil,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  createChecklistFromTemplate,
  PROJECT_STATUSES,
  PROJECT_TEMPLATES,
  ProjectTemplate,
} from '../data/initialData';
import {
  FabricItem,
  ProjectChecklistItem,
  ProjectItem,
  ProjectStatus,
} from '../types/atelier';
import {
  compressImageFile,
  formatDateDot,
  formatQuantity,
  getTodayISO,
} from '../utils/formatters';
import { ResponsiveSheet } from './ResponsiveSheet';
import { YouTubeRecommendationPanel } from './YouTubeRecommendationPanel';

export interface ProjectDraftPreset {
  title?: string;
  machineSpec?: string;
  memo?: string;
  steps?: string[];
}

interface ProjectManagerProps {
  projects: ProjectItem[];
  fabrics: FabricItem[];
  isSheetOpen: boolean;
  editingProject: ProjectItem | null;
  draftPreset: ProjectDraftPreset | null;
  onOpenCreate: () => void;
  onOpenEdit: (project: ProjectItem) => void;
  onCloseSheet: () => void;
  onSaveProject: (
    data: Omit<ProjectItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
  onDeleteProject: (id: string) => void;
  onAdvanceStatus: (id: string) => void;
  onToggleChecklistItem: (projectId: string, itemId: string) => void;
  onDeductProjectFabric: (projectId: string) => void;
}

type StatusFilter = '전체' | '진행 중' | '제작 완료';

function renderStatusLabel(status: ProjectStatus) {
  switch (status) {
    case '준비 중':
      return {
        icon: Clock3,
        colorClass: 'text-[#7A5C43]',
        nextLabel: '작업 시작',
      };
    case '작업 중':
      return {
        icon: Scissors,
        colorClass: 'text-[#2B4157]',
        nextLabel: '마무리로',
      };
    case '마무리':
      return {
        icon: Sparkles,
        colorClass: 'text-[#8C6239]',
        nextLabel: '제작 완료',
      };
    case '제작 완료':
      return {
        icon: CheckCircle2,
        colorClass: 'text-[#3D5A47]',
        nextLabel: '다시 진행',
      };
  }
}

export function ProjectManager({
  projects,
  fabrics,
  isSheetOpen,
  editingProject,
  draftPreset,
  onOpenCreate,
  onOpenEdit,
  onCloseSheet,
  onSaveProject,
  onDeleteProject,
  onAdvanceStatus,
  onToggleChecklistItem,
  onDeductProjectFabric,
}: ProjectManagerProps) {
  const [filter, setFilter] = useState<StatusFilter>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fabricMap = useMemo(() => {
    const map = new Map<string, FabricItem>();
    fabrics.forEach((f) => map.set(f.id, f));
    return map;
  }, [fabrics]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesFilter =
        filter === '전체'
          ? true
          : filter === '진행 중'
            ? p.status !== '제작 완료'
            : p.status === '제작 완료';

      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.memo.toLowerCase().includes(q) ||
        (p.machineSpec ?? '').toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [projects, filter, searchQuery]);

  const activeCount = projects.filter((p) => p.status !== '제작 완료').length;
  const completedCount = projects.filter((p) => p.status === '제작 완료').length;

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-atelier-serif text-2xl font-bold text-[#262320]">
            작업 관리
          </h1>
          <p className="mt-1 text-xs text-[#6B655D] tabular-nums sm:text-sm">
            진행 중 {activeCount}건 · 완료 {completedCount}건
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#213345] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="whitespace-nowrap">새 작업</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="grid grid-cols-3 gap-1 rounded-2xl border border-[#E5E1D8] bg-[#F3F1EC] p-1 sm:w-auto sm:min-w-[280px]"
          role="tablist"
          aria-label="작업 상태 필터"
        >
          {(['전체', '진행 중', '제작 완료'] as StatusFilter[]).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab)}
                className={`min-h-[40px] cursor-pointer rounded-xl px-3 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
                  active
                    ? 'bg-white text-[#262320] shadow-xs'
                    : 'text-[#6B655D] hover:text-[#262320]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A736A]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="작업명, 바늘 스펙, 메모 검색..."
            aria-label="작업 검색"
            className="min-h-[44px] w-full rounded-2xl border border-[#DFDBD2] bg-white pr-4 pl-10 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-[#E5E1D8] bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-[#262320]">
            표시할 작업 기록이 없습니다
          </p>
          <p className="mt-1 text-sm text-[#6B655D]">
            만들고 싶은 작품이나 진행 중인 미싱 작업을 추가해 보세요.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#213345]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>새 작업 기록하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const statusMeta = renderStatusLabel(project.status);
            const StatusIcon = statusMeta.icon;
            const linkedFabric = project.fabricId
              ? fabricMap.get(project.fabricId)
              : undefined;
            const confirmingDelete = deleteConfirmId === project.id;
            const checklist = project.checklist ?? [];
            const doneCount = checklist.filter((c) => c.done).length;
            const canDeductFabric =
              Boolean(linkedFabric) &&
              Boolean(project.usedFabricAmount && project.usedFabricAmount > 0) &&
              !project.fabricDeducted;

            return (
              <article
                key={project.id}
                className="flex flex-col justify-between rounded-3xl border border-[#E5E1D8] bg-white p-5"
              >
                <div>
                  {project.completedImageUrl && (
                    <div className="mb-3.5 overflow-hidden rounded-2xl border border-[#E5E1D8] bg-[#FAF9F6]">
                      <img
                        src={project.completedImageUrl}
                        alt={`${project.title} 완성 사진`}
                        referrerPolicy="no-referrer"
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-[#262320] sm:text-lg">
                      {project.title}
                    </h2>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap ${statusMeta.colorClass}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{project.status}</span>
                    </span>
                  </div>

                  {/* Unboxed Metadata Line */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B655D]">
                    <span className="tabular-nums">
                      시작일 {formatDateDot(project.startDate)}
                    </span>
                    {project.status === '제작 완료' && project.completedDate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums text-[#3D5A47]">
                          완료일 {formatDateDot(project.completedDate)}
                        </span>
                      </>
                    )}
                    {linkedFabric && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          원단: {linkedFabric.name}
                          {project.usedFabricAmount
                            ? ` (${formatQuantity(project.usedFabricAmount)}${linkedFabric.unit})`
                            : ''}
                        </span>
                      </>
                    )}
                  </div>

                  {project.machineSpec && (
                    <p className="mt-1.5 text-xs font-medium text-[#2B4157]">
                      세팅: {project.machineSpec}
                    </p>
                  )}

                  {/* Interactive Process Checklist */}
                  {checklist.length > 0 && (
                    <div className="mt-3 border-t border-[#F0EDE6] pt-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-[#6B655D]">
                        <span className="font-semibold text-[#4A453F]">작업 순서 체크</span>
                        <span className="tabular-nums">
                          {doneCount}/{checklist.length} 완료
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {checklist.map((step) => (
                          <li key={step.id}>
                            <button
                              type="button"
                              onClick={() => onToggleChecklistItem(project.id, step.id)}
                              className="flex min-h-[36px] w-full cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-[#FAF9F6]"
                            >
                              {step.done ? (
                                <CheckSquare
                                  className="h-4 w-4 shrink-0 text-[#3D5A47]"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Square
                                  className="h-4 w-4 shrink-0 text-[#9C9488]"
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={`text-xs sm:text-sm ${
                                  step.done
                                    ? 'text-[#7A736A] line-through'
                                    : 'text-[#262320]'
                                }`}
                              >
                                {step.text}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Memo */}
                  {project.memo ? (
                    <p className="mt-3 rounded-2xl bg-[#FAF9F6] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-[#4A453F]">
                      {project.memo}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-[#9C9488]">
                      등록된 작업 메모가 없습니다.
                    </p>
                  )}

                  {/* Linked Fabric Deduction Action */}
                  {linkedFabric && project.usedFabricAmount ? (
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      {canDeductFabric ? (
                        <button
                          type="button"
                          onClick={() => onDeductProjectFabric(project.id)}
                          className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 font-medium text-[#2B4157] hover:border-[#2B4157]"
                        >
                          <PackageMinus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="tabular-nums">
                            원단함에서 {formatQuantity(project.usedFabricAmount)}
                            {linkedFabric.unit} 차감하기
                          </span>
                        </button>
                      ) : project.fabricDeducted ? (
                        <span className="inline-flex items-center gap-1 text-[#3D5A47]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="tabular-nums">
                            원단함 재고 {formatQuantity(project.usedFabricAmount)}
                            {linkedFabric.unit} 차감 완료
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* One-Handed Actions Row */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#F0EDE6] pt-3.5">
                  <button
                    type="button"
                    onClick={() => onAdvanceStatus(project.id)}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157] ${
                      project.status === '제작 완료'
                        ? 'border border-[#DFDBD2] bg-[#FAF9F6] text-[#524C46] hover:bg-[#F3F1EC]'
                        : 'bg-[#2B4157] text-white hover:bg-[#213345]'
                    }`}
                  >
                    <span>{statusMeta.nextLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  {confirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProject(project.id);
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
                        onClick={() => onOpenEdit(project)}
                        aria-label={`${project.title} 수정`}
                        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#F3F1EC] hover:text-[#262320] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(project.id)}
                        aria-label={`${project.title} 삭제`}
                        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-[#6B655D] transition-colors hover:bg-[#FDF2F2] hover:text-[#A8383B] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ProjectFormSheet
        key={
          editingProject
            ? editingProject.id
            : isSheetOpen
              ? `new-${draftPreset?.machineSpec ?? 'blank'}`
              : 'closed'
        }
        open={isSheetOpen}
        editingProject={editingProject}
        draftPreset={draftPreset}
        fabrics={fabrics}
        onClose={onCloseSheet}
        onSave={onSaveProject}
      />
    </div>
  );
}

interface ProjectFormSheetProps {
  open: boolean;
  editingProject: ProjectItem | null;
  draftPreset: ProjectDraftPreset | null;
  fabrics: FabricItem[];
  onClose: () => void;
  onSave: (data: Omit<ProjectItem, 'id' | 'createdAt'>, existingId?: string) => void;
}

function ProjectFormSheet({
  open,
  editingProject,
  draftPreset,
  fabrics,
  onClose,
  onSave,
}: ProjectFormSheetProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(
    editingProject?.title ?? draftPreset?.title ?? ''
  );
  const [startDate, setStartDate] = useState(
    editingProject?.startDate ?? getTodayISO()
  );
  const [status, setStatus] = useState<ProjectStatus>(
    editingProject?.status ?? '작업 중'
  );
  const [completedDate, setCompletedDate] = useState(
    editingProject?.completedDate ?? getTodayISO()
  );
  const [fabricId, setFabricId] = useState(editingProject?.fabricId ?? '');
  const [usedFabricAmount, setUsedFabricAmount] = useState(
    editingProject?.usedFabricAmount ? String(editingProject.usedFabricAmount) : ''
  );
  const [machineSpec, setMachineSpec] = useState(
    editingProject?.machineSpec ?? draftPreset?.machineSpec ?? ''
  );
  const [memo, setMemo] = useState(
    editingProject?.memo ?? draftPreset?.memo ?? ''
  );
  const [checklist, setChecklist] = useState<ProjectChecklistItem[]>(
    editingProject?.checklist ??
      createChecklistFromTemplate(draftPreset?.steps)
  );
  const [newStepText, setNewStepText] = useState('');
  const [completedImageUrl, setCompletedImageUrl] = useState<string | null>(
    editingProject?.completedImageUrl ?? null
  );
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [showYoutubeHelper, setShowYoutubeHelper] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedFabric = fabrics.find((f) => f.id === fabricId);

  const handleApplyTemplate = (tpl: ProjectTemplate) => {
    if (!title.trim()) setTitle(tpl.title);
    setMachineSpec(tpl.machineSpec);
    setMemo(tpl.memo);
    setChecklist(createChecklistFromTemplate(tpl.steps));
  };

  const handleAddChecklistStep = () => {
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    setChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}`, text: trimmed, done: false },
    ]);
    setNewStepText('');
  };

  const handleRemoveChecklistStep = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImg(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file);
      setCompletedImageUrl(compressed);
    } catch {
      setErrorMsg('사진을 불러오지 못했습니다.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMsg('작업명을 입력해 주세요.');
      return;
    }

    const parsedUsed = Number(usedFabricAmount);

    onSave(
      {
        title: trimmed,
        startDate: startDate || getTodayISO(),
        status,
        completedDate:
          status === '제작 완료' ? completedDate || getTodayISO() : undefined,
        fabricId: fabricId || undefined,
        usedFabricAmount: fabricId && parsedUsed > 0 ? parsedUsed : undefined,
        fabricDeducted: editingProject?.fabricDeducted ?? false,
        machineSpec: machineSpec.trim() || undefined,
        checklist: checklist.length > 0 ? checklist : undefined,
        completedImageUrl,
        memo: memo.trim(),
      },
      editingProject?.id
    );
    onClose();
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={editingProject ? '작업 기록 수정' : '새 작업 등록'}
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
            form="project-form"
            className="min-h-[48px] flex-[2] cursor-pointer rounded-xl bg-[#2B4157] text-sm font-semibold text-white hover:bg-[#213345] active:scale-[0.98]"
          >
            {editingProject ? '수정 저장' : '작업 저장'}
          </button>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <p className="rounded-xl border border-[#E7C2C3] bg-[#FDF2F2] px-3.5 py-2.5 text-xs font-medium text-[#A8383B]">
            {errorMsg}
          </p>
        )}

        {/* Quick Templates when creating new */}
        {!editingProject && (
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[#4A453F]">
              자주 만드는 소품 빠른 채우기
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="min-h-[36px] cursor-pointer rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#2B4157] hover:border-[#2B4157]"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 작업명 */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-title"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            작업명
          </label>
          <input
            id="project-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 린넨 랩 앞치마, 데일리 에코백"
            className="min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>

        {/* 진행 상태 */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-[#4A453F]">
            진행 상태
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PROJECT_STATUSES.map((s) => {
              const selected = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`min-h-[44px] cursor-pointer rounded-xl px-3 text-xs font-semibold transition-colors sm:text-sm ${
                    selected
                      ? s === '제작 완료'
                        ? 'bg-[#3D5A47] text-white'
                        : 'bg-[#2B4157] text-white'
                      : 'border border-[#DFDBD2] bg-white text-[#524C46] hover:border-[#2B4157]/50'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* 제작 시작일 (및 완료일) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="project-start-date"
              className="block text-xs font-semibold text-[#4A453F]"
            >
              제작 시작일
            </label>
            <input
              id="project-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
            />
          </div>

          {status === '제작 완료' && (
            <div className="space-y-1.5">
              <label
                htmlFor="project-completed-date"
                className="block text-xs font-semibold text-[#3D5A47]"
              >
                제작 완료일
              </label>
              <input
                id="project-completed-date"
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#C9D6CD] bg-white px-3.5 text-sm text-[#262320] focus:border-[#3D5A47] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 사용 원단 & 사용량 선택 */}
        {fabrics.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="project-fabric"
                className="block text-xs font-semibold text-[#4A453F]"
              >
                사용 원단 (선택)
              </label>
              <select
                id="project-fabric"
                value={fabricId}
                onChange={(e) => setFabricId(e.target.value)}
                className="min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
              >
                <option value="">선택 안 함</option>
                {fabrics.map((fab) => (
                  <option key={fab.id} value={fab.id}>
                    {fab.name} ({fab.colorName} · {formatQuantity(fab.quantity)}
                    {fab.unit})
                  </option>
                ))}
              </select>
            </div>

            {fabricId && (
              <div className="space-y-1.5">
                <label
                  htmlFor="project-used-amount"
                  className="block text-xs font-semibold text-[#4A453F]"
                >
                  사용량 ({selectedFabric?.unit ?? '마'})
                </label>
                <input
                  id="project-used-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={usedFabricAmount}
                  onChange={(e) => setUsedFabricAmount(e.target.value)}
                  placeholder="예: 1.5"
                  className="tabular-nums min-h-[46px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3 text-sm text-[#262320] focus:border-[#2B4157] focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* 미싱 바늘 · 실 · 땀수 세팅 */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-machine-spec"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            바늘 · 실 · 땀수 메모 (선택)
          </label>
          <input
            id="project-machine-spec"
            type="text"
            value={machineSpec}
            onChange={(e) => setMachineSpec(e.target.value)}
            placeholder="예: 11호 바늘 · 코아사 60수 · 땀수 2.8mm"
            className="min-h-[44px] w-full rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>

        {/* 공정 체크리스트 편집 */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#4A453F]">
            작업 순서 체크리스트
          </span>
          <div className="space-y-1.5">
            {checklist.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E1D8] bg-white px-3 py-2 text-xs text-[#262320]"
              >
                <span className="truncate">{step.text}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveChecklistStep(step.id)}
                  aria-label={`${step.text} 단계 삭제`}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#7A736A] hover:bg-[#FDF2F2] hover:text-[#A8383B]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChecklistStep();
                }
              }}
              placeholder="공정 단계 추가 (예: 단추 구멍 뚫기)"
              className="min-h-[40px] flex-1 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddChecklistStep}
              className="min-h-[40px] shrink-0 cursor-pointer rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
            >
              추가
            </button>
          </div>
        </div>

        {/* 완성 사진 첨부 (선택) */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#4A453F]">
            작품 사진 (선택)
          </span>
          <div className="flex items-center gap-3">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessingImg}
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
            >
              <Camera className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
              <span>{isProcessingImg ? '불러오는 중...' : '완성 사진 첨부'}</span>
            </button>
            {completedImageUrl && (
              <button
                type="button"
                onClick={() => setCompletedImageUrl(null)}
                className="min-h-[42px] cursor-pointer px-2 text-xs font-medium text-[#6B655D] hover:text-[#A8383B]"
              >
                사진 지우기
              </button>
            )}
          </div>
          {completedImageUrl && (
            <img
              src={completedImageUrl}
              alt="완성 작품 미리보기"
              className="mt-2 aspect-[16/10] w-full rounded-2xl border border-[#E5E1D8] object-cover"
            />
          )}
        </div>

        {/* 메모 */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-memo"
            className="block text-xs font-semibold text-[#4A453F]"
          >
            메모
          </label>
          <textarea
            id="project-memo"
            rows={4}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="시접 여유, 패턴 사이즈, 수정할 점 등을 자유롭게 적어두세요."
            className="w-full rounded-xl border border-[#DFDBD2] bg-white p-3.5 text-sm leading-relaxed text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:outline-none"
          />
        </div>

        {/* 이 작업 관련 유튜브 만들기 영상 자동 추천 */}
        <div className="space-y-3 border-t border-[#E5E1D8] pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#4A453F]">
              만들기 참고 유튜브 영상
            </span>
            <button
              type="button"
              onClick={() => setShowYoutubeHelper((v) => !v)}
              className="min-h-[36px] cursor-pointer rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#2B4157] hover:border-[#2B4157]"
            >
              {showYoutubeHelper ? '추천 영상 접기' : '이 작품 유튜브 영상 추천'}
            </button>
          </div>
          {showYoutubeHelper && (
            <YouTubeRecommendationPanel
              defaultQuery={title.trim() || '에코백'}
              heading="유튜브 참고 영상"
              subtitle=""
              showSearchInput={true}
              maxItems={4}
              autoFetch={true}
            />
          )}
        </div>
      </form>
    </ResponsiveSheet>
  );
}
