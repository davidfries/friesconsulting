import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calculatePrivateCloudTco,
  DEFAULT_TCO_INPUTS,
  formatCurrency,
  type AwsPricingTerm,
} from "../lib/tco";

interface TcoCalculatorProps {
  compact?: boolean;
}

interface WorkloadTier {
  id: string;
  label: string;
  vcpu: number;
  ramGb: number;
  awsLabel: string;
}

const WORKLOAD_TIERS: WorkloadTier[] = [
  { id: "small", label: "2 vCPU / 4 GB", vcpu: 2, ramGb: 4, awsLabel: "c5.large" },
  { id: "medium", label: "4 vCPU / 8 GB", vcpu: 4, ramGb: 8, awsLabel: "c5.xlarge" },
  { id: "large", label: "8 vCPU / 16 GB", vcpu: 8, ramGb: 16, awsLabel: "c5.2xlarge" },
];

const OPS_OPTIONS = [
  { label: "$0 (Hardware vs. Compute)", value: 0 },
  { label: "$600/yr (Power + misc)", value: 600 },
  { label: "$1,800/yr (Power + reserve)", value: 1800 },
];

export function TcoCalculator({ compact = false }: TcoCalculatorProps) {
  const navigate = useNavigate();
  const [vmCount, setVmCount] = useState<number>(DEFAULT_TCO_INPUTS.vmCount);
  const [tierId, setTierId] = useState<string>("medium");
  const [storageGbPerVm, setStorageGbPerVm] = useState<number>(DEFAULT_TCO_INPUTS.storageGbPerVm);
  const [awsTerm, setAwsTerm] = useState<AwsPricingTerm>(DEFAULT_TCO_INPUTS.awsTerm);
  const [includeAwsStorageAndEgress, setIncludeAwsStorageAndEgress] = useState<boolean>(
    DEFAULT_TCO_INPUTS.includeAwsStorageAndEgress
  );
  const [annualOpsAndPower, setAnnualOpsAndPower] = useState<number>(
    DEFAULT_TCO_INPUTS.annualOpsAndPower
  );

  const activeTier = WORKLOAD_TIERS.find((t) => t.id === tierId) ?? WORKLOAD_TIERS[1];

  const result = useMemo(
    () =>
      calculatePrivateCloudTco({
        vmCount,
        vcpuPerVm: activeTier.vcpu,
        ramGbPerVm: activeTier.ramGb,
        storageGbPerVm,
        awsTerm,
        includeAwsStorageAndEgress,
        annualOpsAndPower,
        years: 3,
      }),
    [vmCount, activeTier, storageGbPerVm, awsTerm, includeAwsStorageAndEgress, annualOpsAndPower]
  );

  const applyPreset = (
    vms: number,
    tier: string,
    storageGb: number,
    term: AwsPricingTerm,
    includeEbs: boolean,
    ops: number
  ) => {
    setVmCount(vms);
    setTierId(tier);
    setStorageGbPerVm(storageGb);
    setAwsTerm(term);
    setIncludeAwsStorageAndEgress(includeEbs);
    setAnnualOpsAndPower(ops);
  };

  const chartPoints = result.yearlyProjection.filter((p) => p.year === 1 || p.year === 3 || p.year === 5);
  const maxChartCost = Math.max(
    1,
    ...chartPoints.flatMap((p) => [p.onPremCumulative, p.awsCumulative])
  );

  const handleUseEstimate = () => {
    const prefilled = [
      `Workload estimate from Private Cloud TCO Calculator:`,
      `- Virtual machines: ${vmCount} VMs (${activeTier.label}, ${storageGbPerVm} GB storage each)`,
      `- Sized Proxmox + Ceph cluster: ${result.nodeCount}x Minisforum MS-01 (${result.ramPerNodeGb} GB RAM, 3x ${result.nvmeTbPerNode} TB NVMe) — ~${formatCurrency(result.clusterUpfrontCost)} hardware`,
      `- AWS baseline comparison: ${vmCount}x ${result.awsInstanceType} (${awsTerm}, ${includeAwsStorageAndEgress ? "including EBS/egress estimate" : "compute only"}) — ~${formatCurrency(result.awsAnnualTotal)}/yr`,
      result.breakEvenMonths !== null
        ? `- Estimated break-even: ~${result.breakEvenMonths} months; 3-year net savings: ${formatCurrency(result.threeYearSavings)}`
        : "",
      `\nOur current environment, timeline, and goals:\n`,
    ]
      .filter(Boolean)
      .join("\n");

    navigate("/contact/", { state: { prefilledMessage: prefilled } });
  };

  return (
    <section className="tco-shell" aria-label="Private Cloud vs. AWS TCO Estimator">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "0.25rem", fontSize: compact ? "1.35rem" : "1.55rem" }}>
            Proxmox & Ceph Private Cloud vs. AWS Estimator
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            Grounded in the three-node Minisforum MS-01 build (~$4,950) vs. equivalent AWS EC2 compute.
          </p>
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className="pill"
            onClick={() => applyPreset(6, "medium", 500, "1yr-reserved", false, 0)}
          >
            Charter School (6 VMs Baseline)
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => applyPreset(3, "small", 250, "1yr-reserved", true, 600)}
          >
            Small Non-Profit (3 VMs)
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => applyPreset(12, "medium", 500, "1yr-reserved", true, 1800)}
          >
            Growing SMB (12 VMs)
          </button>
        </div>
      </div>

      <div className="tco-layout">
        <div className="tco-controls">
          <div className="control-group">
            <div className="control-group__top">
              <label htmlFor={compact ? "vm-count-compact" : "vm-count"}>Virtual machines</label>
              <span className="control-group__value">{vmCount} VMs</span>
            </div>
            <input
              id={compact ? "vm-count-compact" : "vm-count"}
              className="range-input"
              type="range"
              min={1}
              max={24}
              step={1}
              value={vmCount}
              onChange={(e) => setVmCount(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-group__top">
              <span>Compute size per VM</span>
              <span className="control-group__value">{activeTier.awsLabel}</span>
            </div>
            <div className="segmented" role="group" aria-label="Compute size per VM">
              {WORKLOAD_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={
                    tier.id === tierId ? "segmented__btn segmented__btn--active" : "segmented__btn"
                  }
                  onClick={() => setTierId(tier.id)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="control-group__top">
              <label htmlFor={compact ? "storage-vm-compact" : "storage-vm"}>Storage per VM</label>
              <span className="control-group__value">
                {storageGbPerVm} GB ({((vmCount * storageGbPerVm) / 1000).toFixed(1)} TB total)
              </span>
            </div>
            <input
              id={compact ? "storage-vm-compact" : "storage-vm"}
              className="range-input"
              type="range"
              min={100}
              max={2000}
              step={100}
              value={storageGbPerVm}
              onChange={(e) => setStorageGbPerVm(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-group__top">
              <span>AWS pricing term</span>
              <span className="control-group__value">{awsTerm}</span>
            </div>
            <div className="segmented" role="group" aria-label="AWS pricing term">
              <button
                type="button"
                className={
                  awsTerm === "1yr-reserved"
                    ? "segmented__btn segmented__btn--active"
                    : "segmented__btn"
                }
                onClick={() => setAwsTerm("1yr-reserved")}
              >
                1-Year Reserved
              </button>
              <button
                type="button"
                className={
                  awsTerm === "on-demand"
                    ? "segmented__btn segmented__btn--active"
                    : "segmented__btn"
                }
                onClick={() => setAwsTerm("on-demand")}
              >
                On-Demand
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="control-group__top">
              <span>Annual on-prem power & ops reserve</span>
              <span className="control-group__value">{formatCurrency(annualOpsAndPower)}/yr</span>
            </div>
            <div className="segmented" role="group" aria-label="Annual on-prem power and reserve">
              {OPS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={
                    annualOpsAndPower === opt.value
                      ? "segmented__btn segmented__btn--active"
                      : "segmented__btn"
                  }
                  onClick={() => setAnnualOpsAndPower(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={includeAwsStorageAndEgress}
              onChange={(e) => setIncludeAwsStorageAndEgress(e.target.checked)}
            />
            <span>
              Include estimated AWS EBS gp3 storage ($0.08/GB-mo), snapshots, and egress
            </span>
          </label>
        </div>

        <div>
          <div className="tco-metrics">
            <div className="tco-metric">
              <div className="tco-metric__label">Cluster hardware upfront</div>
              <div className="tco-metric__value">{formatCurrency(result.clusterUpfrontCost)}</div>
              <div className="tco-metric__sub">
                {result.nodeCount} nodes · {result.usableClusterRamGb} GB N+1 RAM ·{" "}
                {(result.usableClusterStorageGb / 1000).toFixed(1)} TB Ceph usable
              </div>
            </div>

            <div className="tco-metric">
              <div className="tco-metric__label">AWS annual cost</div>
              <div className="tco-metric__value">{formatCurrency(result.awsAnnualTotal)}/yr</div>
              <div className="tco-metric__sub">
                {formatCurrency(result.awsMonthlyTotal)}/mo ({vmCount}× {result.awsInstanceType})
              </div>
            </div>

            <div className="tco-metric">
              <div className="tco-metric__label">Estimated break-even</div>
              <div className="tco-metric__value">
                {result.breakEvenMonths !== null ? `${result.breakEvenMonths} mo` : "N/A"}
              </div>
              <div className="tco-metric__sub">Hardware payback vs. monthly AWS run rate</div>
            </div>

            <div className="tco-metric">
              <div className="tco-metric__label">3-year net difference</div>
              <div
                className="tco-metric__value"
                style={{
                  color: result.threeYearSavings >= 0 ? "var(--success)" : "var(--warm)",
                }}
              >
                {result.threeYearSavings >= 0
                  ? `${formatCurrency(result.threeYearSavings)} saved`
                  : `${formatCurrency(Math.abs(result.threeYearSavings))} higher`}
              </div>
              <div className="tco-metric__sub">
                5-year net: {formatCurrency(result.fiveYearSavings)} saved
              </div>
            </div>
          </div>

          <div className="tco-chart">
            <div className="tco-chart__legend">
              <span className="legend-swatch legend-swatch--onprem">
                Proxmox + Ceph Cumulative (Hardware + Reserve)
              </span>
              <span className="legend-swatch legend-swatch--aws">AWS Cumulative Spend</span>
            </div>
            <svg
              viewBox="0 0 460 156"
              role="img"
              aria-label="Cumulative cost comparison bar chart for Years 1, 3, and 5"
              style={{ width: "100%", height: "auto" }}
            >
              {chartPoints.map((pt, idx) => {
                const groupX = 24 + idx * 148;
                const maxBarHeight = 104;
                const onPremH = Math.max(6, Math.round((pt.onPremCumulative / maxChartCost) * maxBarHeight));
                const awsH = Math.max(6, Math.round((pt.awsCumulative / maxChartCost) * maxBarHeight));
                const baseY = 126;

                return (
                  <g key={pt.year}>
                    <rect
                      x={groupX}
                      y={baseY - onPremH}
                      width="46"
                      height={onPremH}
                      rx="3"
                      fill="var(--accent)"
                    />
                    <text
                      x={groupX + 23}
                      y={baseY - onPremH - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--ink)"
                    >
                      {formatCurrency(pt.onPremCumulative)}
                    </text>

                    <rect
                      x={groupX + 54}
                      y={baseY - awsH}
                      width="46"
                      height={awsH}
                      rx="3"
                      fill="var(--warm)"
                    />
                    <text
                      x={groupX + 77}
                      y={baseY - awsH - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--ink)"
                    >
                      {formatCurrency(pt.awsCumulative)}
                    </text>

                    <text
                      x={groupX + 50}
                      y={145}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--ink-secondary)"
                    >
                      Year {pt.year}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`fit-banner fit-banner--${result.fitAssessment.status}`}>
            <strong style={{ display: "block", marginBottom: "0.2rem" }}>
              {result.fitAssessment.headline}
            </strong>
            <span className="small muted">{result.fitAssessment.detail}</span>
          </div>

          {!compact && (
            <div className="table-scroll" style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Hardware Component</th>
                    <th>Specification</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.hardwareBom.map((item) => (
                    <tr key={item.component}>
                      <td>{item.component}</td>
                      <td className="small muted">{item.spec}</td>
                      <td>{item.quantity}</td>
                      <td className="mono">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3}>
                      <strong>Cluster hardware total</strong>
                    </td>
                    <td className="mono">
                      <strong>{formatCurrency(result.clusterUpfrontCost)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="btn-group">
            <button type="button" className="btn btn--primary" onClick={handleUseEstimate}>
              Use This Estimate in Scoping Form
            </button>
            {compact ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => navigate("/calculator/")}
              >
                Open Full TCO Calculator
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
