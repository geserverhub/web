'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GEET_LANG_OPTIONS,
  readGeetLang,
  writeGeetLang,
} from '@/lib/ge-energy-tech/customer-tools-i18n';
import {
  PRIVACY_LAST_UPDATED,
  geetCompanyAddress,
  getPrivacyPolicyCopy,
} from '@/lib/ge-energy-tech/privacy-policy-content';

export default function PrivacyPolicyPage({ homeHref = '/ge-energy-tech' }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    setLang(readGeetLang());
  }, []);

  const t = useMemo(() => getPrivacyPolicyCopy(lang), [lang]);
  const address = useMemo(() => geetCompanyAddress(lang), [lang]);

  function handleLangChange(code) {
    setLang(code);
    writeGeetLang(code);
  }

  return (
    <div className="get-privacy-page">
      <header className="get-privacy-header">
        <Link href={homeHref} className="get-privacy-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt="GE Energy Tech"
            width={36}
            height={36}
          />
          <span>GE ENERGY TECH</span>
        </Link>
        <div className="get-privacy-lang">
          {GEET_LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              className={lang === opt.code ? 'active' : ''}
              onClick={() => handleLangChange(opt.code)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <main className="get-privacy-main">
        <p className="get-privacy-meta">
          {t.lastUpdatedLabel}: {PRIVACY_LAST_UPDATED}
        </p>
        <h1>{t.title}</h1>
        <p className="get-privacy-subtitle">{t.subtitle}</p>
        <p className="get-privacy-intro">{t.intro}</p>

        {t.sections.map((section) => (
          <section key={section.heading} className="get-privacy-section">
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
              <address className="get-privacy-contact">
                <p>
                  <strong>{t.contactCompany}</strong>
                </p>
                <p>
                  {t.emailLabel}:{' '}
                  <a href={`mailto:${t.contactEmail}`}>{t.contactEmail}</a>
                </p>
                <p>
                  {t.addressLabel}: {address}
                </p>
              </address>
            ) : null}
          </section>
        ))}

        <p className="get-privacy-back">
          <Link href={homeHref}>{t.backHome}</Link>
        </p>
      </main>

      <footer className="get-privacy-footer">
        <p>© {new Date().getFullYear()} GE Energy Tech Co., Ltd.</p>
      </footer>
    </div>
  );
}
