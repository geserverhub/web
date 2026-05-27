'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';

const LANGUAGE_OPTIONS = [
  { code: 'th', label: 'ไทย' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-tw', label: '繁體中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

const TRANSLATIONS = {
  th: {
    nav: { about: 'เกี่ยวกับเรา', services: 'บริการ', technology: 'เทคโนโลยี', contact: 'ติดต่อ', erp: 'เข้าสู่ระบบ ERP →' },
    hero: {
      tag: 'พลังงานอัจฉริยะ · IoT · ERP องค์กร',
      title1: 'พลังงานอัจฉริยะ',
      title2: 'เพื่ออนาคต',
      title3: 'ที่ยั่งยืน',
      sub: 'GE Energy Tech พัฒนาระบบมอนิเตอร์พลังงาน IoT ระดับอุตสาหกรรม พร้อมซอฟต์แวร์ ERP องค์กรครบวงจร สำหรับธุรกิจในไทยและเอเชีย',
      cta1: 'ดูบริการทั้งหมด',
      cta2: 'ติดต่อเรา',
      stats: ['อุปกรณ์ที่มอนิเตอร์', 'ลูกค้าองค์กร', 'การันตี uptime', 'ประเทศที่ให้บริการ'],
    },
    about: {
      badge: 'เกี่ยวกับบริษัท',
      title: 'บริษัท จีอี เอเนอร์จี่ เทค จำกัด',
      p1: 'เราเชี่ยวชาญด้านระบบพลังงานอัจฉริยะ การเชื่อมต่อ IoT และการวิเคราะห์ข้อมูลแบบเรียลไทม์ เพื่อยกระดับประสิทธิภาพพลังงานให้ธุรกิจ',
      p2: 'แพลตฟอร์ม ERP ของเรารองรับการใช้งานระดับองค์กร ครอบคลุมฝ่ายผลิต บัญชี HR การเงิน และรายงานผู้บริหาร รองรับหลายภาษาในระบบเดียว',
      pillars: [
        { icon: '🎯', title: 'วิศวกรรมแม่นยำ', desc: 'ออกแบบระบบเน้นความเสถียร เชื่อถือได้ และทำงานต่อเนื่องระยะยาว' },
        { icon: '🤝', title: 'พาร์ทเนอร์ธุรกิจ', desc: 'ทำงานร่วมกับลูกค้าตั้งแต่การวางแผนจนถึงใช้งานจริง' },
        { icon: '🌏', title: 'รองรับระดับภูมิภาค', desc: 'รองรับการใช้งานหลายประเทศและหลายภาษาในเอเชีย' },
        { icon: '🔬', title: 'ขับเคลื่อนด้วย R&D', desc: 'พัฒนานวัตกรรม IoT และ AI อย่างต่อเนื่อง' },
      ],
    },
    services: {
      badge: 'บริการของเรา',
      title: ['โซลูชันครบวงจร', 'สำหรับทุกธุรกิจ'],
      sub: 'ตั้งแต่ IoT โรงงานจนถึง ERP สำนักงาน เราคือพาร์ทเนอร์เทคโนโลยีที่ธุรกิจไว้วางใจ',
    },
    tech: {
      badge: 'เทคโนโลยีที่ใช้',
      title: ['สร้างด้วย', 'เทคโนโลยีชั้นนำ'],
      sub: 'ออกแบบบนเทคโนโลยีทันสมัย รองรับการขยายระบบระดับ Enterprise',
    },
    contact: {
      badge: 'ติดต่อเรา',
      title: ['พร้อมเริ่มโครงการ', 'ของคุณ?'],
      head: 'มาคุยกันได้เลย',
      sub: 'ทีมงานพร้อมให้คำปรึกษา ออกแบบโซลูชัน และประเมินงบประมาณให้โดยไม่มีค่าใช้จ่าย',
      company: 'บริษัท',
      address: 'ที่อยู่',
      systems: 'ระบบ',
      languages: 'ภาษา',
      formTitle: 'ส่งข้อความถึงเรา',
      name: 'ชื่อ – Name',
      email: 'อีเมล – Email',
      subject: 'หัวข้อ – Subject',
      message: 'รายละเอียด – Message',
      submit: 'ส่งข้อความ →',
      placeholders: ['ชื่อของคุณ / Your name', 'email@company.com', 'สนใจบริการ / Service inquiry', 'รายละเอียดโครงการหรือคำถามของคุณ…'],
    },
    footer: { services: 'บริการ', systems: 'ระบบ', rights: 'สงวนลิขสิทธิ์', privacy: 'ความเป็นส่วนตัว', terms: 'เงื่อนไข', portals: 'พอร์ทัลทั้งหมด' },
  },
  en: {
    nav: { about: 'About', services: 'Services', technology: 'Technology', contact: 'Contact', erp: 'ERP Login →' },
    hero: {
      tag: 'Smart Energy · IoT · Enterprise ERP',
      title1: 'Smart Energy',
      title2: 'for a',
      title3: 'Sustainable Future',
      sub: 'GE Energy Tech delivers industrial IoT energy monitoring and enterprise ERP software for modern businesses across Thailand and Asia.',
      cta1: 'Explore Services',
      cta2: 'Contact Us',
      stats: ['Devices Monitored', 'Enterprise Clients', 'Uptime Guarantee', 'Countries Served'],
    },
    about: {
      badge: 'About Company',
      title: 'GE Energy Tech Co., Ltd.',
      p1: 'We specialize in smart energy systems, IoT connectivity, and real-time analytics to help organizations improve energy efficiency and operational visibility.',
      p2: 'Our integrated ERP platform supports production, accounting, HR, finance, and executive reporting in one enterprise-ready ecosystem.',
      pillars: [
        { icon: '🎯', title: 'Precision Engineering', desc: 'Built for reliability, stability, and long-term performance.' },
        { icon: '🤝', title: 'Trusted Partnership', desc: 'We collaborate from planning through deployment and support.' },
        { icon: '🌏', title: 'Regional Scale', desc: 'Designed for multi-country and multilingual operations in Asia.' },
        { icon: '🔬', title: 'R&D Driven', desc: 'Continuous innovation in IoT, AI, and energy technology.' },
      ],
    },
    services: {
      badge: 'Our Services',
      title: ['Integrated Solutions', 'for Every Business'],
      sub: 'From factory-grade IoT to enterprise ERP, we build trusted digital infrastructure.',
    },
    tech: {
      badge: 'Technology Stack',
      title: ['Built with', 'Leading Technologies'],
      sub: 'Modern architecture engineered for secure, scalable enterprise operations.',
    },
    contact: {
      badge: 'Contact',
      title: ['Ready to Start', 'Your Project?'],
      head: 'Let us talk',
      sub: 'Our team is ready to consult, design, and estimate your project with no upfront fee.',
      company: 'Company',
      address: 'Address',
      systems: 'Systems',
      languages: 'Languages',
      formTitle: 'Send us a message',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      submit: 'Send Message →',
      placeholders: ['Your name', 'email@company.com', 'Service inquiry', 'Tell us about your project...'],
    },
    footer: { services: 'Services', systems: 'Systems', rights: 'All rights reserved.', privacy: 'Privacy', terms: 'Terms', portals: 'Portals' },
  },
};

const FALLBACK_LANG = 'en';
const CLONED_LANGS = ['zh', 'vi', 'ko', 'ja', 'zh-tw', 'ms'];
for (const code of CLONED_LANGS) {
  TRANSLATIONS[code] = {
    ...TRANSLATIONS.en,
    nav: { ...TRANSLATIONS.en.nav },
    hero: { ...TRANSLATIONS.en.hero },
    about: {
      ...TRANSLATIONS.en.about,
      pillars: [...TRANSLATIONS.en.about.pillars],
    },
    services: { ...TRANSLATIONS.en.services },
    tech: { ...TRANSLATIONS.en.tech },
    contact: { ...TRANSLATIONS.en.contact },
    footer: { ...TRANSLATIONS.en.footer },
  };
}

const LANGUAGE_OVERRIDES = {
  zh: {
    nav: { about: '关于我们', services: '服务', technology: '技术', contact: '联系', erp: 'ERP 登录 →' },
    hero: {
      tag: '智慧能源 · IoT · 企业 ERP',
      title1: '智慧能源',
      title2: '迈向',
      title3: '可持续未来',
      cta1: '查看服务',
      cta2: '联系我们',
      stats: ['监控设备', '企业客户', '可用性保障', '服务国家'],
    },
    services: { badge: '我们的服务', title: ['一体化解决方案', '适用于各类企业'] },
    tech: { badge: '技术栈', title: ['采用', '领先技术'] },
    contact: { badge: '联系', title: ['准备开始', '您的项目？'], head: '欢迎咨询', submit: '发送消息 →' },
    footer: { services: '服务', systems: '系统', rights: '版权所有。', privacy: '隐私', terms: '条款', portals: '门户' },
  },
  vi: {
    nav: { about: 'Giới thiệu', services: 'Dịch vụ', technology: 'Công nghệ', contact: 'Liên hệ', erp: 'Đăng nhập ERP →' },
    hero: {
      tag: 'Năng lượng thông minh · IoT · ERP doanh nghiệp',
      title1: 'Năng lượng thông minh',
      title2: 'cho một',
      title3: 'tương lai bền vững',
      cta1: 'Xem dịch vụ',
      cta2: 'Liên hệ',
      stats: ['Thiết bị giám sát', 'Khách hàng doanh nghiệp', 'Cam kết uptime', 'Quốc gia phục vụ'],
    },
    services: { badge: 'Dịch vụ của chúng tôi', title: ['Giải pháp tích hợp', 'cho mọi doanh nghiệp'] },
    tech: { badge: 'Công nghệ sử dụng', title: ['Xây dựng bằng', 'công nghệ hàng đầu'] },
    contact: { badge: 'Liên hệ', title: ['Sẵn sàng bắt đầu', 'dự án của bạn?'], head: 'Hãy trao đổi với chúng tôi', submit: 'Gửi tin nhắn →' },
    footer: { services: 'Dịch vụ', systems: 'Hệ thống', rights: 'Mọi quyền được bảo lưu.', privacy: 'Quyền riêng tư', terms: 'Điều khoản', portals: 'Cổng hệ thống' },
  },
  ko: {
    nav: { about: '회사 소개', services: '서비스', technology: '기술', contact: '문의', erp: 'ERP 로그인 →' },
    hero: {
      tag: '스마트 에너지 · IoT · 엔터프라이즈 ERP',
      title1: '스마트 에너지',
      title2: '지속가능한',
      title3: '미래를 위해',
      cta1: '서비스 보기',
      cta2: '문의하기',
      stats: ['모니터링 장치', '기업 고객', '가동률 보장', '서비스 국가'],
    },
    services: { badge: '서비스', title: ['통합 솔루션', '모든 비즈니스를 위해'] },
    tech: { badge: '기술 스택', title: ['최신', '핵심 기술로 구축'] },
    contact: { badge: '문의', title: ['프로젝트를', '시작할 준비가 되셨나요?'], head: '지금 상담해 보세요', submit: '메시지 보내기 →' },
    footer: { services: '서비스', systems: '시스템', rights: '모든 권리 보유.', privacy: '개인정보', terms: '이용약관', portals: '포털' },
  },
  ja: {
    nav: { about: '会社情報', services: 'サービス', technology: '技術', contact: 'お問い合わせ', erp: 'ERP ログイン →' },
    hero: {
      tag: 'スマートエネルギー · IoT · 企業ERP',
      title1: 'スマートエネルギー',
      title2: '持続可能な',
      title3: '未来へ',
      cta1: 'サービスを見る',
      cta2: 'お問い合わせ',
      stats: ['監視デバイス', '法人顧客', '稼働率保証', '提供国'],
    },
    services: { badge: 'サービス', title: ['統合ソリューション', 'あらゆる企業向け'] },
    tech: { badge: '技術スタック', title: ['先進', 'テクノロジーで構築'] },
    contact: { badge: 'お問い合わせ', title: ['プロジェクトを', '始めませんか？'], head: 'まずはご相談ください', submit: '送信する →' },
    footer: { services: 'サービス', systems: 'システム', rights: '無断転載禁止。', privacy: 'プライバシー', terms: '利用規約', portals: 'ポータル' },
  },
  'zh-tw': {
    nav: { about: '關於我們', services: '服務', technology: '技術', contact: '聯絡', erp: 'ERP 登入 →' },
    hero: {
      tag: '智慧能源 · IoT · 企業 ERP',
      title1: '智慧能源',
      title2: '邁向',
      title3: '永續未來',
      cta1: '查看服務',
      cta2: '聯絡我們',
      stats: ['監控設備', '企業客戶', '可用性保證', '服務國家'],
    },
    services: { badge: '我們的服務', title: ['整合解決方案', '適用各類企業'] },
    tech: { badge: '技術架構', title: ['採用', '領先技術'] },
    contact: { badge: '聯絡', title: ['準備開始', '您的專案？'], head: '歡迎與我們洽談', submit: '送出訊息 →' },
    footer: { services: '服務', systems: '系統', rights: '版權所有。', privacy: '隱私', terms: '條款', portals: '入口' },
  },
  ms: {
    nav: { about: 'Tentang', services: 'Perkhidmatan', technology: 'Teknologi', contact: 'Hubungi', erp: 'Log Masuk ERP →' },
    hero: {
      tag: 'Tenaga Pintar · IoT · ERP Perusahaan',
      title1: 'Tenaga Pintar',
      title2: 'untuk masa depan',
      title3: 'yang mampan',
      cta1: 'Lihat Perkhidmatan',
      cta2: 'Hubungi Kami',
      stats: ['Peranti Dipantau', 'Pelanggan Korporat', 'Jaminan Uptime', 'Negara Dilayan'],
    },
    services: { badge: 'Perkhidmatan Kami', title: ['Penyelesaian Bersepadu', 'untuk setiap perniagaan'] },
    tech: { badge: 'Teknologi', title: ['Dibina dengan', 'teknologi terkemuka'] },
    contact: { badge: 'Hubungi', title: ['Bersedia mulakan', 'projek anda?'], head: 'Mari berbincang', submit: 'Hantar Mesej →' },
    footer: { services: 'Perkhidmatan', systems: 'Sistem', rights: 'Hak cipta terpelihara.', privacy: 'Privasi', terms: 'Terma', portals: 'Portal' },
  },
};

for (const [code, override] of Object.entries(LANGUAGE_OVERRIDES)) {
  const base = TRANSLATIONS[code];
  if (!base) continue;
  TRANSLATIONS[code] = {
    ...base,
    ...override,
    nav: { ...base.nav, ...(override.nav || {}) },
    hero: { ...base.hero, ...(override.hero || {}) },
    about: { ...base.about, ...(override.about || {}) },
    services: { ...base.services, ...(override.services || {}) },
    tech: { ...base.tech, ...(override.tech || {}) },
    contact: { ...base.contact, ...(override.contact || {}) },
    footer: { ...base.footer, ...(override.footer || {}) },
  };
}

const SERVICES = [
  { icon: '⚡', title: 'Smart Energy Monitoring', desc: 'Real-time IoT power monitoring with AI-driven analytics for anomaly detection and optimization.', tags: ['IoT', 'Real-time', 'AI Analytics'], accent: 'linear-gradient(90deg, #1565c0, #0097a7)', iconBg: 'rgba(21,101,192,0.15)' },
  { icon: '🌱', title: 'Green Energy Solutions', desc: 'Renewable energy integration, carbon tracking, and ESG reporting for sustainability goals.', tags: ['Solar', 'ESG', 'Carbon Tracking'], accent: 'linear-gradient(90deg, #2e7d32, #43a047)', iconBg: 'rgba(46,125,50,0.15)' },
  { icon: '🏭', title: 'Industrial ERP System', desc: 'Comprehensive ERP for production, HR, accounting, procurement, and executive dashboards.', tags: ['ERP', 'HR', 'Accounting'], accent: 'linear-gradient(90deg, #374151, #6b7280)', iconBg: 'rgba(107,114,128,0.15)' },
  { icon: '📡', title: 'MQTT & IoT Infrastructure', desc: 'Industrial MQTT setup, secure device onboarding, and cloud-connected telemetry pipelines.', tags: ['MQTT', 'Edge', 'Cloud'], accent: 'linear-gradient(90deg, #0097a7, #26c6da)', iconBg: 'rgba(0,151,167,0.15)' },
  { icon: '📊', title: 'Data Analytics & Reports', desc: 'Automated KPI dashboards and executive insights for faster and better business decisions.', tags: ['KPI', 'Reports', 'BI'], accent: 'linear-gradient(90deg, #6a1b9a, #9c27b0)', iconBg: 'rgba(106,27,154,0.15)' },
  { icon: '🔒', title: 'Secure Cloud Platform', desc: 'Enterprise-grade access control, encryption, and secure architecture for critical workloads.', tags: ['Security', 'RBAC', 'Encrypted'], accent: 'linear-gradient(90deg, #b71c1c, #e53935)', iconBg: 'rgba(183,28,28,0.12)' },
];

const TECH = [
  { icon: '⚙️', name: 'Next.js 15', desc: 'Full-stack React framework for production-grade applications.' },
  { icon: '🗄️', name: 'MySQL / Prisma', desc: 'Relational data platform with migrations and schema governance.' },
  { icon: '📶', name: 'MQTT Broker', desc: 'Reliable real-time telemetry and event streaming for IoT devices.' },
  { icon: '🤖', name: 'AI Insights Engine', desc: 'Automated monitoring and insight generation from operational data.' },
  { icon: '🐳', name: 'Docker & CI/CD', desc: 'Containerized release pipelines with repeatable deployments.' },
  { icon: '📱', name: 'Responsive Web App', desc: 'Optimized interface for desktop, tablet, and mobile.' },
  { icon: '🔐', name: 'JWT / RBAC Auth', desc: 'Token authentication with granular role-based permissions.' },
  { icon: '☁️', name: 'Cloud Infrastructure', desc: 'Scalable and resilient architecture for enterprise reliability.' },
];

const STATS = ['500+', '15+', '99.9%', '3'];

export default function GeEnergyTechClientPage() {
  const [lang, setLang] = useState('th');

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && LANGUAGE_OPTIONS.some((item) => item.code === stored)) {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS[FALLBACK_LANG], [lang]);

  return (
    <>
      <nav className="get-nav">
        <a href="#hero" className="get-nav-brand">
          <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech logo" width={40} height={40} className="get-nav-logo" priority />
          <span className="get-nav-name">
            <span>GE</span> ENERGY TECH
          </span>
        </a>
        <div className="get-nav-links">
          <a href="#about">{t.nav.about}</a>
          <a href="#services">{t.nav.services}</a>
          <a href="#technology">{t.nav.technology}</a>
          <a href="#contact">{t.nav.contact}</a>
        </div>
        <Link href="/ge-energy-erp-login" className="get-nav-cta">
          {t.nav.erp}
        </Link>
      </nav>

      <section className="get-lang-switch">
        <div className="get-container">
          <div className="get-lang-switch-inner">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`get-lang-btn ${lang === option.code ? 'is-active' : ''}`}
                onClick={() => setLang(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="get-hero" id="hero">
        <div className="get-hero-bg" aria-hidden />
        <div className="get-hero-grid" aria-hidden />
        <div className="get-hero-inner">
          <div className="get-hero-text">
            <p className="get-hero-tag">{t.hero.tag}</p>
            <h1 className="get-hero-h1">
              {t.hero.title1}
              <br />
              <em>{t.hero.title2}</em> {t.hero.title3}
            </h1>
            <p className="get-hero-sub">{t.hero.sub}</p>
            <div className="get-hero-actions">
              <a href="#services" className="get-btn get-btn--primary">
                {t.hero.cta1}
              </a>
              <a href="#contact" className="get-btn get-btn--ghost">
                {t.hero.cta2}
              </a>
            </div>
            <div className="get-hero-stats">
              {STATS.map((value, index) => (
                <div key={value} className="get-hero-stat">
                  <strong>{value}</strong>
                  <span>{t.hero.stats[index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="get-hero-visual">
            <div className="get-hero-logo-wrap">
              <div className="get-hero-logo-ring" aria-hidden />
              <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech" width={230} height={230} className="get-hero-logo-img" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="get-section get-about" id="about">
        <div className="get-container">
          <div className="get-about-grid">
            <div className="get-about-text">
              <div className="get-badge" style={{ marginBottom: 20 }}>{t.about.badge}</div>
              <h3>{t.about.title}</h3>
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
            </div>
            <div className="get-about-pillars">
              {t.about.pillars.map((pillar) => (
                <div key={pillar.title} className="get-pillar">
                  <span className="get-pillar-icon">{pillar.icon}</span>
                  <div className="get-pillar-content">
                    <h4>{pillar.title}</h4>
                    <p>{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="get-section" id="services">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">{t.services.badge}</div>
            <h2 className="get-section-h2">
              {t.services.title[0]}
              <br />
              <em>{t.services.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.services.sub}</p>
          </div>
          <div className="get-services-grid">
            {SERVICES.map((service) => (
              <div key={service.title} className="get-service-card" style={{ '--card-accent': service.accent }}>
                <div className="get-service-icon" style={{ '--icon-bg': service.iconBg, background: service.iconBg }}>
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <div className="get-service-tags">
                  {service.tags.map((tag) => (
                    <span key={tag} className="get-service-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="get-stats-banner">
        <div className="get-container">
          <div className="get-stats-grid">
            {STATS.map((value, index) => (
              <div key={value} className="get-stat-item">
                <strong>{value}</strong>
                <p>{t.hero.stats[index]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="get-section get-tech" id="technology">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--green">{t.tech.badge}</div>
            <h2 className="get-section-h2">
              {t.tech.title[0]} <em>{t.tech.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.tech.sub}</p>
          </div>
          <div className="get-tech-grid">
            {TECH.map((techItem) => (
              <div key={techItem.name} className="get-tech-card">
                <span>{techItem.icon}</span>
                <strong>{techItem.name}</strong>
                <p>{techItem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="get-section get-contact" id="contact">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">{t.contact.badge}</div>
            <h2 className="get-section-h2">
              {t.contact.title[0]} <em>{t.contact.title[1]}</em>
            </h2>
          </div>
          <div className="get-contact-inner">
            <div className="get-contact-info">
              <h3>{t.contact.head}</h3>
              <p>{t.contact.sub}</p>
              <div className="get-contact-items">
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🏢</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.company}</strong>
                    <span>GE ENERGY TECH CO., LTD.</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">📍</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.address}</strong>
                    <span>Thailand</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌐</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.systems}</strong>
                    <span>Energy Dashboard · ERP · IoT Platform</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌏</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.languages}</strong>
                    <span>ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu</span>
                  </div>
                </div>
              </div>
            </div>
            <form className="get-contact-form">
              <h4>{t.contact.formTitle}</h4>
              <div className="get-form-field">
                <label>{t.contact.name}</label>
                <input type="text" placeholder={t.contact.placeholders[0]} />
              </div>
              <div className="get-form-field">
                <label>{t.contact.email}</label>
                <input type="email" placeholder={t.contact.placeholders[1]} />
              </div>
              <div className="get-form-field">
                <label>{t.contact.subject}</label>
                <input type="text" placeholder={t.contact.placeholders[2]} />
              </div>
              <div className="get-form-field">
                <label>{t.contact.message}</label>
                <textarea placeholder={t.contact.placeholders[3]} />
              </div>
              <button type="submit" className="get-btn get-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                {t.contact.submit}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="get-footer">
        <div className="get-container">
          <div className="get-footer-inner">
            <div className="get-footer-brand">
              <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech" width={48} height={48} />
              <h4>GE ENERGY TECH CO., LTD.</h4>
              <p>Smart energy solutions powered by IoT, AI, and enterprise software.</p>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.services}</h5>
              <ul>
                <li><a href="#services">Energy Monitoring</a></li>
                <li><a href="#services">ERP System</a></li>
                <li><a href="#services">IoT Infrastructure</a></li>
                <li><a href="#services">Data Analytics</a></li>
              </ul>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.systems}</h5>
              <ul>
                <li><Link href="/ge-energy-erp-login">ERP Login</Link></li>
                <li><Link href="/energy-dashboard-login">Energy Dashboard</Link></li>
                <li><Link href="/auth/select">{t.footer.portals}</Link></li>
                <li><Link href="/">Home</Link></li>
              </ul>
            </div>
          </div>
          <div className="get-footer-bottom">
            <p>© {new Date().getFullYear()} GE Energy Tech Co., Ltd. {t.footer.rights}</p>
            <div className="get-footer-bottom-links">
              <a href="#about">{t.footer.privacy}</a>
              <a href="#about">{t.footer.terms}</a>
              <Link href="/auth/select">{t.footer.portals}</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
