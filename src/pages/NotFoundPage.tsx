import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="section section--flush-top">
      <div className="container">
        <div className="eyebrow">404</div>
        <h1>Page not found</h1>
        <p className="lead" style={{ marginBottom: "1.5rem" }}>
          The page you requested does not exist at this URL. Here are the main sections of the
          site:
        </p>
        <div className="btn-group">
          <Link to="/" className="btn btn--primary">
            Home
          </Link>
          <Link to="/services/" className="btn btn--secondary">
            Services & FAQ
          </Link>
          <Link to="/posts/" className="btn btn--secondary">
            Writing
          </Link>
          <Link to="/calculator/" className="btn btn--secondary">
            TCO Calculator
          </Link>
          <Link to="/contact/" className="btn btn--secondary">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}
