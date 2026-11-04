import { Link, NavLink } from "react-router-dom";
import { Search, Shield, Download } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const LINKS = [
  { to: "/", label: "Discover" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/library", label: "My Library" },
];

const linkClass = ({ isActive }) =>
  `text-sm transition-colors duration-200 ${
    isActive ? "font-semibold text-white" : "text-zinc-400 hover:text-white"
  }`;

export function Navbar({ onOpenSearch }) {
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1900px] items-center gap-6 px-4 md:px-10">
        <Link to="/" data-testid="nav-logo" className="flex items-baseline text-lg font-extrabold tracking-tight">
          <span className="text-zinc-100">SCAR</span>
          <span className="text-zinc-500">CINE</span>
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-[#e50914]" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={linkClass}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {canInstall ? (
            <button
              type="button"
              data-testid="nav-install"
              onClick={promptInstall}
              className="hidden items-center gap-1.5 rounded-md bg-[#e50914] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#f5111c] sm:flex"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          ) : null}
          <button
            type="button"
            data-testid="nav-search-trigger"
            aria-label="Search"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/5 px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-500 md:inline">
              ⌘K
            </kbd>
          </button>
          <span
            data-testid="adblock-tip"
            title="FrameXTV embeds may show ads — an ad blocker is recommended"
            className="hidden items-center gap-1.5 rounded-full border border-white/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 lg:flex"
          >
            <Shield className="h-3 w-3" />
            Adblock Recommended
          </span>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto border-t border-white/[0.07] px-4 py-2.5 scrollbar-hide md:hidden">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={linkClass}
            data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
