import Image from 'next/image';
import Link from 'next/link';
import './ge-energy-tech.css';

export const metadata = {
  title: 'GE Energy Tech Co., Ltd. | Smart Energy Solutions',
  description:
    'GE Energy Tech is a leading smart energy technology company providing IoT-based power monitoring, energy management, and green technology solutions in Thailand and Asia.',
};

const SERVICES = [
  {
    icon: '⚡',
    title: 'Smart Energy Monitoring',
    desc: 'Real-time IoT power monitoring with AI-driven analytics. Track energy consumption, detect anomalies, and optimize usage across all facilities.',
    tags: ['IoT', 'Real-time', 'AI Analytics'],
    accent: 'linear-gradient(90deg, #1565c0, #0097a7)',
    iconBg: 'rgba(21,101,192,0.15)',
  },
  {
    icon: '🌱',
    title: 'Green Energy Solutions',
    desc: 'Renewable energy integration, carbon footprint tracking, and ESG reporting tools built for modern businesses committed to sustainability.',
    tags: ['Solar', 'ESG', 'Carbon Tracking'],
    accent: 'linear-gradient(90deg, #2e7d32, #43a047)',
    iconBg: 'rgba(46,125,50,0.15)',
  },
  {
    icon: '🏭',
    title: 'Industrial ERP System',
    desc: 'End-to-end enterprise resource planning covering production, HR, accounting, procurement, and executive reporting in one integrated platform.',
    tags: ['ERP', 'HR', 'Accounting'],
    accent: 'linear-gradient(90deg, #374151, #6b7280)',
    iconBg: 'rgba(107,114,128,0.15)',
  },
  {
    icon: '📡',
    title: 'MQTT & IoT Infrastructure',
    desc: 'Industrial-grade MQTT broker setup, device provisioning, and real-time data pipelines connecting edge devices to cloud dashboards.',
    tags: ['MQTT', 'Edge', 'Cloud'],
    accent: 'linear-gradient(90deg, #0097a7, #26c6da)',
    iconBg: 'rgba(0,151,167,0.15)',
  },
  {
    icon: '📊',
    title: 'Data Analytics & Reports',
    desc: 'Automated KPI dashboards, executive AI insights, and scheduled reports across all departments — delivered in Thai, English, and Korean.',
    tags: ['KPI', 'Reports', 'Multi-lang'],
    accent: 'linear-gradient(90deg, #6a1b9a, #9c27b0)',
    iconBg: 'rgba(106,27,154,0.15)',
  },
  {
    icon: '🔒',
    title: 'Secure Cloud Platform',
    desc: 'Enterprise-grade authentication, role-based access control, and encrypted data pipelines — ISO-ready security for critical infrastructure.',
    tags: ['Security', 'RBAC', 'Encrypted'],
    accent: 'linear-gradient(90deg, #b71c1c, #e53935)',
    iconBg: 'rgba(183,28,28,0.12)',
  },
];

const PILLARS = [
  { icon: '🎯', title: 'Precision Engineering', desc: 'Every system built with meticulous attention to reliability, performance, and long-term stability.' },
  { icon: '🤝', title: 'Partnership Driven', desc: 'We work closely with clients from concept to deployment, ensuring outcomes match real business goals.' },
  { icon: '🌏', title: 'Pan-Asian Reach', desc: 'Serving customers across Thailand, South Korea, and Southeast Asia with multilingual support.' },
  { icon: '🔬', title: 'R&D at the Core', desc: 'Dedicated R&D team advancing energy technology, IoT protocols, and AI analytics continuously.' },
];

const TECH = [
  { icon: '⚙️', name: 'Next.js 15', desc: 'Full-stack React framework for production-grade web applications.' },
  { icon: '🗄️', name: 'MySQL / Prisma', desc: 'Relational data management with type-safe ORM and migrations.' },
  { icon: '📶', name: 'MQTT Broker', desc: 'Industry-standard message broker for real-time device telemetry.' },
  { icon: '🤖', name: 'AI Insights Engine', desc: 'Rule-based + ML analytics for automated performance monitoring.' },
  { icon: '🐳', name: 'Docker & CI/CD', desc: 'Containerised deployments with automated build and release pipelines.' },
  { icon: '📱', name: 'Responsive PWA', desc: 'Progressive web apps working on any device, online or offline.' },
  { icon: '🔐', name: 'JWT / RBAC Auth', desc: 'Token-based authentication with granular role-level access control.' },
  { icon: '☁️', name: 'Cloud Infra', desc: 'Scalable server infrastructure designed for high-availability workloads.' },
];

