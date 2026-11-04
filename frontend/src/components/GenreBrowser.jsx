import { useEffect, useRef, useState } from "react";
import { api } from "../lib/tmdb";
import { MediaCard } from "./MediaCard";
import { SkeletonGrid } from "./Skeleton";

export function GenreBrowser({ mediaType, library, openPlayer }) {
  const [genres, setGenres] = useState([]);
  const [active, setActive] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map());

  useEffect(() => {
    let alive = true;
    api
      .genres(mediaType)
      .then((g) => alive && setGenres(g))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mediaType]);

  const select = (g) => {
    if (active === g.id) {
      setActive(null);
      setItems(null);
      return;
    }
    setActive(g.id);
    const cached = cache.current.get(g.id);
    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setItems(null);
    api
      .discoverByGenre(mediaType, g.id)
      .then((res) => {
        cache.current.set(g.id, res);
        setItems(res);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  return (
    <section className="mt-10" data-testid="genre-browser">
      <div className="mx-auto max-w-[1900px] px-4 md:px-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">Pick a vibe</p>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 md:text-2xl">Browse by Mood</h2>
        <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap" data-testid="genre-chips">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              data-testid={`genre-chip-${g.id}`}
              onClick={() => select(g)}
              className={`flex-none rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                active === g.id
                  ? "border-[#e50914] bg-[#e50914] text-white"
                  : "border-white/[0.07] bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        {active ? (
          <div className="mt-6" data-testid="genre-grid">
            {loading ? (
              <SkeletonGrid count={7} />
            ) : items?.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {items.slice(0, 14).map((item) => (
                  <MediaCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    fluid
                    onPlay={openPlayer}
                    isBookmarked={library.isBookmarked}
                    onToggleBookmark={library.toggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500" data-testid="genre-grid-error">
                Couldn’t load this mood. Try another.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
