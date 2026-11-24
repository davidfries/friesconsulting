import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { business } from "../generated/content";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

const DESKTOP_NAV_ITEMS = [
  { to: "/services/", label: "Services", end: false },
  { to: "/posts/", label: "Writing", end: false },
  { to: "/calculator/", label: "TCO Calculator", end: false },
  { to: "/contact/", label: "Contact", end: false },
];

const MOBILE_NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  ...DESKTOP_NAV_ITEMS,
];

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand-link" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              FCS
            </span>
            <span className="brand-text">{business.name}</span>
          </Link>

          <nav className="site-nav" aria-label="Primary navigation">
            {DESKTOP_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "site-nav__link site-nav__link--active" : "site-nav__link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <ThemeToggle />
            <button
              type="button"
              className="icon-btn mobile-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span>{menuOpen ? "✕" : "☰"}</span>
              <span>Menu</span>
            </button>
          </div>
        </div>

        <nav
          id="mobile-nav-drawer"
          className={menuOpen ? "mobile-drawer mobile-drawer--open" : "mobile-drawer"}
          aria-label="Mobile navigation"
        >
          <div className="container mobile-drawer__list">
            {MOBILE_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  isActive ? "site-nav__link site-nav__link--active" : "site-nav__link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-heading">{business.legalName}</div>
              <p className="small muted" style={{ maxWidth: "44ch" }}>
                IT infrastructure consulting for non-profits, charter schools, and small businesses.{" "}
                {business.serviceArea.summary}
              </p>
              <p className="small" style={{ marginTop: "0.75rem" }}>
                <Link to="/contact/">Start a scoping conversation</Link>
                {business.github ? (
                  <>
                    {" · "}
                    <a href={business.github} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  </>
                ) : null}
              </p>
            </div>

            <div>
              <div className="footer-heading">Navigation</div>
              <ul className="footer-links">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/services/">Services & FAQ</Link>
                </li>
                <li>
                  <Link to="/posts/">Writing & Case Studies</Link>
                </li>
                <li>
                  <Link to="/calculator/">Private Cloud TCO Calculator</Link>
                </li>
                <li>
                  <Link to="/contact/">Contact</Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="footer-heading">Core Focus Areas</div>
              <ul className="footer-links">
                <li>
                  <Link to="/services/#e-rate-funding-and-cipa-compliance">
                    E-Rate & CIPA Compliance
                  </Link>
                </li>
                <li>
                  <Link to="/posts/privatecloud/">Proxmox & Ceph Private Cloud</Link>
                </li>
                <li>
                  <Link to="/posts/local-llm/">Local AI Filter Log Pipeline</Link>
                </li>
                <li>
                  <Link to="/posts/network-audit/">Network Audits & Documentation</Link>
                </li>
                <li>
                  <Link to="/services/#ransomware-recovery-operations">Ransomware Recovery</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {business.legalName} · Founded by {business.founder}
            </span>
            <div className="machine-links" aria-label="Machine-readable discovery endpoints">
              <span>Machine-readable:</span>
              <a href="/llms.txt">llms.txt</a>
              <a href="/llms-full.txt">llms-full.txt</a>
              <a href="/business.json">business.json</a>
              <a href="/services.json">services.json</a>
              <a href="/.well-known/agent-card.json">agent-card.json</a>
              <a href="/rss.xml">rss.xml</a>
              <a href="/sitemap.xml">sitemap.xml</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
