"use client";

import { useEffect, useRef, useState } from "react";
import { DOWNLOADS_LOCALES, normalizeDownloadsLocale } from "@/lib/downloads-translations";

export default function DownloadsLangSwitcher({ locale, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const active = DOWNLOADS_LOCALES.find((l) => l.code === normalizeDownloadsLocale(locale)) || DOWNLOADS_LOCALES[0];

  return (
    <div className="position-relative" ref={ref}>
      <button
        type="button"
        className="btn btn-sm btn-outline-light d-flex align-items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span aria-hidden>{active.flag}</span>
        <span>{active.label}</span>
      </button>
      {open ? (
        <div
          className="position-absolute end-0 mt-1 bg-white rounded shadow border py-1"
          style={{ minWidth: 140, zIndex: 1050 }}
          role="listbox"
        >
          {DOWNLOADS_LOCALES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === active.code}
              className={`dropdown-item d-flex align-items-center gap-2 ${lang.code === active.code ? "active" : ""}`}
              onClick={() => {
                onChange(lang.code);
                try {
                  localStorage.setItem("downloads-lang", lang.code);
                } catch {
                  /* ignore */
                }
                setOpen(false);
              }}
            >
              <span aria-hidden>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
