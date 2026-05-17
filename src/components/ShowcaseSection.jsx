import { statusClassName } from "@/lib/data";

export default function ShowcaseSection({ ui, filteredClients }) {
  return (
    <section className="agency-section agency-section-light" id="showcase">
      <div className="container-xxl agency-shell">
        <div className="agency-section-shell agency-section-shell-glow">
          <div className="section-intro text-center" data-reveal>
            <h2 className="section-title">{ui.showcaseTitle}</h2>
            <p className="section-subtitle">{ui.showcaseSubtitle}</p>
          </div>

          <div className="row g-4">
            {filteredClients.map((client, index) => {
              const name = ui.clientDescriptions?.[client.slug]?.name || client.name;
              const description = ui.clientDescriptions?.[client.slug]?.description || client.description;
              return (
                <div key={client.slug} className="col-12 col-md-6 col-lg-4">
                  <article
                    data-reveal
                    data-delay={Math.min(index + 1, 6)}
                    className="showcase-card"
                  >
                    {/* Image area with title overlay */}
                    <div className="showcase-visual">
                      {client.thumbnail
                        ? <div className="showcase-visual-bg" style={{ backgroundImage: `url(${client.thumbnail})` }} />
                        : <div className="showcase-glow" />
                      }
                      <div className="showcase-visual-content">
                        <span className={`status-pill ${statusClassName(client.status)}`} />
                        <h3 className="showcase-card-title">{name}</h3>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="showcase-body">
                      <p>{description}</p>
                      <div className="showcase-meta">
                        {client.contact_email && <span>✉ {client.contact_email}</span>}
                        {client.contact_phone && <span>📞 {client.contact_phone}</span>}
                        {client.contact_fax && <span>{ui.faxLabel || "แฟกซ์:"} {client.contact_fax}</span>}
                      </div>
                      <div className="showcase-actions">
                        <a
                          className="btn agency-btn-primary w-100"
                          href={client.system_url}
                          target={client.system_url?.startsWith("http") ? "_blank" : "_self"}
                          rel={client.system_url?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {ui.viewPortal} →
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          {filteredClients.length === 0 && (
            <div className="empty-state-panel">
              <strong>{ui.emptyTitle}</strong>
              <span>{ui.emptyText}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
