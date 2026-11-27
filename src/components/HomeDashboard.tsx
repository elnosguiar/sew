import { useRef, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock3,
  Download,
  Layers,
  Plus,
  Upload,
  Wrench,
} from 'lucide-react';
import { HERO_BANNER_IMAGE } from '../data/initialData';
import { FabricItem, ProjectItem, TabId } from '../types/atelier';
import {
  formatDateDot,
  formatKRW,
  formatQuantity,
  getCurrentYearMonth,
} from '../utils/formatters';
import { FabricThumbnail } from './FabricThumbnail';

interface HomeDashboardProps {
  fabrics: FabricItem[];
  projects: ProjectItem[];
  onNavigate: (tab: TabId) => void;
  onQuickAddFabric: () => void;
  onQuickAddProject: () => void;
  onAdvanceProjectStatus: (projectId: string) => void;
  onSelectProject: (project: ProjectItem) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<{ ok: boolean; message: string }>;
}

export function HomeDashboard({
  fabrics,
  projects,
  onNavigate,
  onQuickAddFabric,
  onQuickAddProject,
  onAdvanceProjectStatus,
  onSelectProject,
  onExportBackup,
  onImportBackup,
}: HomeDashboardProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const currentYM = getCurrentYearMonth();
  const [year, month] = currentYM.split('-');

  const registeredFabricCount = fabrics.length;
  const activeProjects = projects.filter((p) => p.status !== '제작 완료');
  const activeProjectCount = activeProjects.length;

  const completedThisMonthCount = projects.filter((p) => {
    if (p.status !== '제작 완료') return false;
    const dateRef = p.completedDate || p.startDate;
    return dateRef.startsWith(currentYM);
  }).length;

  const totalFabricQuantity = fabrics.reduce((acc, item) => acc + item.quantity, 0);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImportBackup(file);
    setBackupFeedback(result);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Studio Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E5E1D8] bg-[#2D2926]">
        <div className="relative aspect-[16/9] max-h-[260px] w-full sm:max-h-[300px] md:max-h-[320px]">
          {!heroImgFailed ? (
            <img
              src={HERO_BANNER_IMAGE}
              alt="햇살이 드는 따뜻한 홈 미싱 공방 작업대"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#3B3631] via-[#2D2926] to-[#233240]" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-3 p-5 sm:flex-row sm:items-end sm:justify-between md:p-7">
            <div className="max-w-lg space-y-1">
              <p className="text-xs font-medium text-white/80">
                {year}년 {Number(month)}월 · 홈 아틀리에 현황
              </p>
              <h1 className="font-atelier-serif text-xl font-bold text-balance text-white sm:text-2xl md:text-3xl">
                차근차근 완성되는 오늘의 바느질
              </h1>
            </div>
            <button
              type="button"
              onClick={onQuickAddProject}
              className="inline-flex min-h-[44px] w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#262320] transition-transform hover:bg-[#FAF9F6] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Plus className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
              <span>새 작업 시작하기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Core Summary Metrics */}
      <section aria-label="공방 요약 지표">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('fabrics')}
            className="group flex min-h-[104px] cursor-pointer flex-col justify-between rounded-2xl border border-[#E5E1D8] bg-white p-3.5 text-left transition-colors hover:border-[#2B4157]/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:p-5"
          >
            <span className="text-xs font-medium text-[#6B655D] sm:text-sm">
              등록된 원단
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1">
              <span className="tabular-nums text-2xl font-bold tracking-tight text-[#262320] sm:text-3xl">
                {registeredFabricCount}
                <span className="ml-0.5 text-sm font-medium text-[#6B655D]">종</span>
              </span>
              <ArrowRight
                className="hidden h-4 w-4 text-[#9C9488] transition-transform group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </div>
            <span className="mt-1 truncate text-[11px] text-[#7A736A] tabular-nums sm:text-xs">
              총 {formatQuantity(totalFabricQuantity)}마/m 보유
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="group flex min-h-[104px] cursor-pointer flex-col justify-between rounded-2xl border border-[#E5E1D8] bg-white p-3.5 text-left transition-colors hover:border-[#2B4157]/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:p-5"
          >
            <span className="text-xs font-medium text-[#6B655D] sm:text-sm">
              진행 중 작업
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1">
              <span className="tabular-nums text-2xl font-bold tracking-tight text-[#2B4157] sm:text-3xl">
                {activeProjectCount}
                <span className="ml-0.5 text-sm font-medium text-[#6B655D]">건</span>
              </span>
              <ArrowRight
                className="hidden h-4 w-4 text-[#9C9488] transition-transform group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </div>
            <span className="mt-1 truncate text-[11px] text-[#7A736A] sm:text-xs">
              미싱 대기 및 제작
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="group flex min-h-[104px] cursor-pointer flex-col justify-between rounded-2xl border border-[#E5E1D8] bg-white p-3.5 text-left transition-colors hover:border-[#3D5A47]/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:p-5"
          >
            <span className="text-xs font-medium text-[#6B655D] sm:text-sm">
              이번 달 완료
            </span>
            <div className="mt-2 flex items-baseline justify-between gap-1">
              <span className="tabular-nums text-2xl font-bold tracking-tight text-[#3D5A47] sm:text-3xl">
                {completedThisMonthCount}
                <span className="ml-0.5 text-sm font-medium text-[#6B655D]">작품</span>
              </span>
              <ArrowRight
                className="hidden h-4 w-4 text-[#9C9488] transition-transform group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </div>
            <span className="mt-1 truncate text-[11px] text-[#7A736A] sm:text-xs">
              {Number(month)}월 누적 기록
            </span>
          </button>
        </div>
      </section>

      {/* Two-Column Content Section on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Sewing Projects */}
        <section className="rounded-3xl border border-[#E5E1D8] bg-white p-5 md:p-6">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-[#262320] md:text-lg">
              진행 중인 작업
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 px-2 text-xs font-medium text-[#2B4157] hover:underline focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:text-sm"
            >
              <span>전체 보기</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {activeProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-t border-[#F0EDE6] py-10 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-[#3D5A47]" aria-hidden="true" />
              <p className="text-sm font-medium text-[#262320]">
                진행 중인 작업이 모두 완료되었어요
              </p>
              <p className="mt-1 text-xs text-[#6B655D]">
                새로운 미싱 프로젝트를 기록해 보세요.
              </p>
              <button
                type="button"
                onClick={onQuickAddProject}
                className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 py-2 text-xs font-medium text-white hover:bg-[#213345]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>작업 추가하기</span>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0EDE6] border-t border-[#F0EDE6]">
              {activeProjects.slice(0, 4).map((project) => {
                const checklist = project.checklist ?? [];
                const doneCount = checklist.filter((c) => c.done).length;
                return (
                  <li key={project.id} className="py-3.5 first:pt-4 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        <p className="truncate text-sm font-semibold text-[#262320] md:text-base">
                          {project.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6B655D]">
                          <span className="inline-flex items-center gap-1 font-medium text-[#2B4157]">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {project.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            시작 {formatDateDot(project.startDate)}
                          </span>
                          {checklist.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                단계 {doneCount}/{checklist.length}
                              </span>
                            </>
                          )}
                        </div>
                        {project.memo && (
                          <p className="mt-1.5 line-clamp-1 text-xs text-[#7A736A]">
                            {project.memo}
                          </p>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onAdvanceProjectStatus(project.id)}
                        className="min-h-[44px] shrink-0 cursor-pointer rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3 text-xs font-medium text-[#262320] transition-colors hover:border-[#2B4157] hover:bg-[#2B4157] hover:text-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                      >
                        {project.status === '마무리' ? '완료 표시' : '다음 단계'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent Fabrics Overview */}
        <section className="rounded-3xl border border-[#E5E1D8] bg-white p-5 md:p-6">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-[#262320] md:text-lg">
              최근 등록 원단
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('fabrics')}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 px-2 text-xs font-medium text-[#2B4157] hover:underline focus-visible:outline-2 focus-visible:outline-[#2B4157] sm:text-sm"
            >
              <span>원단함 보기</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {fabrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-t border-[#F0EDE6] py-10 text-center">
              <Layers className="mb-2 h-8 w-8 text-[#7A736A]" aria-hidden="true" />
              <p className="text-sm font-medium text-[#262320]">
                아직 등록된 원단이 없습니다
              </p>
              <button
                type="button"
                onClick={onQuickAddFabric}
                className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl bg-[#2B4157] px-4 py-2 text-xs font-medium text-white"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>첫 원단 등록하기</span>
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0EDE6] border-t border-[#F0EDE6]">
              {fabrics.slice(0, 4).map((fabric) => (
                <li key={fabric.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate('fabrics')}
                    className="flex min-h-[68px] w-full cursor-pointer items-center gap-3.5 py-3 text-left transition-colors hover:bg-[#FAF9F6] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
                  >
                    <FabricThumbnail
                      imageUrl={fabric.imageUrl}
                      colorHex={fabric.colorHex}
                      name={fabric.name}
                      className="h-12 w-14 shrink-0 rounded-xl border border-[#E5E1D8]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#262320]">
                        {fabric.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B655D]">
                        <span>{fabric.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: fabric.colorHex }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{fabric.colorName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular-nums text-sm font-semibold text-[#262320]">
                        {formatQuantity(fabric.quantity)}
                        <span className="ml-0.5 text-xs font-normal text-[#6B655D]">
                          {fabric.unit}
                        </span>
                      </p>
                      <p className="tabular-nums text-xs text-[#7A736A]">
                        {formatKRW(fabric.price)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* One-Handed Quick Action Shortcuts (Thumb Zone) */}
      <section aria-label="빠른 실행" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={onQuickAddFabric}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DFDBD2] bg-white px-4 py-3 text-sm font-medium text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Layers className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
          <span className="whitespace-nowrap">원단 등록</span>
        </button>

        <button
          type="button"
          onClick={onQuickAddProject}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DFDBD2] bg-white px-4 py-3 text-sm font-medium text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Plus className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
          <span className="whitespace-nowrap">작업 추가</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('toolbox')}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DFDBD2] bg-white px-4 py-3 text-sm font-medium text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Wrench className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
          <span className="whitespace-nowrap">바늘·재단 도구</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('calculator')}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DFDBD2] bg-white px-4 py-3 text-sm font-medium text-[#262320] transition-colors hover:border-[#2B4157] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
        >
          <Calculator className="h-4 w-4 text-[#2B4157]" aria-hidden="true" />
          <span className="whitespace-nowrap">원가 계산기</span>
        </button>
      </section>

      {/* Quiet Data Backup & Restore Utility */}
      <section
        aria-label="공방 데이터 백업 및 복원"
        className="flex flex-col justify-between gap-3 rounded-3xl border border-[#E5E1D8] bg-white px-5 py-4 sm:flex-row sm:items-center"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#262320]">
            기록 백업 · 다른 기기로 옮기기
          </h2>
          <p className="mt-0.5 text-xs text-[#6B655D]">
            모든 원단·작업·원가 기록은 이 기기 브라우저에 자동 저장되며 JSON 파일로 백업할 수 있습니다.
          </p>
          {backupFeedback && (
            <p
              className={`mt-1.5 text-xs font-medium ${
                backupFeedback.ok ? 'text-[#3D5A47]' : 'text-[#A8383B]'
              }`}
            >
              {backupFeedback.message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-[#FAF9F6] px-3.5 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
          >
            <Download className="h-3.5 w-3.5 text-[#2B4157]" aria-hidden="true" />
            <span className="whitespace-nowrap">백업 저장</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#DFDBD2] bg-white px-3.5 text-xs font-medium text-[#262320] hover:border-[#2B4157]"
          >
            <Upload className="h-3.5 w-3.5 text-[#2B4157]" aria-hidden="true" />
            <span className="whitespace-nowrap">백업 불러오기</span>
          </button>
        </div>
      </section>
    </div>
  );
}
