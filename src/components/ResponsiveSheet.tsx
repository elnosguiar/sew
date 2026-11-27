import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ResponsiveSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: ResponsiveSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px] md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#E5E1D8] bg-[#FAF9F6] shadow-2xl md:max-h-[85dvh] md:max-w-lg md:rounded-3xl">
        <div className="flex flex-col items-center pt-2.5 md:hidden" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-[#D6D0C4]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#E5E1D8] px-5 py-3.5 md:px-6 md:py-4">
          <h2 className="text-base font-semibold text-[#262320] md:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-[#6B655D] transition-colors hover:bg-[#EFECE5] hover:text-[#262320] focus-visible:outline-2 focus-visible:outline-[#2B4157]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {children}
        </div>

        {footer && (
          <div className="pb-safe border-t border-[#E5E1D8] bg-[#FAF9F6] px-5 py-3.5 md:px-6 md:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
