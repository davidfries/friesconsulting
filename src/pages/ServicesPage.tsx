import { useState } from "react";
import { Link } from "react-router-dom";
import { MarkdownContent } from "../components/MarkdownContent";
import { business, faqs, services } from "../generated/content";
import type { AudienceKey, ServiceCategory } from "../types/content";

type AudienceFilter = "all" | AudienceKey;

const CATEGORIES: ServiceCategory[] = [
  "Network & Compliance",
  "Virtualization & Cloud",
  "Observability & Operations",
  "Automation & Local AI",
];

const AUDIENCE_TABS: Array<{ id: AudienceFilter; label: string }> = [
  { id: "all", label: `All (${services.length})` },
  { id: "schools", label: "Schools & E-Rate" },
  { id: "non-profits", label: "Non-Profits" },
  { id: "small-business", label: "Small Business" },
];

export function ServicesPage() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");

  const filteredServices = services.filter((svc) => {
    if (audienceFilter === "all") return true;
    return svc.audiences.includes(audienceFilter);
  });

  return (
    <>
      <section className="section section--compact-top" style={{ paddingBottom: "1.5rem" }}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Services</span>
          </nav>

          <div className="eyebrow">Full Practice Specification</div>
          <h1>IT Infrastructure Services</h1>
          <p className="lead" style={{ marginBottom: "1.15rem" }}>
            {business.legalName} provides IT infrastructure consulting to non-profits, charter
            schools, and small businesses. Below is what we build, the technologies we work in, how
            engagements run, and direct answers to common questions.
          </p>

          <div className="filter-bar" style={{ marginBottom: "0.5rem" }} role="group" aria-label="Filter services by audience">
            {AUDIENCE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={audienceFilter === tab.id ? "pill pill--active" : "pill"}
                onClick={() => setAudienceFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <details className="mobile-toc">
            <summary className="mobile-toc__summary">
              Jump to a service or section ({filteredServices.length} services + FAQ)
            </summary>
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.45rem", fontSize: "0.88rem" }}>
              {filteredServices.map((svc) => (
                <a key={svc.id} href={`#${svc.id}`}>
                  {svc.shortName}
                </a>
              ))}
              <a href="#technologies">Technologies</a>
              <a href="#working-with-non-profits-and-schools">Non-Profits &amp; Schools</a>
              <a href="#how-engagements-work">How Engagements Work</a>
              <a href="#faq">FAQ ({faqs.length})</a>
            </div>
          </details>
        </div>
      </section>

      <section className="section" aria-label="Service details">
        <div className="container services-layout">
          <div>
            {filteredServices.map((service) => (
              <article key={service.id} id={service.id} className="service-detail">
                <div className="service-detail__header">
                  <h2 className="service-detail__title">{service.name}</h2>
                  <span className="badge">{service.category}</span>
                </div>

                <MarkdownContent html={service.detailsHtml} />

                <div className="service-actions">
                  <Link
                    to="/contact/"
                    state={{
                      prefilledMessage: `Inquiry regarding: ${service.name}\n\nEnvironment & current setup:\n\nProblem or goal:\n\nTimeline:\n`,
                    }}
                    style={{ fontWeight: 600 }}
                  >
                    Scope this service →
                  </Link>
                  {service.relatedPost ? (
                    <Link to={`/posts/${service.relatedPost}/`} className="muted">
                      Read technical write-up
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <aside className="services-toc" aria-label="Services table of contents">
            <div className="toc-aside__title">On this page</div>
            {CATEGORIES.map((category) => {
              const groupServices = filteredServices.filter((s) => s.category === category);
              if (groupServices.length === 0) return null;
              return (
                <div key={category} className="toc-group">
                  <div className="toc-group__label">{category}</div>
                  <ul className="toc-list">
                    {groupServices.map((svc) => (
                      <li key={svc.id}>
                        <a href={`#${svc.id}`}>{svc.shortName}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="toc-group" style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <div className="toc-group__label">Practice Details</div>
              <ul className="toc-list">
                <li>
                  <a href="#technologies">Technologies</a>
                </li>
                <li>
                  <a href="#working-with-non-profits-and-schools">Non-Profits &amp; Schools</a>
                </li>
                <li>
                  <a href="#how-engagements-work">How Engagements Work</a>
                </li>
                <li>
                  <a href="#faq">FAQ ({faqs.length})</a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section id="technologies" className="section section--subtle">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">Stack</div>
              <h2>Technologies we work in</h2>
            </div>
          </div>
          <div className="grid-3">
            {business.technologies.map((group) => (
              <div key={group.category} className="card">
                <h3 className="card__title">{group.category}</h3>
                <div className="tag-row">
                  {group.items.map((item) => (
                    <span key={item} className="tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="working-with-non-profits-and-schools" className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">Sector Constraints</div>
              <h2>Working with non-profits and schools</h2>
              <p className="muted">
                Non-profit and K-12 work is not simply commercial work with a smaller budget
                attached. The constraints are structurally different, and a consultant who ignores
                them tends to create problems rather than solve them.
              </p>
            </div>
          </div>

          <div className="grid-2">
            {business.nonProfitRealities.map((item) => (
              <div key={item.title} className="card">
                <h3 className="card__title">{item.title}</h3>
                <p className="card__body">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-engagements-work" className="section section--subtle">
        <div className="container">
          <div className="grid-2">
            <div className="card">
              <div className="eyebrow">Geography</div>
              <h2>Service area</h2>
              <p className="muted">{business.serviceArea.summary}</p>
              <p className="small muted">
                On-site coverage includes {business.serviceArea.onSite.join(", ")}. Cloud,
                infrastructure-as-code, monitoring, and automation engagements routinely run remotely
                anywhere in the United States.
              </p>
            </div>

            <div className="card">
              <div className="eyebrow">Structure</div>
              <h2>How engagements work</h2>
              <p className="muted">{business.engagementModel}</p>
              <p className="small muted">{business.pricingModel}</p>
              <div className="btn-group" style={{ marginTop: "0.75rem" }}>
                <Link to="/contact/" className="btn btn--primary">
                  Start Scoping →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">Direct Answers</div>
              <h2>Frequently asked questions</h2>
            </div>
          </div>

          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <details key={faq.q} open={idx === 0} className="faq-item">
                <summary className="faq-item__q">{faq.q}</summary>
                <div className="faq-item__a">
                  <MarkdownContent html={faq.answerHtml} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
