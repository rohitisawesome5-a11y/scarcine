import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { api } from "../lib/tmdb";
import { MediaCard } from "./MediaCard";
import { SkeletonGrid } from "./Skeleton";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
];

export function SearchOverlay({ openPlayer, onClose }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState(null);
  const [trending, setTrending] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    api.trending().then(setTrending).catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setStatus("idle");
      return undefined;
    }
    setStatus("loading");
    const t = setTimeout(() => {
      api
        .searchMulti(q)
        .then((items) => {
          setResults(items);
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const visible = (results || []).filter((r) => filter === "all" || r.type === filter);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/85 backdrop-blur-sm"
      data-testid="search-overlay"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-[7vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d11]/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-zinc-500" />
          <input
            data-testid="search-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, people…"
            className="h-8 w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear query"
              data-testid="search-clear"
              onClick={() => setQuery("")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
          <button
            type="button"
            data-testid="search-close"
            onClick={onClose}
            className="shrink-0 rounded border border-white/[0.07] bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
          >
            Esc
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              data-testid={`search-filter-${f.value}`}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                filter === f.value
                  ? "bg-[#e50914] text-white"
                  : "border border-white/[0.07] bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4" data-testid="search-results">
          {status === "loading" ? (
            <SkeletonGrid count={8} />
          ) : status === "error" ? (
            <p className="py-10 text-center text-sm text-zinc-500">Search failed. Try again.</p>
          ) : status === "ready" ? (
            visible.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {visible.slice(0, 24).map((item) => (
                  <MediaCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    fluid
                    onPlay={(it) => {
                      openPlayer(it);
                      onClose();
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-500" data-testid="search-empty">
                No results for “{query.trim()}”.
              </p>
            )
          ) : (
            <>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Trending this week
              </p>
              {trending === null ? (
                <SkeletonGrid count={8} />
              ) : trending.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {trending.slice(0, 8).map((item) => (
                    <MediaCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      fluid
                      onPlay={(it) => {
                        openPlayer(it);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Live metadata unavailable — add a TMDB key to power search.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
