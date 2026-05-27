import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'GE ENERGY TECH CO.,LTD | Corporate Profile',
  description:
    'GE ENERGY TECH corporate website: engineering capabilities, ESG-focused innovation, and enterprise-grade energy technology services.',
};

const capabilities = [
  {
    title: 'Energy Engineering & EPC',
    detail:
      'Turnkey planning, implementation, and commissioning for industrial energy systems with strict project governance and safety standards.',
  },
  {
    title: 'Digital Monitoring & AI Insights',
    detail:
      'Realtime operational dashboards, predictive diagnostics, and executive analytics for data-driven decisions.',
  },
  {
    title: 'Sustainability & Compliance',
    detail:
      'Carbon-aware optimization, energy efficiency programs, and auditable reporting aligned with corporate ESG objectives.',
  },
];

const trustSignals = [
  'Professional project delivery workflow with measurable milestones',
  'Transparent reporting model for management and operations teams',
  'Cross-functional specialists covering production, accounting, HR, and R&D',
  'Secure enterprise platform architecture with role-based access',
];

const stats = [
  { value: '24/7', label: 'Monitoring readiness' },
  { value: '99.9%', label: 'System reliability target' },
  { value: 'ISO-aligned', label: 'Process framework' },
  { value: '100%', label: 'Traceable KPI reporting' },
];

export default function GeEnergyTechPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>GE ENERGY TECH CO.,LTD</p>
            <h1>Trusted Energy Technology Partner for Enterprise Growth</h1>
            <p>
              We deliver industrial energy solutions that combine engineering excellence,
              operational transparency, and digital intelligence for sustainable long-term value.
            </p>
            <div className={styles.heroActions}>
              <Link href="/ge-energy-erp-login" className={styles.primaryBtn}>
                Access Enterprise ERP
              </Link>
              <Link href="/auth/select" className={styles.secondaryBtn}>
                Client Portals
              </Link>
            </div>
          </div>
          <div className={styles.logoCard}>
            <Image
              src="/ge-energyTech/138568-transparent.png"
              alt="GE Energy Tech logo"
              width={360}
              height={250}
              className={styles.logo}
              priority
            />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>Company Overview</h2>
          <p>
            GE ENERGY TECH is focused on helping organizations modernize energy operations through
            integrated engineering services, intelligent monitoring platforms, and accountable
            management systems. Our approach emphasizes reliability, safety, and measurable business outcomes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Core Capabilities</h2>
          <div className={styles.cardGrid}>
            {capabilities.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Why Organizations Trust Us</h2>
          <ul className={styles.list}>
            {trustSignals.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Performance Framework</h2>
          <div className={styles.statGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section + ' ' + styles.cta}>
          <h2>Let&apos;s Build Reliable Energy Operations Together</h2>
          <p>
            Connect with our team for enterprise implementation planning, KPI architecture,
            and executive-ready reporting.
          </p>
          <a href="mailto:contact@geenergytech.co" className={styles.primaryBtn}>
            contact@geenergytech.co
          </a>
        </section>
      </main>
    </div>
  );
}
