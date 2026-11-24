import { Link } from "react-router-dom";
import { TcoCalculator } from "../components/TcoCalculator";

export function CalculatorPage() {
  return (
    <section className="section section--flush-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Private Cloud TCO Calculator</span>
        </nav>

        <div className="eyebrow">CapEx vs. OpEx Modeling</div>
        <h1>Private Cloud vs. AWS TCO Calculator</h1>
        <p className="lead" style={{ marginBottom: "1.75rem" }}>
          Compare owning a three-node Proxmox VE and Ceph cluster on hardware you control against
          running equivalent steady-state workloads on AWS EC2. Pre-loaded with the itemized ~$4,950
          build from our{" "}
          <Link to="/posts/privatecloud/">private cloud hardware breakdown</Link>.
        </p>

        <TcoCalculator />

        <div className="grid-2" style={{ marginTop: "2rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.18rem" }}>When a private cloud wins</h2>
            <p className="card__body">
              Steady, predictable workloads; on-premises file servers or databases sensitive to WAN
              latency; strict student or donor data residency requirements; or non-profit boards that
              approve one-time capital projects far more readily than compounding monthly bills.
            </p>
            <div className="card__footer">
              <Link to="/posts/privatecloud/">Read full Proxmox + Ceph breakdown →</Link>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.18rem" }}>When cloud is still the right call</h2>
            <p className="card__body">
              Highly spiky workloads, teams with nowhere dry and cooled to keep hardware, or
              deployments that genuinely rely on hyperscaler-managed databases or multi-region
              presence. Where a smaller VPS like DigitalOcean fits better, we will tell you plainly.
            </p>
            <div className="card__footer">
              <Link to="/posts/small-clouds/">Read: Do you really need a hyperscaler? →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
