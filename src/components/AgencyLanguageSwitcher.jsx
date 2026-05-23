"use client";

import { languageOptions } from "@/lib/data";

export default function AgencyLanguageSwitcher({
  currentLanguage,
  setCurrentLanguage,
  className = "",
}) {
  return (
    <div
      className={`agency-language-switcher ${className}`.trim()}
      role="group"
      aria-label="Language switcher"
    >
      {languageOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`agency-language-button ${currentLanguage === option.key ? "is-active" : ""}`}
          onClick={() => setCurrentLanguage(option.key)}
          aria-pressed={currentLanguage === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
