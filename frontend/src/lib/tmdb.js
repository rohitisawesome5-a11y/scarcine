const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.REACT_APP_TMDB_KEY || "";

export const hasTmdbKey = Boolean(API_KEY && BACKEND);

async function tmdbFetch(url, timeout = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// All TMDB traffic goes through the backend proxy so the browser never
// depends on direct reachability of api.themoviedb.org / image.tmdb.org.
export async function tmdb(endpoint, params = {}) {
  if (!hasTmdbKey) throw new Error("TMDB API key is not configured");
  const qs = new URLSearchParams({ api_key: API_KEY });
  Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, v));
  return tmdbFetch(`${BACKEND}/api/tmdb/${endpoint.replace(/^\/+/, "")}?${qs.toString()}`);
}

export const img = (path, size = "w500") =>
  path && BACKEND ? `${BACKEND}/api/tmdb/img/${size}${path}` : null;

export function normalize(raw, fallbackType = "movie") {
  const type =
    raw.media_type === "movie" || raw.media_type === "tv"
      ? raw.media_type
      : raw.title
        ? "movie"
        : raw.name
          ? "tv"
          : fallbackType;
  const title = raw.title || raw.name || "Untitled";
  const date = raw.release_date || raw.first_air_date || "";
  return {
    id: raw.id,
    type,
    title,
    year: date ? Number(String(date).slice(0, 4)) : null,
    rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : null,
    poster: img(raw.poster_path, "w342"),
    backdrop: img(raw.backdrop_path, "w1280"),
    overview: raw.overview || "",
  };
}

const list = (endpoint, params = {}, fallbackType) => () =>
  tmdb(endpoint, params).then((data) =>
    (data?.results || [])
      .filter((r) => r.media_type !== "person")
      .map((r) => normalize(r, fallbackType))
  );

export const api = {
  trending: list("/trending/all/week"),
  trendingMovies: list("/trending/movie/week", {}, "movie"),
  trendingTv: list("/trending/tv/week", {}, "tv"),
  popularMovies: list("/movie/popular", {}, "movie"),
  topRatedMovies: list("/movie/top_rated", {}, "movie"),
  nowPlaying: list("/movie/now_playing", {}, "movie"),
  popularTv: list("/tv/popular", {}, "tv"),
  topRatedTv: list("/tv/top_rated", {}, "tv"),
  onTheAir: list("/tv/on_the_air", {}, "tv"),
  searchMulti: (query) => list("/search/multi", { query })(),
  genres: (type) => tmdb(`/genre/${type}/list`).then((d) => d?.genres || []),
  discoverByGenre: (type, genreId) =>
    list(`/discover/${type}`, { with_genres: genreId, sort_by: "popularity.desc", include_adult: false }, type)(),
  person: (id) => tmdb(`/person/${id}`, { append_to_response: "combined_credits" }),
  details: (type, id) => tmdb(`/${type}/${id}`, { append_to_response: "credits" }),
  season: (id, num) => tmdb(`/tv/${id}/season/${num}`),
};
