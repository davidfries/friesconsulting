export type AwsPricingTerm = "1yr-reserved" | "on-demand";

export interface TcoInputs {
  vmCount: number;
  vcpuPerVm: number;
  ramGbPerVm: number;
  storageGbPerVm: number;
  awsTerm: AwsPricingTerm;
  includeAwsStorageAndEgress: boolean;
  annualOpsAndPower: number;
  years?: number;
}

export interface BomLineItem {
  component: string;
  spec: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface YearlyCostPoint {
  year: number;
  onPremCumulative: number;
  awsCumulative: number;
  netSavings: number;
}

export interface TcoResult {
  inputs: Required<TcoInputs>;
  nodeCount: number;
  ramPerNodeGb: number;
  nvmeTbPerNode: number;
  usableClusterStorageGb: number;
  usableClusterRamGb: number;
  totalRequiredRamGb: number;
  totalRequiredStorageGb: number;
  hardwareBom: BomLineItem[];
  clusterUpfrontCost: number;
  onPremAnnualOngoing: number;
  awsInstanceType: string;
  awsMonthlyPerVm: number;
  awsMonthlyCompute: number;
  awsMonthlyStorageAndEgress: number;
  awsMonthlyTotal: number;
  awsAnnualTotal: number;
  breakEvenMonths: number | null;
  threeYearSavings: number;
  fiveYearSavings: number;
  selectedHorizonSavings: number;
  yearlyProjection: YearlyCostPoint[];
  fitAssessment: {
    status: "strong-fit" | "borderline" | "consider-smaller-cloud";
    headline: string;
    detail: string;
  };
}

export const DEFAULT_TCO_INPUTS: Required<TcoInputs> = {
  vmCount: 6,
  vcpuPerVm: 4,
  ramGbPerVm: 8,
  storageGbPerVm: 500,
  awsTerm: "1yr-reserved",
  includeAwsStorageAndEgress: false,
  annualOpsAndPower: 0,
  years: 3,
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getAwsInstanceSpec(
  vcpuPerVm: number,
  ramGbPerVm: number,
  awsTerm: AwsPricingTerm
): { instanceType: string; monthlyCost: number } {
  const isOnDemand = awsTerm === "on-demand";

  if (vcpuPerVm <= 2 && ramGbPerVm <= 4) {
    return {
      instanceType: "c5.large",
      monthlyCost: isOnDemand ? 62 : 39,
    };
  }
  if (vcpuPerVm <= 4 && ramGbPerVm <= 8) {
    return {
      instanceType: "c5.xlarge",
      monthlyCost: isOnDemand ? 124 : 78,
    };
  }
  if (vcpuPerVm <= 8 && ramGbPerVm <= 16) {
    return {
      instanceType: "c5.2xlarge",
      monthlyCost: isOnDemand ? 248 : 156,
    };
  }

  const computeUnits = Math.max(vcpuPerVm / 2, ramGbPerVm / 4);
  const perUnit = isOnDemand ? 31 : 19.5;
  return {
    instanceType: `c5-equivalent (${vcpuPerVm} vCPU / ${ramGbPerVm} GB)`,
    monthlyCost: Math.round(computeUnits * perUnit),
  };
}

export function calculatePrivateCloudTco(rawInputs: Partial<TcoInputs> = {}): TcoResult {
  const inputs: Required<TcoInputs> = {
    vmCount: clampInt(rawInputs.vmCount ?? DEFAULT_TCO_INPUTS.vmCount, 1, 24),
    vcpuPerVm: clampInt(rawInputs.vcpuPerVm ?? DEFAULT_TCO_INPUTS.vcpuPerVm, 1, 16),
    ramGbPerVm: clampInt(rawInputs.ramGbPerVm ?? DEFAULT_TCO_INPUTS.ramGbPerVm, 2, 64),
    storageGbPerVm: clampInt(rawInputs.storageGbPerVm ?? DEFAULT_TCO_INPUTS.storageGbPerVm, 50, 4000),
    awsTerm: rawInputs.awsTerm === "on-demand" ? "on-demand" : "1yr-reserved",
    includeAwsStorageAndEgress:
      rawInputs.includeAwsStorageAndEgress ?? DEFAULT_TCO_INPUTS.includeAwsStorageAndEgress,
    annualOpsAndPower: Math.max(
      0,
      Math.min(25000, Math.round(rawInputs.annualOpsAndPower ?? DEFAULT_TCO_INPUTS.annualOpsAndPower))
    ),
    years: clampInt(rawInputs.years ?? DEFAULT_TCO_INPUTS.years, 1, 5),
  };

  const totalRequiredVcpu = inputs.vmCount * inputs.vcpuPerVm;
  const totalRequiredRamGb = inputs.vmCount * inputs.ramGbPerVm;
  const totalRequiredStorageGb = inputs.vmCount * inputs.storageGbPerVm;

  // Ceph HA cluster needs at least 3 nodes for quorum and tolerates 1 failed node (N-1).
  // Each Minisforum MS-01 node provides 24 safe vCPUs after host headroom.
  const minNodesForCpu = Math.max(3, Math.ceil(totalRequiredVcpu / 24) + 1);

  // Pick RAM per node (32 GB default matching privatecloud.md, or 64 GB if needed) and node count.
  let nodeCount = minNodesForCpu;
  let ramPerNodeGb: 32 | 64 = 32;
  let usableRamPer32GbNode = 26;
  let usableRamPer64GbNode = 56;

  while (
    (nodeCount - 1) * (ramPerNodeGb === 32 ? usableRamPer32GbNode : usableRamPer64GbNode) <
    totalRequiredRamGb
  ) {
    if (ramPerNodeGb === 32) {
      ramPerNodeGb = 64;
    } else {
      nodeCount += 1;
    }
  }

  // Pick NVMe drives per node: 3x 2 TB ($600/node) or 3x 4 TB ($1,150/node), scaling nodes if needed.
  // Ceph 3x replication with 85% pool safety headroom on N-1 surviving nodes.
  let driveSizeTb: 2 | 4 = 2;
  const usableGbFor = (nodes: number, tbPerDrive: 2 | 4) => {
    const rawPerNodeGb = 3 * tbPerDrive * 1000;
    return Math.round(((nodes - 1) * rawPerNodeGb * 0.85) / 3);
  };

  while (usableGbFor(nodeCount, driveSizeTb) < totalRequiredStorageGb) {
    if (driveSizeTb === 2) {
      driveSizeTb = 4;
    } else {
      nodeCount += 1;
    }
  }

  const chassisCost = ramPerNodeGb === 32 ? 850 : 1050;
  const storageCostPerNode = driveSizeTb === 2 ? 600 : 1150;
  const switchCost = nodeCount <= 6 ? 500 : 950;
  const cablingCost = 100 + Math.max(0, nodeCount - 3) * 35;

  const hardwareBom: BomLineItem[] = [
    {
      component: "Cluster nodes",
      spec: `Minisforum MS-01, ${ramPerNodeGb} GB RAM, 2x 10 Gbps NICs`,
      quantity: nodeCount,
      unitCost: chassisCost,
      totalCost: nodeCount * chassisCost,
    },
    {
      component: "NVMe storage",
      spec: `3x ${driveSizeTb} TB NVMe (M.2) per node for Ceph 3x replication`,
      quantity: nodeCount,
      unitCost: storageCostPerNode,
      totalCost: nodeCount * storageCostPerNode,
    },
    {
      component: "10 Gbps switching",
      spec: nodeCount <= 6 ? "Managed 10 Gbps SFP+ switch" : "16-port managed 10 Gbps SFP+ switch",
      quantity: 1,
      unitCost: switchCost,
      totalCost: switchCost,
    },
    {
      component: "DAC & patch cabling",
      spec: "Dual-homed 10 Gbps DACs separating Ceph & VM traffic",
      quantity: 1,
      unitCost: cablingCost,
      totalCost: cablingCost,
    },
    {
      component: "Proxmox VE & Ceph",
      spec: "Open-source hypervisor, clustering, HA, & distributed storage",
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
    },
  ];

  const clusterUpfrontCost = hardwareBom.reduce((sum, item) => sum + item.totalCost, 0);
  const usableClusterStorageGb = usableGbFor(nodeCount, driveSizeTb);
  const usableClusterRamGb =
    (nodeCount - 1) * (ramPerNodeGb === 32 ? usableRamPer32GbNode : usableRamPer64GbNode);

  const awsSpec = getAwsInstanceSpec(inputs.vcpuPerVm, inputs.ramGbPerVm, inputs.awsTerm);
  const awsMonthlyCompute = inputs.vmCount * awsSpec.monthlyCost;
  const awsMonthlyStorageAndEgress = inputs.includeAwsStorageAndEgress
    ? Math.round(totalRequiredStorageGb * 0.08 + 45 + totalRequiredStorageGb * 0.02)
    : 0;
  const awsMonthlyTotal = awsMonthlyCompute + awsMonthlyStorageAndEgress;
  const awsAnnualTotal = awsMonthlyTotal * 12;

  const onPremMonthlyOngoing = inputs.annualOpsAndPower / 12;
  const monthlyDelta = awsMonthlyTotal - onPremMonthlyOngoing;
  const breakEvenMonths =
    monthlyDelta > 0 ? Math.round((clusterUpfrontCost / monthlyDelta) * 10) / 10 : null;

  const yearlyProjection: YearlyCostPoint[] = [1, 2, 3, 4, 5].map((year) => {
    const onPremCumulative = clusterUpfrontCost + year * inputs.annualOpsAndPower;
    const awsCumulative = year * awsAnnualTotal;
    return {
      year,
      onPremCumulative,
      awsCumulative,
      netSavings: awsCumulative - onPremCumulative,
    };
  });

  const threeYearSavings = yearlyProjection[2].netSavings;
  const fiveYearSavings = yearlyProjection[4].netSavings;
  const selectedHorizonSavings = yearlyProjection[inputs.years - 1].netSavings;

  let fitAssessment: TcoResult["fitAssessment"];
  if (inputs.vmCount <= 2 && totalRequiredRamGb <= 16 && !inputs.includeAwsStorageAndEgress) {
    fitAssessment = {
      status: "consider-smaller-cloud",
      headline: "Consider a smaller cloud or single-host setup first",
      detail:
        "For 1–2 small VMs, a three-node Ceph cluster has an upfront hardware floor of $4,950. Unless you have strict on-site residency or LAN latency needs, a DigitalOcean droplet or single-host Proxmox node with Proxmox Backup Server is usually more economical.",
    };
  } else if (breakEvenMonths !== null && breakEvenMonths <= 18) {
    fitAssessment = {
      status: "strong-fit",
      headline: `Pays back hardware in ~${breakEvenMonths} months`,
      detail:
        "For steady, predictable workloads with on-site power and cooling, owning a three-node Proxmox + Ceph cluster converts perpetual cloud rent into a one-time board-approvable capital purchase with zero per-VM licensing.",
    };
  } else {
    fitAssessment = {
      status: "borderline",
      headline: "Evaluate operational ownership alongside hardware payback",
      detail:
        "Hardware payback stretches beyond 18 months under these assumptions. Private cloud still wins on data residency, LAN latency, and zero surprise egress bills, while cloud or smaller VPS providers stay attractive if workloads are spiky or you lack physical space.",
    };
  }

  return {
    inputs,
    nodeCount,
    ramPerNodeGb,
    nvmeTbPerNode: driveSizeTb,
    usableClusterStorageGb,
    usableClusterRamGb,
    totalRequiredRamGb,
    totalRequiredStorageGb,
    hardwareBom,
    clusterUpfrontCost,
    onPremAnnualOngoing: inputs.annualOpsAndPower,
    awsInstanceType: awsSpec.instanceType,
    awsMonthlyPerVm: awsSpec.monthlyCost,
    awsMonthlyCompute,
    awsMonthlyStorageAndEgress,
    awsMonthlyTotal,
    awsAnnualTotal,
    breakEvenMonths,
    threeYearSavings,
    fiveYearSavings,
    selectedHorizonSavings,
    yearlyProjection,
    fitAssessment,
  };
}

export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString("en-US")}`;
}
