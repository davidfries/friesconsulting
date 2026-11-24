import { Link } from "react-router-dom";
import { business, posts, services } from "../generated/content";
import type { ServiceCategory } from "../types/content";

interface PillarDefinition {
  category: ServiceCategory;
  title: string;
  summary: string;
}

const PILLARS: PillarDefinition[] = [
  {
    category: "Network & Compliance",
    title: "Networks, E-Rate & Security",
    summary:
      "Full network documentation, E-Rate Category 1 & 2 planning and filing, CIPA filtering, and ransomware recovery.",
  },
  {
    category: "Virtualization & Cloud",
    title: "Private Cloud, VMware Exits & AWS",
    summary:
      "Proxmox VE + Ceph clusters you own outright, Broadcom VMware migrations, Windows/Linux servers, and AWS cost/IaC work.",
  },
  {
    category: "Observability & Operations",
    title: "Monitoring, Inventory & Reporting",
    summary:
      "Grafana and Prometheus alerting tuned to prevent alert fatigue, 1:1 device tracking, and operational dashboards.",
  },
  {
    category: "Automation & Local AI",
    title: "Automation, CI/CD & Local AI",
    summary:
      "Custom APIs, workflow automation, Kubernetes/Docker pipelines, and on-site Ollama models for private log analysis.",
  },
];

