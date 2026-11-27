import { useState } from 'react';
import { Scissors } from 'lucide-react';

interface FabricThumbnailProps {
  imageUrl: string | null;
  colorHex: string;
  name: string;
  className?: string;
}

export function FabricThumbnail({
  imageUrl,
  colorHex,
  name,
  className = '',
}: FabricThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <div className={`relative overflow-hidden bg-[#EFECE5] ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: colorHex || '#D6CBB8',
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 2px, transparent 2px, transparent 6px)',
      }}
      aria-label={`${name} 원단 스와치`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#262320] shadow-xs backdrop-blur-xs">
        <Scissors className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}
