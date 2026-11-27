import { Plus } from 'lucide-react';
import { TabId } from '../types/atelier';

interface AtelierHeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onPrimaryAction: () => void;
}

const NAV_ITEMS: Array<{ id: TabId; label: string }> = [
  { id: 'home', label: '홈' },
  { id: 'fabrics', label: '원단 관리' },
  { id: 'projects', label: '작업 관리' },
  { id: 'toolbox', label: '미싱 도구' },
  { id: 'calculator', label: '원가 계산' },
];

export function AtelierHeader({
  activeTab,
  onSelectTab,
  onPrimaryAction,
}: AtelierHeaderProps) {
  const actionLabel = activeTab === 'fabrics' ? '원단 등록' : '새 작업';

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E1D8] bg-[#FAF9F6]/92 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-8 px-4 md:h-16 md:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="font-atelier-serif shrink-0 cursor-pointer whitespace-nowrap text-lg font-bold tracking-tight text-[#262320] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2B4157] md:text-xl"
        >
          우리집 미싱실
        </button>

        <nav className="hidden items-center gap-6 md:flex lg:gap-7" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2B4157] ${
                  isActive
                    ? 'text-[#2B4157]'
                    : 'text-[#6B655D] hover:text-[#262320]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#2B4157]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#2B4157] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#213345] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B4157] md:min-h-[40px] md:px-4 md:text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
