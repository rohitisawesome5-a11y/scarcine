import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const entryKey = (type, id, season, episode) =>
  season ? `${type}-${id}-s${season}e${episode}` : `${type}-${id}`;

export function useLibrary() {
  const [bookmarks, setBookmarks] = useLocalStorage("voidstream:bookmarks", []);
  const [history, setHistory] = useLocalStorage("voidstream:history", []);

  const isBookmarked = useCallback(
    (item) => bookmarks.some((b) => b.id === item.id && b.type === item.type),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (item) =>
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === item.id && b.type === item.type);
        if (exists) return prev.filter((b) => !(b.id === item.id && b.type === item.type));
        return [
          {
            id: item.id,
            type: item.type,
            title: item.title,
            poster: item.poster,
            backdrop: item.backdrop,
            rating: item.rating,
            year: item.year,
            savedAt: Date.now(),
          },
          ...prev,
        ];
      }),
    [setBookmarks]
  );

  const removeBookmark = useCallback(
    (item) =>
      setBookmarks((prev) => prev.filter((b) => !(b.id === item.id && b.type === item.type))),
    [setBookmarks]
  );

  const saveProgress = useCallback(
    (entry) =>
      setHistory((prev) => {
        const key = entryKey(entry.type, entry.tmdbId, entry.season, entry.episode);
        const rest = prev.filter((h) => h.key !== key);
        return [{ ...entry, key }, ...rest].slice(0, 20);
      }),
    [setHistory]
  );

  const removeHistory = useCallback(
    (key) => setHistory((prev) => prev.filter((h) => h.key !== key)),
    [setHistory]
  );

  return { bookmarks, history, isBookmarked, toggleBookmark, removeBookmark, saveProgress, removeHistory };
}
