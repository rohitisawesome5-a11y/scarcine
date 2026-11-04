import { MediaCard } from "./MediaCard";
import { MediaRow } from "./MediaRow";

export function HistoryCard({ entry, openPlayer, removeHistory }) {
  const pct = entry.duration ? Math.min(100, Math.round((entry.currentTime / entry.duration) * 100)) : 0;
  const item = {
    id: entry.tmdbId,
    type: entry.type,
    title: entry.title,
    poster: entry.poster,
    backdrop: entry.backdrop,
    rating: entry.rating,
    year: entry.year,
  };
  return (
    <div className="group/entry relative" data-testid={`history-entry-${entry.key}`}>
      <MediaCard
        item={item}
        onPlay={() =>
          openPlayer(item, entry.season ? { season: entry.season, episode: entry.episode } : undefined)
        }
        progressPct={pct}
        progressLabel={
          entry.season ? `S${entry.season}·E${entry.episode}` : pct > 0 ? `${pct}%` : undefined
        }
      />
      <button
        type="button"
        aria-label="Remove from history"
        data-testid={`history-remove-${entry.key}`}
        onClick={() => removeHistory(entry.key)}
        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-zinc-300 opacity-0 backdrop-blur transition-all duration-200 hover:bg-[#e50914] hover:text-white group-hover/entry:opacity-100"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function HistoryRow({ history, openPlayer, removeHistory }) {
  if (!history?.length) return null;
  return (
    <MediaRow
      eyebrow="Resume playback"
      title="Continue Watching"
      staticItems={history}
      testid="row-continue-watching"
      renderItem={(entry) => (
        <HistoryCard key={entry.key} entry={entry} openPlayer={openPlayer} removeHistory={removeHistory} />
      )}
    />
  );
}
