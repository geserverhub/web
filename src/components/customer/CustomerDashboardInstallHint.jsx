'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function CustomerDashboardInstallHint({ locale = 'th' }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const t = {
    th: {
      title: 'ติดตั้งแอป Momoge space',
      body: 'เพิ่มไปหน้าจอโฮมเพื่อเปิดแบบแอปเต็มจอ',
      install: 'ติดตั้ง',
      dismiss: 'ไว้ทีหลัง',
    },
    en: {
      title: 'Install Momoge space',
      body: 'Add to your home screen for a full-screen app experience',
      install: 'Install',
      dismiss: 'Not now',
    },
    ko: {
      title: 'Momoge space 앱 설치',
      body: '홈 화면에 추가하여 전체 화면으로 사용하세요',
      install: '설치',
      dismiss: '나중에',
    },
  }[locale] || {
    title: 'ติดตั้งแอป Momoge space',
    body: 'เพิ่มไปหน้าจอโฮมเพื่อเปิดแบบแอปเต็มจอ',
    install: 'ติดตั้ง',
    dismiss: 'ไว้ทีหลัง',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('cd_pwa_install_dismissed') === '1') {
      setDismissed(true);
      return;
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (dismissed || !promptEvent) return null;

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  function handleDismiss() {
    localStorage.setItem('cd_pwa_install_dismissed', '1');
    setDismissed(true);
    setPromptEvent(null);
  }

  return (
    <div className="cdl-install-hint" role="region" aria-label={t.title}>
      <div className="cdl-install-hint__icon">
        <Download size={18} aria-hidden />
      </div>
      <div className="cdl-install-hint__text">
        <strong>{t.title}</strong>
        <span>{t.body}</span>
      </div>
      <button type="button" className="cdl-install-hint__btn" onClick={handleInstall}>
        {t.install}
      </button>
      <button type="button" className="cdl-install-hint__close" onClick={handleDismiss} aria-label={t.dismiss}>
        <X size={16} />
      </button>
    </div>
  );
}
