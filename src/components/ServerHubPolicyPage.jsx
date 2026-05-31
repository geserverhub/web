"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AgencyLanguageSwitcher from "@/components/AgencyLanguageSwitcher";
import { languageStorageKey, supportedLanguages } from "@/lib/data";
import {
  SERVERHUB_POLICY_LAST_UPDATED,
  getServerHubPolicyCopy,
} from "@/lib/serverhub-policy-content";

export default function ServerHubPolicyPage() {
  const [lang, setLang] = useState("th");

  useEffect(() => {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (saved && supportedLanguages.includes(saved)) {
      setLang(saved);
    }
  }, []);

  const t = useMemo(() => getServerHubPolicyCopy(lang), [lang]);

  function handleLangChange(code) {
    setLang(code);
    window.localStorage.setItem(languageStorageKey, code);
    document.documentElement.lang = code;
  }

  return (
    <div className="hub-policy-page">
      <header className="hub-policy-header">
        <Link href="/" className="hub-policy-brand">
          <img src="/logo-mark.svg" alt="GE SERVER HUB" width={40} height={40} />
          <span>GE SERVER HUB</span>
        </Link>
        <AgencyLanguageSwitcher
          currentLanguage={lang}
          setCurrentLanguage={handleLangChange}
        />
      </header>

      <main className="hub-policy-main">
        <p className="hub-policy-meta">
          {t.lastUpdatedLabel}: {SERVERHUB_POLICY_LAST_UPDATED}
        </p>
        <h1>{t.title}</h1>
        <p className="hub-policy-subtitle">{t.subtitle}</p>
        <p className="hub-policy-intro">{t.intro}</p>

        {t.sections.map((section) => (
          <section key={section.heading} className="hub-policy-section">
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.contact ? (
              <address className="hub-policy-contact">
                <strong>{t.contactCompany}</strong>
                <br />
                {t.addressLabel}: {t.address}
                <br />
                {t.emailLabel}:{" "}
                <a href={`mailto:${t.contactEmail}`}>{t.contactEmail}</a>
                <br />
                {t.phoneLabel}:{" "}
                <a href={`tel:${t.contactPhone.replace(/\s/g, "")}`}>{t.contactPhone}</a>
              </address>
            ) : null}
          </section>
        ))}

        <p className="hub-policy-back">
          <Link href="/">{t.backHome}</Link>
        </p>
      </main>

      <footer className="hub-policy-footer">
        <span>© 2026 GE SERVER HUB (GOEUN)</span>
      </footer>
    </div>
  );
}
