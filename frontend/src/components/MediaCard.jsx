import { useState } from "react";
import { Film, Play, Star } from "lucide-react";

export function MediaCard({
  item,
  onPlay,
  isBookmarked,
  onToggleBookmark,
  progressPct,
  progressLabel,
  fluid = false,
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const bookmarked = isBookmarked?.(item) || false;

  return (
    <div
      className={`group/card relative flex-none snap-start ${fluid ? "w-full" : "w-[128px] sm:w-[150px] md:w-[168px]"}`}
      data-testid="media-card"
    >
      <div
        data-testid={`card-${item.type}-${item.id}`}
        onClick={() => onPlay?.(item)}
        className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded-md border border-white/[0.07] bg-[#0d0d11] transition-transform duration-300 group-hover/card:scale-[1.02]"
      >
        {item.poster && !posterFailed ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-zinc-900 to-black p-2 text-center">
            <Film className="h-6 w-6 text-zinc-700" />
            <span className="line-clamp-3 text-[10px] uppercase tracking-widest text-zinc-600">{item.title}</span>
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur">
          {item.type === "tv" ? "TV" : "Movie"}
        </span>
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/card:opacity-100">
          <button
            type="button"
            aria-label={`Play ${item.title}`}
            data-testid={`card-play-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(item);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e50914] text-white transition-transform duration-200 hover:scale-110"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
          <button
            type="button"
            aria-label={bookmarked ? "Remove from watchlist" : "Add to watchlist"}
            data-testid={`card-bookmark-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark?.(item);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-transform duration-200 hover:scale-110 ${
              bookmarked
                ? "border-[#e50914] bg-[#e50914] text-white"
                : "border-white/20 bg-black/60 text-zinc-200 hover:text-white"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </button>
        </div>
        {progressPct != null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="h-full bg-[#e50914]" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="truncate text-sm font-medium text-zinc-100">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          {item.year ? <span>{item.year}</span> : null}
          {item.rating ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-[#e50914]" />
              {item.rating}
            </span>
          ) : null}
          {progressLabel ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{progressLabel}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
