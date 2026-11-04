import { useEffect, useState } from "react";
import { Check, Play, Plus, Star } from "lucide-react";

const ROTATE_MS = 8000;

export function Hero({ items, library, onPlay }) {
  const slides = (items || []).filter((t) => t.backdrop).slice(0, 8);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const item = slides.length ? slides[index % slides.length] : null;
  const bookmarked = item ? library.isBookmarked(item) : false;

  return (
    <section
      className="relative min-h-[560px] md:min-h-[74vh]"
      data-testid="hero-billboard"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.length ? (
        slides.map((slide, i) => (
          <img
            key={`${slide.type}-${slide.id}`}
            src={slide.backdrop}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === index % slides.length ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,#131318_0%,#08080a_70%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08080a] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

      <div className="relative mx-auto flex min-h-[560px] max-w-[1900px] flex-col justify-end px-4 pb-16 pt-36 md:min-h-[74vh] md:px-10 md:pb-24">
        {item ? (
          <div key={`${item.type}-${item.id}`} className="animate-rise-in">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">
              Trending №{index + 1} this week
            </p>
            <h1
              className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-zinc-100 md:text-6xl"
              data-testid="hero-title"
            >
              {item.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="rounded bg-[#e50914] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                {item.type === "tv" ? "TV" : "Movie"}
              </span>
              {item.year ? <span data-testid="hero-year">{item.year}</span> : null}
              {item.rating ? (
                <span
                  className="flex items-center gap-1 rounded border border-white/[0.07] bg-black/60 px-2 py-0.5 text-xs font-semibold backdrop-blur"
                  data-testid="hero-rating"
                >
                  <Star className="h-3 w-3 fill-current text-[#e50914]" />
                  {item.rating}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">TMDB</span>
                </span>
              ) : null}
            </div>
            {item.overview ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 line-clamp-3 md:text-base">
                {item.overview}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                data-testid="hero-watch-now"
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 rounded-md bg-[#e50914] px-6 py-3 text-sm font-bold tracking-tight text-white transition-all duration-200 hover:scale-[1.02] hover:bg-[#f5111c]"
              >
                <Play className="h-4 w-4 fill-current" />
                Watch Now
              </button>
              <button
                type="button"
                data-testid="hero-bookmark"
                onClick={() => library.toggleBookmark(item)}
                className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/10 px-6 py-3 text-sm font-bold tracking-tight text-zinc-100 backdrop-blur transition-all duration-200 hover:scale-[1.02] hover:bg-white/20"
              >
                {bookmarked ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {bookmarked ? "In Watchlist" : "Watchlist"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">Zero sign-in. Zero friction.</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-zinc-100 md:text-6xl">
              Cinema without the paperwork.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
              Stream trending movies and series instantly. Your watchlist and progress stay on this device —
              no account, ever.
            </p>
          </>
        )}
      </div>

      {slides.length > 1 ? (
        <div className="absolute bottom-6 right-4 z-10 flex items-center gap-1.5 md:right-10" data-testid="hero-dots">
          {slides.map((slide, i) => (
            <button
              key={`dot-${slide.type}-${slide.id}`}
              type="button"
              aria-label={`Show ${slide.title}`}
              data-testid={`hero-dot-${i}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index % slides.length ? "w-6 bg-[#e50914]" : "w-2 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
