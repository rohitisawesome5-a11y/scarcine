import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, MousePointerClick, Star, Subtitles, TriangleAlert, X, Zap } from "lucide-react";
import { STREAM_PROVIDERS } from "../lib/streamProviders";
import { api, img } from "../lib/tmdb";

const SERVERS = [
  { value: "pekka", label: "PEKKA", note: "1080p Ultra Bitrate" },
  { value: "archer", label: "Archer", note: "4K UHD · Multi-Audio" },
  { value: "barbarian", label: "Barbarian", note: "Multi-Language Subs" },
  { value: "goblin", label: "Goblin", note: "Fast Mirror Backup" },
];

const MODE_SERVERS = { sub: "barbarian", dub: "archer" };

const storedStreamMode = () => {
  try {
    const pref = localStorage.getItem("preferred_stream_mode");
    return pref === "dub" || pref === "sub" ? pref : null;
  } catch {
    return null;
  }
};

const initialServer = () => {
  const pref = storedStreamMode();
  return pref ? MODE_SERVERS[pref] : "pekka";
};

export function PlayerModal({ media, ep, library, onOpenPerson, escapeBlocked, onClose }) {
  const { toggleBookmark, isBookmarked, saveProgress } = library;
  const isTv = media.type === "tv";
  const [server, setServer] = useState(initialServer);
  const [streamMode, setStreamMode] = useState(storedStreamMode);
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [shieldActive, setShieldActive] = useState(true);
  const [sandboxRelaxed, setSandboxRelaxed] = useState(false);
  const [blockedPopups, setBlockedPopups] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [providerIdx, setProviderIdx] = useState(0);
  const frameWrapRef = useRef(null);
  const iframeRef = useRef(null);
  const pendingNotes = useRef([]);
  const relaxedRef = useRef(false);

  const postToPlayer = (message) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    } catch {
      // embed not ready — the delayed re-send below covers it
    }
  };

  const dispatchToPlayer = (message) => {
    postToPlayer(message);
    const t = setTimeout(() => postToPlayer(message), 1200);
    pendingNotes.current.push(t);
  };

  useEffect(() => () => pendingNotes.current.forEach(clearTimeout), []);

  useEffect(() => {
    relaxedRef.current = sandboxRelaxed;
  }, [sandboxRelaxed]);

  useEffect(() => {
    const originalOpen = window.open;
    window.open = (...args) => {
      if (relaxedRef.current) return originalOpen(...args);
      setBlockedPopups((count) => count + 1);
      console.warn("Blocked rogue redirect attempt");
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = frameWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const selectProvider = (i) => {
    if (i === providerIdx) return;
    setProviderIdx(i);
    setShieldActive(true);
  };

  const cycleProvider = () => {
    setProviderIdx((i) => (i + 1) % STREAM_PROVIDERS.length);
    setShieldActive(true);
  };

  const selectStreamMode = (next) => {
    setStreamMode(next);
    try {
      localStorage.setItem("preferred_stream_mode", next);
    } catch {
      // preference persistence is best-effort
    }
    setServer(MODE_SERVERS[next]);
    dispatchToPlayer(
      next === "dub"
        ? { action: "setProvider", provider: "archer" }
        : { action: "setSubtitle", index: 0 }
    );
  };

  const sendSubtitle = (index) => {
    dispatchToPlayer({ action: "setSubtitle", index });
    setSubMenuOpen(false);
  };
  const [season, setSeason] = useState(ep?.season || 1);
  const [episode, setEpisode] = useState(ep?.episode || 1);
  const [details, setDetails] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const bookmarked = isBookmarked(media);

  useEffect(() => {
    let alive = true;
    api
      .details(media.type, media.id)
      .then((d) => alive && setDetails(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [media.type, media.id]);

  useEffect(() => {
    if (!isTv) return undefined;
    let alive = true;
    api
      .season(media.id, season)
      .then((d) => alive && setEpisodes(d?.episodes || []))
      .catch(() => alive && setEpisodes([]));
    return () => {
      alive = false;
    };
  }, [isTv, media.id, season]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement && !escapeBlocked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, escapeBlocked]);

  const metaRef = useRef(null);
  metaRef.current = { media, season, episode };

  useEffect(() => {
    let lastSavedAt = 0;
    let lastPayload = null;
    const persist = (p) => {
      const { media: m, season: s, episode: e } = metaRef.current;
      saveProgress({
        tmdbId: m.id,
        type: m.type,
        title: m.title,
        poster: m.poster,
        backdrop: m.backdrop,
        rating: m.rating,
        year: m.year,
        season: m.type === "tv" ? s : null,
        episode: m.type === "tv" ? e : null,
        currentTime: p.currentTime,
        duration: p.duration,
        timestamp: Date.now(),
      });
    };
    const onMessage = (event) => {
      const data = event?.data;
      if (!data || data.event !== "frameXTV:timeupdate") return;
      const p = data.data || data;
      if (!p || typeof p.currentTime !== "number" || !p.duration) return;
      lastPayload = p;
      const now = Date.now();
      if (now - lastSavedAt >= 5000) {
        lastSavedAt = now;
        persist(p);
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (lastPayload) persist(lastPayload);
    };
  }, [saveProgress]);

  const provider = STREAM_PROVIDERS[providerIdx];
  const isFrameX = provider.id === "framextv";
  const src = provider.buildUrl({
    id: media.id,
    season: isTv ? season : undefined,
    episode: isTv ? episode : undefined,
    server,
  });

  const cast = details?.credits?.cast?.slice(0, 14) || [];
  const seasons = (details?.seasons || []).filter((s) => s.season_number >= 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-2xl" data-testid="player-modal">
      {media.backdrop ? (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-15 blur-3xl"
          style={{ backgroundImage: `url(${media.backdrop})` }}
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">
              Now Playing · {isTv ? `S${season} · E${episode}` : "Feature Film"} · {provider.label}
              {isFrameX ? ` · ${SERVERS.find((s) => s.value === server)?.label}` : ""}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-zinc-100 md:text-2xl" data-testid="player-title">
              {media.title}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              {media.year ? <span>{media.year}</span> : null}
              {media.rating ? (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-[#e50914]" />
                  {media.rating}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={bookmarked ? "Remove from watchlist" : "Add to watchlist"}
              data-testid="player-bookmark"
              onClick={() => toggleBookmark(media)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                bookmarked
                  ? "border-[#e50914] bg-[#e50914] text-white"
                  : "border-white/[0.07] bg-white/5 text-zinc-300 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Close player"
              data-testid="player-close"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.07] bg-white/5 text-zinc-300 transition-colors hover:bg-[#e50914] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={frameWrapRef}
          className={`relative mt-5 w-full overflow-hidden border border-white/[0.07] bg-black shadow-2xl ${
            isFullscreen ? "h-full" : "aspect-video"
          }`}
          data-testid="player-frame"
        >
          <iframe
            key={`${provider.id}-${src}-${sandboxRelaxed ? "relaxed" : "strict"}`}
            ref={iframeRef}
            src={src}
            title={`${media.title} player`}
            className="h-full w-full"
            sandbox={
              sandboxRelaxed
                ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox"
                : "allow-scripts allow-same-origin allow-forms allow-presentation"
            }
            allow="accelerometer; autoplay; encrypted-media; fullscreen; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {shieldActive ? (
            <div
              data-testid="click-shield"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShieldActive(false);
              }}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-transparent"
            >
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur">
                <MousePointerClick className="h-3.5 w-3.5" />
                Click to activate player
              </span>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          data-testid="fallback-next-server"
          onClick={cycleProvider}
          className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors duration-200 hover:text-[#e50914]"
        >
          <TriangleAlert className="h-3 w-3" />
          Stream broken or buffering? Switch to Next Server
        </button>

        <div
          className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[11px]"
          data-testid="popup-defense-badge"
        >
          <span className="flex items-center gap-1.5 font-bold text-zinc-300">
            <Zap className="h-3 w-3 fill-current text-[#e50914]" />
            Popups blocked{blockedPopups > 0 ? ` (${blockedPopups})` : ""}.
          </span>
          <span className="text-zinc-500">If stream fails to decrypt or stays blank, click</span>
          <button
            type="button"
            data-testid="relax-sandbox"
            onClick={() => setSandboxRelaxed((v) => !v)}
            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
              sandboxRelaxed
                ? "border-[#e50914] bg-[#e50914] text-white"
                : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
            }`}
          >
            {sandboxRelaxed ? "Re-secure Sandbox" : "Relax Sandbox"}
          </button>
          <span className="text-zinc-500">or use Brave / uBlock.</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Source</p>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="source-selector">
              {STREAM_PROVIDERS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`source-pill-${p.id}`}
                  onClick={() => selectProvider(i)}
                  className={`rounded-full border px-4 py-1.5 text-left transition-all duration-200 ${
                    i === providerIdx
                      ? "border-[#e50914] bg-[#e50914] text-white"
                      : "border-white/[0.07] bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-widest">{p.label}</span>
                  <span className={`block text-[9px] ${i === providerIdx ? "text-white/70" : "text-zinc-600"}`}>
                    {p.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            data-testid="player-fullscreen"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="flex h-[38px] items-center gap-1.5 self-end rounded-md border border-white/[0.07] bg-white/5 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>

        {isFrameX ? (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Extraction Server</p>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="server-selector">
              {SERVERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  data-testid={`server-pill-${s.value}`}
                  onClick={() => {
                    setServer(s.value);
                    setStreamMode(null);
                  }}
                  className={`rounded-full border px-4 py-1.5 text-left transition-all duration-200 ${
                    server === s.value
                      ? "border-[#e50914] bg-[#e50914] text-white"
                      : "border-white/[0.07] bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-widest">{s.label}</span>
                  <span className={`block text-[9px] ${server === s.value ? "text-white/70" : "text-zinc-600"}`}>
                    {s.note}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audio Track</p>
              <div
                className="mt-2 flex items-center rounded-full border border-white/[0.07] bg-white/5 p-1"
                data-testid="stream-mode-switch"
              >
                {["sub", "dub"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-testid={`mode-${m}`}
                    onClick={() => selectStreamMode(m)}
                    className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                      streamMode === m ? "bg-[#e50914] text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subtitles</p>
              <div className="relative mt-2">
                <button
                  type="button"
                  data-testid="subtitle-menu-trigger"
                  onClick={() => setSubMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
                >
                  <Subtitles className="h-3.5 w-3.5" />
                  Menu
                </button>
                {subMenuOpen ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSubMenuOpen(false)} />
                    <div
                      className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-white/[0.07] bg-[#0d0d11] py-1 shadow-2xl"
                      data-testid="subtitle-menu"
                    >
                      <button
                        type="button"
                        data-testid="subtitle-on"
                        onClick={() => sendSubtitle(0)}
                        className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Subtitles ON
                      </button>
                      <button
                        type="button"
                        data-testid="subtitle-off"
                        onClick={() => sendSubtitle(-1)}
                        className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Subtitles OFF
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {isFrameX && streamMode === "dub" ? (
          <p className="mt-3 max-w-2xl text-[10px] leading-relaxed text-zinc-500" data-testid="dub-hint">
            Dub availability depends on the source stream. If it still plays subtitled, this title has no
            English dub on this server — open the player’s ⚙ menu → Audio to check available tracks, or try
            another server.
          </p>
        ) : null}

        {isTv ? (
          <div className="mt-6" data-testid="tv-controls">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Episodes</p>
              <select
                data-testid="season-select"
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value));
                  setEpisode(1);
                }}
                className="rounded-md border border-white/[0.07] bg-[#0d0d11] px-3 py-1.5 text-sm text-zinc-200 focus:border-[#e50914] focus:outline-none"
              >
                {seasons.length ? (
                  seasons.map((s) => (
                    <option key={s.id} value={s.season_number}>
                      Season {s.season_number}
                      {s.name && s.name !== `Season ${s.season_number}` ? ` · ${s.name}` : ""}
                    </option>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Season {i + 1}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="scrollbar-hide mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
              {episodes.length ? (
                episodes.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    title={e.name}
                    data-testid={`episode-pill-${e.episode_number}`}
                    onClick={() => setEpisode(e.episode_number)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      episode === e.episode_number
                        ? "border-[#e50914] bg-[#e50914] text-white"
                        : "border-white/[0.07] bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    E{e.episode_number}
                  </button>
                ))
              ) : (
                <p className="text-xs text-zinc-600">Loading episodes…</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-8 border-t border-white/[0.07] pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Synopsis</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400" data-testid="player-synopsis">
            {details?.overview || media.overview || "Synopsis unavailable for this title."}
          </p>

          {details?.genres?.length ? (
            <div className="mt-5 flex flex-wrap gap-2" data-testid="player-genres">
              {details.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full border border-white/[0.07] bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                >
                  {g.name}
                </span>
              ))}
            </div>
          ) : null}

          {cast.length ? (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cast</p>
              <div className="scrollbar-hide mt-3 flex gap-4 overflow-x-auto pb-2" data-testid="player-cast">
                {cast.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={`More about ${p.name}`}
                    data-testid={`cast-member-${p.id}`}
                    onClick={() => onOpenPerson?.(p.id)}
                    className="group/cast flex w-16 flex-none flex-col items-center text-center"
                  >
                    {p.profile_path ? (
                      <img
                        src={img(p.profile_path, "w185")}
                        alt={p.name}
                        loading="lazy"
                        className="h-14 w-14 rounded-full border border-white/[0.07] object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.07] bg-white/5 text-sm font-bold text-zinc-500">
                        {p.name?.[0]}
                      </div>
                    )}
                    <span className="mt-1.5 line-clamp-2 text-[10px] leading-tight text-zinc-400 transition-colors group-hover/cast:text-white">{p.name}</span>
                    <span className="line-clamp-1 text-[9px] text-zinc-600">{p.character}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
