import { api } from "../lib/tmdb";
import { MediaRow } from "../components/MediaRow";
import { GenreBrowser } from "../components/GenreBrowser";

export default function Series({ library, openPlayer }) {
  return (
    <div className="mx-auto max-w-[1900px] px-4 pb-24 pt-28 md:px-10 md:pt-24">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">Serial frequency</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">Series</h1>
      <GenreBrowser mediaType="tv" library={library} openPlayer={openPlayer} />
      <MediaRow
        eyebrow="Heat check"
        title="Trending Series"
        fetcher={api.trendingTv}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="Crowd pleasers"
        title="Popular Series"
        fetcher={api.popularTv}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="Critics' vault"
        title="Top Rated Series"
        fetcher={api.topRatedTv}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="Live this week"
        title="On The Air"
        fetcher={api.onTheAir}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
    </div>
  );
}
