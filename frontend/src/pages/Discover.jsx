import { useEffect, useState } from "react";
import { api } from "../lib/tmdb";
import { Hero } from "../components/Hero";
import { MediaRow } from "../components/MediaRow";
import { HistoryRow } from "../components/HistoryRow";
import { GenreBrowser } from "../components/GenreBrowser";

export default function Discover({ library, openPlayer }) {
  const [trending, setTrending] = useState(null);

  useEffect(() => {
    api
      .trending()
      .then(setTrending)
      .catch(() => setTrending([]));
  }, []);

  return (
    <div className="pb-24">
      <Hero items={trending} library={library} onPlay={openPlayer} />
      <div className="mx-auto max-w-[1900px] px-4 pb-4 md:px-10">
        <GenreBrowser mediaType="movie" library={library} openPlayer={openPlayer} />
        <HistoryRow history={library.history} openPlayer={openPlayer} removeHistory={library.removeHistory} />
        <MediaRow
          eyebrow="This week"
          title="Trending Today"
          staticItems={trending}
          loading={trending === null}
          error={trending !== null && trending.length === 0}
          onPlay={openPlayer}
          isBookmarked={library.isBookmarked}
          onToggleBookmark={library.toggleBookmark}
        />
        <MediaRow
          eyebrow="Critics' vault"
          title="Top Rated Movies"
          fetcher={api.topRatedMovies}
          onPlay={openPlayer}
          isBookmarked={library.isBookmarked}
          onToggleBookmark={library.toggleBookmark}
        />
        <MediaRow
          eyebrow="Binge-worthy"
          title="Popular TV Series"
          fetcher={api.popularTv}
          onPlay={openPlayer}
          isBookmarked={library.isBookmarked}
          onToggleBookmark={library.toggleBookmark}
        />
      </div>
    </div>
  );
}
