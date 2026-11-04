import { Link } from "react-router-dom";
import { Bookmark, History } from "lucide-react";
import { MediaCard } from "../components/MediaCard";
import { HistoryCard } from "../components/HistoryRow";

function EmptyState({ icon: Icon, title, copy, testid }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/[0.07] px-6 py-12 text-center"
      data-testid={testid}
    >
      <Icon className="h-6 w-6 text-zinc-700" />
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-zinc-500">{copy}</p>
      <Link
        to="/"
        data-testid={`${testid}-browse`}
        className="mt-2 rounded-md bg-[#e50914] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#f5111c]"
      >
        Browse Discover
      </Link>
    </div>
  );
}

export default function Library({ library, openPlayer }) {
  const { bookmarks, history, removeBookmark, removeHistory, toggleBookmark, isBookmarked } = library;

  return (
    <div className="mx-auto max-w-[1900px] px-4 pb-24 pt-28 md:px-10 md:pt-24">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">
        Zero-auth · stored on this device only
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">My Library</h1>

      <section className="mt-10" data-testid="library-history-section">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 md:text-2xl">Continue Watching</h2>
        <div className="mt-4">
          {history.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {history.map((entry) => (
                <HistoryCard
                  key={entry.key}
                  entry={entry}
                  openPlayer={openPlayer}
                  removeHistory={removeHistory}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Nothing playing yet"
              copy="Press play on any title and your progress will appear here automatically."
              testid="library-history-empty"
            />
          )}
        </div>
      </section>

      <section className="mt-14" data-testid="library-bookmarks-section">
        <h2 className="text-xl font-bold tracking-tight text-zinc-100 md:text-2xl">Watchlist</h2>
        <div className="mt-4">
          {bookmarks.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {bookmarks.map((item) => (
                <MediaCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  fluid
                  onPlay={openPlayer}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Your watchlist is empty"
              copy="Hit the bookmark button on any poster to keep it here for later."
              testid="library-bookmarks-empty"
            />
          )}
        </div>
      </section>
    </div>
  );
}
