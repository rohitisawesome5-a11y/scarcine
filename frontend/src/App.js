import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { SearchOverlay } from "./components/SearchOverlay";
import { PlayerModal } from "./components/PlayerModal";
import { PersonModal } from "./components/PersonModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useLibrary } from "./hooks/useLibrary";
import Discover from "./pages/Discover";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Library from "./pages/Library";

export default function App() {
  const library = useLibrary();
  const [searchOpen, setSearchOpen] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [personId, setPersonId] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  }, []);

  const openPlayer = useCallback((item, ep) => setPlaying({ item, ep }), []);
  const closePlayer = useCallback(() => setPlaying(null), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openPerson = useCallback((id) => setPersonId(id), []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#08080a] text-zinc-100 antialiased">
          <Navbar onOpenSearch={() => setSearchOpen(true)} />
          <main>
            <Routes>
              <Route path="/" element={<Discover library={library} openPlayer={openPlayer} />} />
              <Route path="/movies" element={<Movies library={library} openPlayer={openPlayer} />} />
              <Route path="/series" element={<Series library={library} openPlayer={openPlayer} />} />
              <Route path="/library" element={<Library library={library} openPlayer={openPlayer} />} />
              <Route path="*" element={<Discover library={library} openPlayer={openPlayer} />} />
            </Routes>
          </main>
          <footer className="border-t border-white/[0.07] bg-[#0d0d11]">
            <div className="mx-auto flex max-w-[1900px] flex-col gap-2 px-4 py-8 text-xs text-zinc-600 md:flex-row md:items-center md:justify-between md:px-10">
              <p>
                <span className="font-bold text-zinc-400">SCARCINE</span>
                <span className="text-[#e50914]">.</span> — zero-auth streaming. Nothing leaves your device.
              </p>
              <p>Metadata by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            </div>
          </footer>
          {searchOpen ? <SearchOverlay openPlayer={openPlayer} onClose={closeSearch} /> : null}
          {playing ? (
            <PlayerModal
              media={playing.item}
              ep={playing.ep}
              library={library}
              onClose={closePlayer}
              onOpenPerson={openPerson}
              escapeBlocked={personId != null}
            />
          ) : null}
          {personId ? (
            <PersonModal personId={personId} openPlayer={openPlayer} onClose={() => setPersonId(null)} />
          ) : null}
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
