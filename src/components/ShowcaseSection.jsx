import { statusClassName } from "@/lib/data";

export default function ShowcaseSection({
  ui,
  filteredClients,
}) {
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
              const isSpfoods = client.slug === "spfoods";
              const displayPhone = isSpfoods ? "010***********" : client.contact_phone;
              const visualStyle = client.thumbnail
                ? {
                    backgroundImage: `url(${client.thumbnail})`,
                    backgroundSize: isSpfoods ? "100% auto" : "cover",
                    backgroundPosition: isSpfoods ? "center top" : "center",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: isSpfoods ? "#ffffff" : undefined,
                  }
                : {};
              const overlayStyle = client.thumbnail
                ? {
                    background: isSpfoods
                      ? "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.18) 100%)"
                      : "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 100%)",
                    position: "absolute",
                    inset: 0,
                    padding: "1.3rem",
                  }
                : {};

              return (
              <div
                key={client.slug}
                className="col-12 col-md-6 col-lg-4 d-flex"
              >
                <article
                  data-reveal
                  data-delay={Math.min(index + 1, 6)}
                  className={`showcase-card ${isSpfoods ? "showcase-card-spfoods" : ""}`}>
                  <div className="showcase-visual" style={visualStyle}>
                    {!client.thumbnail && <div className="showcase-glow" />}
                    <div className="showcase-visual-content" style={overlayStyle}>
                      <span className="client-slug">{client.slug}</span>
                    </div>
                  </div>
                  <div className="showcase-body">
                    <h3>{ui.clientDescriptions?.[client.slug]?.name || client.name}</h3>
                    <p>{ui.clientDescriptions?.[client.slug]?.description || client.description}</p>
                    <div className="showcase-meta">
                      <span>{client.contact_email}</span>
                      <span>{displayPhone}</span>
                      {client.contact_fax && <span>{ui.faxLabel || "แฟกซ์:"} {client.contact_fax}</span>}
                    </div>
                    <div className="showcase-actions">
                      <a
                        className="btn agency-btn-primary"
                        href={client.system_url}
                        target={client.system_url?.startsWith("http") ? "_blank" : "_self"}
                        rel={client.system_url?.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {ui.viewPortal}
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
