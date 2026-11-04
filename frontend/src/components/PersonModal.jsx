import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, img, normalize } from "../lib/tmdb";
import { MediaCard } from "./MediaCard";
import { SkeletonGrid } from "./Skeleton";

export function PersonModal({ personId, openPlayer, onClose }) {
  const [person, setPerson] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setPerson(null);
    api
      .person(personId)
      .then((d) => alive && setPerson(d))
      .catch(() => alive && setPerson(false));
    return () => {
      alive = false;
    };
  }, [personId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const known = person
    ? [
        ...new Map(
          (person.combined_credits?.cast || [])
            .filter((c) => c.poster_path)
            .map((c) => [c.id, c])
        ).values(),
      ]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 14)
        .map((c) => normalize(c, c.title ? "movie" : "tv"))
    : [];

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/95 backdrop-blur-2xl"
      data-testid="person-modal"
      onClick={onClose}
    >
      <div
        className="relative mx-auto mt-[6vh] w-[calc(100%-2rem)] max-w-5xl rounded-xl border border-white/[0.07] bg-[#0d0d11]/95 p-6 shadow-2xl backdrop-blur-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          autoFocus
          data-testid="person-close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.07] bg-white/5 text-zinc-300 transition-colors hover:bg-[#e50914] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {person === false ? (
          <p className="py-16 text-center text-sm text-zinc-500" data-testid="person-error">
            Couldn’t load this profile. Try again later.
          </p>
        ) : !person ? (
          <SkeletonGrid count={7} />
        ) : (
          <>
            <div className="flex items-start gap-5">
              {person.profile_path ? (
                <img
                  src={img(person.profile_path, "w185")}
                  alt={person.name}
                  data-testid="person-photo"
                  className="h-28 w-24 flex-none rounded-lg border border-white/[0.07] object-cover"
                />
              ) : null}
              <div className="min-w-0 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">
                  {person.known_for_department || "Acting"}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl" data-testid="person-name">
                  {person.name}
                </h2>
                <p className="mt-2 text-xs text-zinc-500" data-testid="person-meta">
                  {person.birthday ? `Born ${person.birthday}` : "Birth date unknown"}
                  {person.place_of_birth ? ` · ${person.place_of_birth}` : ""}
                  {person.deathday ? ` · Died ${person.deathday}` : ""}
                </p>
              </div>
            </div>

            {person.biography ? (
              <p
                className={`mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400 ${expanded ? "" : "line-clamp-4"}`}
                data-testid="person-bio"
              >
                {person.biography}
              </p>
            ) : null}
            {person.biography && person.biography.length > 320 ? (
              <button
                type="button"
                data-testid="person-bio-toggle"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-[#e50914] hover:text-[#f5111c]"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            ) : null}

            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Known For</p>
              <div
                className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
                data-testid="person-grid"
              >
                {known.map((item) => (
                  <MediaCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    fluid
                    onPlay={(it) => {
                      onClose();
                      openPlayer(it);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
