"use client";

export default function Navbar({ ui, query, setQuery }) {
  return (
    <header className="agency-topbar">
      <div className="agency-topbar-search">
        <svg
          className="agency-topbar-search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ui.searchPlaceholder || "พิมพ์ชื่อบริษัท"}
          aria-label="ค้นหา"
        />
      </div>

      <div className="agency-topbar-actions">
        <a href="#contact" className="agency-topbar-link">
          {ui.navContact}
        </a>
      </div>
    </header>
  );
}
