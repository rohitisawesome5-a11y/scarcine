import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./MediaCard";
import { SkeletonCard } from "./Skeleton";

export function MediaRow({
  eyebrow,
  title,
  fetcher,
  staticItems,
  loading = false,
  error = false,
  limit = 18,
  renderItem,
  onPlay,
  isBookmarked,
  onToggleBookmark,
  testid,
}) {
  const [fetched, setFetched] = useState(null);
  const [failed, setFailed] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    if (!fetcher) return undefined;
    let alive = true;
    fetcher()
      .then((items) => alive && setFetched(items.slice(0, limit)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [fetcher, limit]);

  const items = staticItems || fetched;
  const isLoading = fetcher ? !failed && !fetched : loading;
  const hasError = fetcher ? failed : error;

  const scroll = (dir) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  const rowId = testid || `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className="mt-10" data-testid={rowId}>
      <div className="mx-auto flex max-w-[1900px] items-end justify-between px-4 md:px-10">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">{eyebrow}</p>
          ) : null}
          <h2 className="text-xl font-bold tracking-tight text-zinc-100 md:text-2xl">{title}</h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label="Scroll left"
            data-testid={`${rowId}-scroll-left`}
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] bg-black/60 text-zinc-400 backdrop-blur transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            data-testid={`${rowId}-scroll-right`}
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] bg-black/60 text-zinc-400 backdrop-blur transition-colors hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1900px] px-4 md:px-10">
        {hasError ? (
          <p className="mt-4 text-sm text-zinc-500" data-testid={`${rowId}-error`}>
            Couldn’t load this row. Check your connection or TMDB key.
          </p>
        ) : isLoading ? (
          <div className="mt-4 flex gap-3 overflow-hidden md:gap-4" data-testid={`${rowId}-skeleton`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items?.length ? (
          <div
            ref={scroller}
            className="scrollbar-hide -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2 snap-x md:gap-4"
          >
            {items.map((item, i) => (
              <Fragment key={`${item.type}-${item.id}-${i}`}>
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <MediaCard
                    item={item}
                    onPlay={onPlay}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={onToggleBookmark}
                  />
                )}
              </Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
