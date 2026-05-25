"use client";

import AgencyLanguageSwitcher from "@/components/AgencyLanguageSwitcher";

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
        <a href="/auth/select" className="btn agency-btn-primary agency-topbar-cta">
          {ui.navLogin || "เข้าสู่ระบบ"}
        </a>
      </div>
    </header>
  );
}