const STATS = [
  { value: '500+', label: 'Devices Monitored' },
  { value: '15+', label: 'Enterprise Clients' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '3', label: 'Countries Served' },
];

export default function GeEnergyTechPage() {
  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="get-nav">
        <a href="#hero" className="get-nav-brand">
          <Image
            src="/ge-energyTech/138568-transparent.png"
            alt="GE Energy Tech logo"
            width={40}
            height={40}
            className="get-nav-logo"
            priority
          />
          <span className="get-nav-name">
            <span>GE</span> ENERGY TECH
          </span>
        </a>
        <div className="get-nav-links">
          <a href="#about">เกี่ยวกับเรา</a>
          <a href="#services">บริการ</a>
          <a href="#technology">เทคโนโลยี</a>
          <a href="#contact">ติดต่อ</a>
        </div>
        <Link href="/ge-energy-erp-login" className="get-nav-cta">
          เข้าสู่ระบบ ERP →
        </Link>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="get-hero" id="hero">
        <div className="get-hero-bg" aria-hidden />
        <div className="get-hero-grid" aria-hidden />
        <div className="get-hero-inner">
          <div className="get-hero-text">
            <p className="get-hero-tag">Smart Energy · IoT · Enterprise ERP</p>
            <h1 className="get-hero-h1">
              พลังงานอัจฉริยะ<br />
              <em>เพื่ออนาคต</em>ที่ยั่งยืน
            </h1>
            <p className="get-hero-sub">
              GE Energy Tech พัฒนาระบบมอนิเตอร์พลังงาน IoT ระดับอุตสาหกรรม
              พร้อมซอฟต์แวร์ ERP องค์กรแบบครบวงจร สำหรับธุรกิจในไทยและเอเชีย
            </p>
            <div className="get-hero-actions">
              <a href="#services" className="get-btn get-btn--primary">
                ดูบริการทั้งหมด
              </a>
              <a href="#contact" className="get-btn get-btn--ghost">
                ติดต่อเรา
              </a>
            </div>
            <div className="get-hero-stats">
              {STATS.map((s) => (
                <div key={s.label} className="get-hero-stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="get-hero-visual">
            <div className="get-hero-logo-wrap">
              <div className="get-hero-logo-ring" aria-hidden />
              <Image
                src="/ge-energyTech/138568-transparent.png"
                alt="GE Energy Tech"
                width={230}
                height={230}
                className="get-hero-logo-img"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section className="get-section get-about" id="about">
        <div className="get-container">
          <div className="get-about-grid">
            <div className="get-about-text">
              <div className="get-badge" style={{ marginBottom: 20 }}>เกี่ยวกับบริษัท</div>
              <h3>บริษัท จีอี เอเนอร์จี่ เทค จำกัด</h3>
              <p>
                ก่อตั้งขึ้นเพื่อตอบโจทย์ความต้องการด้านพลังงานสมัยใหม่
                เราเชี่ยวชาญในการออกแบบและพัฒนาระบบมอนิเตอร์พลังงานผ่าน IoT
                เชื่อมต่อกับ Cloud Platform และ AI วิเคราะห์ข้อมูลแบบ Real-time
              </p>
              <p>
                นอกจากนี้เรายังพัฒนาระบบ ERP องค์กรครบวงจร ครอบคลุมตั้งแต่ฝ่ายผลิต
                การตลาด บัญชี ทรัพยากรบุคคล วิจัยและพัฒนา ไปจนถึงรายงานผู้บริหาร
                รองรับ 3 ภาษา ไทย — อังกฤษ — เกาหลี
              </p>
            </div>
            <div className="get-about-pillars">
              {PILLARS.map((p) => (
                <div key={p.title} className="get-pillar">
                  <span className="get-pillar-icon">{p.icon}</span>
                  <div className="get-pillar-content">
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────────── */}
      <section className="get-section" id="services">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">บริการของเรา</div>
            <h2 className="get-section-h2">
              โซลูชันครบวงจร<br /><em>สำหรับทุกธุรกิจ</em>
            </h2>
            <p className="get-section-sub">
              ตั้งแต่ IoT ระดับโรงงานไปจนถึง ERP สำนักงาน — เราคือพาร์ทเนอร์เทคโนโลยีที่คุณไว้ใจได้
            </p>
          </div>
          <div className="get-services-grid">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="get-service-card"
                style={{ '--card-accent': s.accent }}
              >
                <div className="get-service-icon" style={{ '--icon-bg': s.iconBg, background: s.iconBg }}>
                  {s.icon}
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="get-service-tags">
                  {s.tags.map((tag) => (
                    <span key={tag} className="get-service-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="get-stats-banner">
        <div className="get-container">
          <div className="get-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="get-stat-item">
                <strong>{s.value}</strong>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Technology ─────────────────────────────────────────────────── */}
      <section className="get-section get-tech" id="technology">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--green">เทคโนโลยีที่ใช้</div>
            <h2 className="get-section-h2">
              สร้างด้วย<em>เทคโนโลยีชั้นนำ</em>
            </h2>
            <p className="get-section-sub">
              ทุกระบบที่เราพัฒนาใช้เครื่องมือและ Framework ที่ทันสมัย
              เชื่อถือได้ และรองรับการขยายระดับ Enterprise
            </p>
          </div>
          <div className="get-tech-grid">
            {TECH.map((t) => (
              <div key={t.name} className="get-tech-card">
                <span>{t.icon}</span>
                <strong>{t.name}</strong>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <section className="get-section get-contact" id="contact">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">ติดต่อเรา</div>
            <h2 className="get-section-h2">พร้อมเริ่มโครงการ<em>ของคุณ</em>?</h2>
          </div>
          <div className="get-contact-inner">
            <div className="get-contact-info">
              <h3>มาคุยกันได้เลย</h3>
              <p>
                ทีมงานของเราพร้อมให้คำปรึกษา ออกแบบโซลูชัน
                และประเมินราคาโดยไม่มีค่าใช้จ่าย
              </p>
              <div className="get-contact-items">
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🏢</span>
                  <div className="get-contact-item-text">
                    <strong>บริษัท</strong>
                    <span>บริษัท จีอี เอเนอร์จี่ เทค จำกัด<br />GE ENERGY TECH CO., LTD.</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">📍</span>
                  <div className="get-contact-item-text">
                    <strong>ที่อยู่</strong>
                    <span>ประเทศไทย</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌐</span>
                  <div className="get-contact-item-text">
                    <strong>ระบบ</strong>
                    <span>Energy Dashboard · ERP · IoT Platform</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌏</span>
                  <div className="get-contact-item-text">
                    <strong>ภาษา</strong>
                    <span>ไทย · English · 한국어</span>
                  </div>
                </div>
              </div>
            </div>
            <form className="get-contact-form">
              <h4>ส่งข้อความถึงเรา</h4>
              <div className="get-form-field">
                <label>ชื่อ – Name</label>
                <input type="text" placeholder="ชื่อของคุณ / Your name" />
              </div>
              <div className="get-form-field">
                <label>อีเมล – Email</label>
                <input type="email" placeholder="email@company.com" />
              </div>
              <div className="get-form-field">
                <label>หัวข้อ – Subject</label>
                <input type="text" placeholder="สนใจบริการ / Service inquiry" />
              </div>
              <div className="get-form-field">
                <label>รายละเอียด – Message</label>
                <textarea placeholder="รายละเอียดโครงการหรือคำถามของคุณ…" />
              </div>
              <button type="submit" className="get-btn get-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                ส่งข้อความ →
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="get-footer">
        <div className="get-container">
          <div className="get-footer-inner">
            <div className="get-footer-brand">
              <Image
                src="/ge-energyTech/138568-transparent.png"
                alt="GE Energy Tech"
                width={48}
                height={48}
              />
              <h4>GE ENERGY TECH CO., LTD.</h4>
              <p>
                Smart energy solutions powered by IoT, AI, and enterprise software.
                Serving businesses across Thailand and Asia.
              </p>
            </div>
            <div className="get-footer-col">
              <h5>บริการ</h5>
              <ul>
                <li><a href="#services">Energy Monitoring</a></li>
                <li><a href="#services">ERP System</a></li>
                <li><a href="#services">IoT Infrastructure</a></li>
                <li><a href="#services">Data Analytics</a></li>
              </ul>
            </div>
            <div className="get-footer-col">
              <h5>ระบบ</h5>
              <ul>
                <li><Link href="/ge-energy-erp-login">ERP Login</Link></li>
                <li><Link href="/energy-dashboard-login">Energy Dashboard</Link></li>
                <li><Link href="/auth/select">All Portals</Link></li>
                <li><Link href="/">Home</Link></li>
              </ul>
            </div>
          </div>
          <div className="get-footer-bottom">
            <p>© {new Date().getFullYear()} GE Energy Tech Co., Ltd. All rights reserved.</p>
            <div className="get-footer-bottom-links">
              <a href="#about">Privacy</a>
              <a href="#about">Terms</a>
              <Link href="/auth/select">Portals</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
