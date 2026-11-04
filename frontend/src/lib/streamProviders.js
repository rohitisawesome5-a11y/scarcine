export const STREAM_PROVIDERS = [
  {
    id: "framextv",
    label: "Server Alpha",
    tag: "Primary",
    buildUrl: ({ id, season, episode, server = "pekka" }) =>
      season
        ? `https://framextv.xyz/embed/${id}/${season}/${episode}?server=${server}&controls=1&autoplay=1`
        : `https://framextv.xyz/embed/${id}?server=${server}&controls=1&autoplay=1`,
  },
  {
    id: "vidsrc",
    label: "Server Beta",
    tag: "Mirror",
    buildUrl: ({ id, season, episode }) =>
      season
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`,
  },
  {
    id: "autoembed",
    label: "Server Gamma",
    tag: "Fast",
    buildUrl: ({ id, season, episode }) =>
      season
        ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${id}`,
  },
  {
    id: "multiembed",
    label: "Server Delta",
    tag: "Backup",
    buildUrl: ({ id, season, episode }) =>
      season
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
];
