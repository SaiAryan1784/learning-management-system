import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();

  const search = useCallback(
    debounce(async (q) => {
      if (q.length < 2) { setResults(null); setLoading(false); return; }
      try {
        setLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setResults(res.data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 280),
    []
  );

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setActiveIdx(-1);
    setOpen(true);
    if (v.length >= 2) { setLoading(true); search(v); }
    else { setResults(null); setLoading(false); }
  };

  const allItems = [
    ...(results?.courses || []).map((c) => ({ type: "course", ...c })),
    ...(results?.staff || []).map((s) => ({ type: "staff", ...s })),
  ];

  const go = (item) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    if (item.type === "course") navigate(`/dashboard/course-add/${item.id}`);
    else navigate(`/dashboard/staff-progress/${item.id}`);
  };

  const handleKey = (e) => {
    if (!open || !allItems.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) go(allItems[activeIdx]);
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border bg-canvas hover:border-emerald/40 focus-within:border-emerald/60 focus-within:bg-surface transition-all w-52 lg:w-64">
        {loading
          ? <i className="fa-solid fa-circle-notch animate-spin text-[11px] text-brand-muted" />
          : <i className="fa-solid fa-magnifying-glass text-[11px] text-brand-muted" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search courses, staff…"
          className="flex-1 bg-transparent outline-none text-xs text-brand-text placeholder-brand-muted min-w-0"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }} className="text-brand-muted hover:text-brand-text transition-colors outline-none">
            <i className="fa-solid fa-xmark text-[10px]" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 mt-1.5 w-72 bg-surface border border-brand-border/60 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {!results && loading && (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
                <i className="fa-solid fa-circle-notch animate-spin text-[11px]" /> Searching…
              </div>
            )}

            {results && allItems.length === 0 && (
              <div className="py-8 text-center">
                <i className="fa-solid fa-magnifying-glass text-brand-muted text-lg mb-2 block" />
                <p className="text-xs text-brand-muted">No results for "{query}"</p>
              </div>
            )}

            {results && results.courses?.length > 0 && (
              <div className="px-2 pt-2 pb-1">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-2 mb-1">Courses</p>
                {results.courses.map((c, idx) => (
                  <button
                    key={c.id}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => go({ type: "course", ...c })}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${activeIdx === idx ? "bg-emerald/10 text-emerald" : "hover:bg-canvas text-brand-text"}`}
                  >
                    <i className="fa-solid fa-book text-[11px] flex-shrink-0" />
                    <span className="text-[13px] truncate">{c.title}</span>
                    <span className="ml-auto text-[10px] text-brand-muted capitalize">{c.status}</span>
                  </button>
                ))}
              </div>
            )}

            {results && results.staff?.length > 0 && (
              <div className={`px-2 pb-2 ${results.courses?.length ? "border-t border-brand-border/40 pt-2" : "pt-2"}`}>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-2 mb-1">People</p>
                {results.staff.map((s, idx) => {
                  const i = (results.courses?.length || 0) + idx;
                  return (
                    <button
                      key={s.id}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go({ type: "staff", ...s })}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${activeIdx === i ? "bg-emerald/10 text-emerald" : "hover:bg-canvas text-brand-text"}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-emerald">{s.name?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-brand-muted truncate">{s.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
