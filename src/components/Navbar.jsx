"use client";

import AgencyLanguageSwitcher from "@/components/AgencyLanguageSwitcher";
import { authSelectUrl } from "@/lib/data";

export default function Navbar({ ui, currentLanguage, setCurrentLanguage }) {
  return (
    <header className="agency-topbar">
      <div className="agency-topbar-actions">
        <AgencyLanguageSwitcher
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
        />
        <a href="#contact" className="agency-topbar-link">
          {ui.navContact}
        </a>
        <a
          href={authSelectUrl}
          className="btn agency-btn-primary agency-topbar-cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          {ui.navLogin || "เข้าสู่ระบบ"}
        </a>
      </div>
    </header>
  );
}
