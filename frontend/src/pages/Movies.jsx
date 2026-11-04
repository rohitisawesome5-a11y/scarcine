import { api } from "../lib/tmdb";
import { MediaRow } from "../components/MediaRow";
import { GenreBrowser } from "../components/GenreBrowser";

export default function Movies({ library, openPlayer }) {
  return (
    <div className="mx-auto max-w-[1900px] px-4 pb-24 pt-28 md:px-10 md:pt-24">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">The vault</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">Movies</h1>
      <GenreBrowser mediaType="movie" library={library} openPlayer={openPlayer} />
      <MediaRow
        eyebrow="Heat check"
        title="Trending This Week"
        fetcher={api.trendingMovies}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="Crowd pleasers"
        title="Popular Right Now"
        fetcher={api.popularMovies}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="Critics' vault"
        title="Top Rated of All Time"
        fetcher={api.topRatedMovies}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
      <MediaRow
        eyebrow="On the big screen"
        title="In Theaters"
        fetcher={api.nowPlaying}
        onPlay={openPlayer}
        isBookmarked={library.isBookmarked}
        onToggleBookmark={library.toggleBookmark}
      />
    </div>
  );
}