const SIMPLE_STEPS = [
  {
    num: "01",
    title: "Scope",
    detail:
      "We clarify the problem, budget constraints, and exact deliverable before any work is committed.",
  },
  {
    num: "02",
    title: "Build & Document",
    detail:
      "We deploy around your academic or business maintenance windows and hand over complete documentation.",
  },
  {
    num: "03",
    title: "Own or Advise",
    detail:
      "Your team owns the system from day one, with optional ongoing advisory support once we know your environment.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero hero--calm">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Colorado On-Site · US Remote</div>
            <h1 className="hero__title">{business.tagline}</h1>
            <p className="lead hero__lead">
              We design, build, document, and monitor networks, private clouds, AWS environments,
              and E-Rate/CIPA systems. Built mostly on open-source foundations so recurring license
              costs stay off your budget and control stays in your hands.
            </p>
            <div className="btn-group">
              <Link to="/contact/" className="btn btn--primary">
                Start a Scoping Conversation
              </Link>
              <Link to="/services/" className="btn btn--secondary">
                Explore Services
              </Link>
            </div>
          </div>

          <aside className="spec-panel" aria-label="At a glance">
            <div className="spec-panel__header">
              <span>At a Glance</span>
              <span>FCS · Colorado</span>
            </div>
            <dl className="spec-list">
              <div className="spec-list__row">
                <dt>What we build</dt>
                <dd>Networks, Proxmox/Ceph clusters, AWS &amp; IaC, monitoring, automation</dd>
              </div>
              <div className="spec-list__row">
                <dt>Who we help</dt>
                <dd>Charter &amp; K-12 schools, non-profits, and small businesses (up to ~50 staff)</dd>
              </div>
              <div className="spec-list__row">
                <dt>Where we work</dt>
                <dd>Denver &amp; Northern Colorado on-site; remotely across the US</dd>
              </div>
              <div className="spec-list__row">
                <dt>How we deliver</dt>
                <dd>Fixed-scope builds on open-source stacks — zero vendor lock-in</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="services-overview-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">What We Do</div>
              <h2 id="services-overview-heading">Four areas of practice</h2>
              <p className="muted">
                Every engagement produces working infrastructure and written documentation your team
                keeps. Jump directly to any capability below or read the complete service catalog.
              </p>
            </div>
            <Link to="/services/" className="btn btn--secondary">
              Full specifications &amp; FAQ ({services.length} services) →
            </Link>
          </div>

          <div className="grid-2">
            {PILLARS.map((pillar) => {
              const pillarServices = services.filter((s) => s.category === pillar.category);
              return (
                <article key={pillar.category} className="card pillar-card">
                  <div className="card__meta">
                    <span className="badge">{pillar.category}</span>
                  </div>
                  <h3 className="card__title" style={{ fontSize: "1.2rem" }}>
                    {pillar.title}
                  </h3>
                  <p className="pillar-card__summary">{pillar.summary}</p>
                  <ul className="pillar-links">
                    {pillarServices.map((svc) => (
                      <li key={svc.id}>
                        <Link to={`/services/#${svc.id}`}>
                          <span>{svc.shortName}</span>
                          <span className="pillar-links__arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="proof-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">Production Evidence</div>
              <h2 id="proof-heading">Real work, real numbers</h2>
              <p className="muted">
                Published hardware bills, production throughput, and honest trade-offs from live
                client deployments.
              </p>
            </div>
          </div>

          <div className="proof-grid">
            <article className="card card--accent">
              <div className="card__meta">
                <span>Charter School (~500 students)</span>
                <span>·</span>
                <span>CIPA &amp; Local AI</span>
              </div>
              <h3 className="card__title" style={{ fontSize: "1.24rem" }}>
                <Link to="/posts/local-llm/">CIPA Filter Log Pipeline</Link>
              </h3>
              <p className="card__body" style={{ flex: "0 0 auto" }}>
                Rules and caching absorb ~99% of school web traffic before a self-hosted Ollama
                model on one NVIDIA GPU classifies the rest — feeding plain-language Grafana views
                without student logs ever leaving the building.
              </p>

              <div className="metric-strip">
                <div className="metric-box">
                  <div className="metric-box__value">~241K</div>
                  <div className="metric-box__label">events/wk</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box__value">~1.2%</div>
                  <div className="metric-box__label">hit local LLM</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box__value">$0 API</div>
                  <div className="metric-box__label">stays on-site</div>
                </div>
              </div>

              <div className="spotlight-preview spotlight-preview--16x7">
                <img
                  src="/images/cipa-pipeline/staff-dashboard-overview.png"
                  alt="Staff Grafana dashboard showing aggregate filter evasion, off-task traffic, active student count, and seven-day trend lines."
                  width={1200}
                  height={552}
                  loading="eager"
                />
              </div>

              <div className="card__footer">
                <Link to="/posts/local-llm/">Read production case study →</Link>
                <Link to="/services/#e-rate-funding-and-cipa-compliance" className="muted">
                  E-Rate &amp; CIPA
                </Link>
              </div>
            </article>

            <article className="card">
              <div className="card__meta">
                <span>Proxmox VE + Ceph</span>
                <span>·</span>
                <span>CapEx vs. Cloud Rent</span>
              </div>
              <h3 className="card__title" style={{ fontSize: "1.24rem" }}>
                <Link to="/posts/privatecloud/">3-Node Private Cloud vs. AWS</Link>
              </h3>
              <p className="card__body" style={{ flex: "0 0 auto" }}>
                A three-node Minisforum MS-01 cluster with Ceph 3× replication runs on hardware you
                own with zero per-VM licensing — paying back its ~$4,950 hardware cost inside the
                first year against equivalent AWS EC2 instances.
              </p>

              <div className="metric-strip">
                <div className="metric-box">
                  <div className="metric-box__value">~$4,950</div>
                  <div className="metric-box__label">hardware BOM</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box__value">~$5,600/yr</div>
                  <div className="metric-box__label">AWS compute</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box__value">~10.6 mo</div>
                  <div className="metric-box__label">payback</div>
                </div>
              </div>

              <div className="mini-compare">
                <table>
                  <thead>
                    <tr>
                      <th>Baseline (6 VMs · 4 vCPU / 8 GB)</th>
                      <th>Proxmox + Ceph</th>
                      <th>AWS EC2 (1-yr RI)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Hardware / Year 1 compute</td>
                      <td className="mono">~$4,950 once</td>
                      <td className="mono">$5,616 / yr</td>
                    </tr>
                    <tr>
                      <td>Hypervisor &amp; storage licenses</td>
                      <td className="mono">$0</td>
                      <td className="mono">EBS + egress extra</td>
                    </tr>
                    <tr>
                      <td>3-Year total (compute only)</td>
                      <td className="mono">~$4,950</td>
                      <td className="mono">$16,848</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card__footer">
                <Link to="/calculator/">Run interactive TCO calculator →</Link>
                <Link to="/posts/privatecloud/" className="muted">
                  Itemized BOM
                </Link>
              </div>
            </article>
          </div>

          <div className="proof-footer">
            <span>
              More field notes on VMware migrations, AWS IaC, network audits, and automation:
            </span>
            <Link to="/posts/" style={{ fontWeight: 600 }}>
              Browse all {posts.length} technical articles →
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="how-we-work-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-header__copy">
              <div className="eyebrow">Working Together</div>
              <h2 id="how-we-work-heading">How we work</h2>
            </div>
            <Link to="/contact/" className="btn btn--primary">
              Start a Scoping Conversation
            </Link>
          </div>

          <div className="grid-2" style={{ gap: "2rem" }}>
            <div>
              <h3>Built for fixed budgets &amp; lean teams</h3>
              <p className="muted">
                A charter school is our largest ongoing client, and non-profit and K-12 constraints
                shape the practice: budgets are set a year in advance, cutovers follow the academic
                calendar, and recurring subscriptions hurt far more than one-time capital builds.
                Open-source tools like Proxmox, Ceph, and Grafana keep renewal pressure off your
                budget.
              </p>
            </div>

            <div>
              <h3>Standalone team, or alongside your IT staff</h3>
              <p className="muted">
                For organizations with no dedicated IT staff, we act as your infrastructure team
                from architecture through documentation. For internal IT departments that need extra
                hands or specialist depth on a migration, audit, or monitoring build, we deliver the
                project cleanly and hand ownership back to your team.
              </p>
            </div>
          </div>

          <div className="step-strip">
            {SIMPLE_STEPS.map((step) => (
              <div key={step.num}>
                <div className="step-item__num">STEP {step.num}</div>
                <h3 style={{ marginBottom: "0.35rem" }}>{step.title}</h3>
                <p className="small muted" style={{ margin: 0 }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
