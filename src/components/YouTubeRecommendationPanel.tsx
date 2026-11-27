import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Play, RotateCcw, Search, Youtube } from 'lucide-react';
import { YouTubeSearchResponse, YouTubeVideoItem } from '../types/atelier';

interface YouTubeRecommendationPanelProps {
  defaultQuery: string;
  heading?: string;
  subtitle?: string;
  showSearchInput?: boolean;
  maxItems?: number;
  autoFetch?: boolean;
}

export function YouTubeRecommendationPanel({
  defaultQuery,
  heading = '유튜브 만들기 영상 자동 추천',
  subtitle = '선택한 소품 또는 원하는 작품 이름을 입력하면 따라 만들기 좋은 재봉틀 영상을 자동으로 추천해 드립니다.',
  showSearchInput = true,
  maxItems = 6,
  autoFetch = true,
}: YouTubeRecommendationPanelProps) {
  const [queryInput, setQueryInput] = useState(defaultQuery);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [searchUrl, setSearchUrl] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const fetchVideos = useCallback(async (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;

    setStatus('loading');
    setErrorMsg('');
    setActiveQuery(trimmed);

    try {
      const res = await fetch('/api/sewing-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await res.json()) as YouTubeSearchResponse & { error?: string };
      if (!res.ok) {
        setStatus('error');
        setSearchUrl(
          data.searchUrl ||
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `재봉틀 ${trimmed} 만들기`
            )}`
        );
        setErrorMsg(data.error || '유튜브 영상을 불러오지 못했습니다.');
        return;
      }

      setVideos(data.videos ?? []);
      setSearchUrl(data.searchUrl);
      setStatus('success');
    } catch {
      setStatus('error');
      setSearchUrl(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `재봉틀 ${trimmed} 만들기`
        )}`
      );
      setErrorMsg('네트워크 오류로 추천 영상을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    setQueryInput(defaultQuery);
    if (autoFetch && defaultQuery.trim()) {
      fetchVideos(defaultQuery);
    }
  }, [defaultQuery, autoFetch, fetchVideos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-[#262320]">
            <Youtube className="h-4 w-4 text-[#A8383B]" aria-hidden="true" />
            <span>{heading}</span>
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#6B655D]">{subtitle}</p>
          )}
        </div>

        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#DFDBD2] bg-white px-3 text-xs font-medium text-[#2B4157] hover:border-[#2B4157]"
          >
            <span>유튜브에서 더 보기</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {showSearchInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchVideos(queryInput);
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
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="예: 텀블러 가방, 카드지갑, 린넨 원피스, 기저귀 파우치"
              aria-label="유튜브 만들기 영상 검색"
              className="min-h-[44px] w-full rounded-2xl border border-[#DFDBD2] bg-[#FAF9F6] pr-4 pl-10 text-sm text-[#262320] placeholder:text-[#9C9488] focus:border-[#2B4157] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || !queryInput.trim()}
            className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#2B4157] px-4 text-xs font-semibold text-white hover:bg-[#213345] disabled:opacity-50 sm:text-sm"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="whitespace-nowrap">영상 추천받기</span>
          </button>
        </form>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#E5E1D8] bg-[#FAF9F6] p-4 text-xs text-[#524C46] sm:text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2B4157]" aria-hidden="true" />
          <span>&ldquo;{activeQuery}&rdquo; 관련 재봉틀 만들기 영상을 찾고 있습니다...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7C2C3] bg-[#FDF2F2] p-4">
          <p className="text-xs font-medium text-[#A8383B]">{errorMsg}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchVideos(activeQuery || queryInput)}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1 rounded-xl border border-[#E7C2C3] bg-white px-3 text-xs font-semibold text-[#A8383B]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>다시 시도</span>
            </button>
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-[#2B4157] px-3 text-xs font-semibold text-white"
              >
                <span>유튜브 직접 열기</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}

      {status === 'success' && videos.length === 0 && (
        <div className="rounded-2xl border border-[#E5E1D8] bg-[#FAF9F6] p-4 text-center text-xs text-[#6B655D]">
          바로 일치하는 영상을 찾지 못했습니다. 위 &ldquo;유튜브에서 더 보기&rdquo; 버튼을 눌러 확인해 보세요.
        </div>
      )}

      {status === 'success' && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {videos.slice(0, maxItems).map((video) => (
            <a
              key={video.videoId}
              href={video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white transition-colors hover:border-[#2B4157]/50"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EFECE5]">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
                  <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>{video.lengthText || '영상 보기'}</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-3.5">
                <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#262320] group-hover:text-[#2B4157] sm:text-sm">
                  {video.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-[#6B655D]">
                  <span className="truncate font-medium text-[#4A453F]">{video.channel}</span>
                  {video.viewCountText && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{video.viewCountText}</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
