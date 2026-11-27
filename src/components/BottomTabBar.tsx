import { Calculator, ClipboardList, Home, Layers, Scale, Wrench } from 'lucide-react';
import { TabId } from '../types/atelier';

interface BottomTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

const TABS: Array<{ id: TabId; label: string; Icon: typeof Home }> = [
  { id: 'home', label: '홈', Icon: Home },
  { id: 'compare', label: '비교', Icon: Scale },
  { id: 'fabrics', label: '원단', Icon: Layers },
  { id: 'projects', label: '작업', Icon: ClipboardList },
  { id: 'toolbox', label: '도구', Icon: Wrench },
  { id: 'calculator', label: '원가', Icon: Calculator },
];

export function BottomTabBar({ activeTab, onSelectTab }: BottomTabBarProps) {
  return (
    <nav
      aria-label="하단 메뉴"
      className="pb-safe fixed right-0 bottom-0 left-0 z-40 border-t border-[#E5E1D8] bg-[#FAF9F6]/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-[60px] grid-cols-6 items-center px-1">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className={`flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[#2B4157] ${
                isActive
                  ? 'text-[#2B4157]'
                  : 'text-[#756E65] hover:text-[#262320]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="h-[20px] w-[20px]"
                strokeWidth={isActive ? 2.25 : 1.75}
                aria-hidden="true"
              />
              <span
                className={`text-[11px] leading-tight tracking-tight whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
