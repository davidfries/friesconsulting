---
title: "Creating Your Own Private Cloud with Proxmox Virtualization Cluster and Ceph for Distributed Storage"
date: 2025-03-26T16:45:00+00:00
draft: false
description: "How a non-profit, school, or small business can build a private cloud on a Proxmox VE cluster with Ceph distributed storage, including an itemized three-node hardware build at roughly $4,950 and a direct cost comparison against equivalent AWS compute."
summary: "A three-node Proxmox VE cluster with Ceph distributed storage gives a small organization clustering, live migration, VM high availability and node-failure-tolerant storage on hardware it owns. Itemized, the build comes to roughly $4,950, against roughly $5,600 a year for equivalent AWS compute alone."
keywords: ["private cloud", "Proxmox", "Ceph", "distributed storage", "virtualization cluster", "on-premises", "cloud repatriation", "AWS cost comparison", "high availability"]
---

A private cloud on Proxmox VE with Ceph distributed storage gives you most of what people actually go to the cloud for: clustering, live migration, VM-level high availability, and storage that survives losing a node — all of it on hardware you own, with no hourly billing attached. For a steady and predictable set of workloads, the arithmetic frequently favors owning it outright.

Here is what that looks like, itemized.

## Why a private cloud

**Data stays in your infrastructure.** Your data lives on hardware you control, and each VM runs isolated on the Proxmox virtualization layer. Where contractual or regulatory constraints govern data residency, owning the hardware removes an entire category of question before it is asked.

**Cost is capital, not perpetual.** Setup requires investment in hardware and expertise up front, but after that you stop paying hourly VM rates, per-GB storage charges and egress fees altogether. Past the break-even point your running cost is power, cooling and eventual hardware replacement.

For a non-profit or a school this distinction is frequently the whole argument. A one-time purchase is a line item a board can approve and be done with, whereas a subscription that grows at every renewal is a permanent claim on a budget that does not grow alongside it. Proxmox and Ceph carry no per-VM, per-socket or per-seat licensing at all, so that recurring cost simply never appears.

**Performance is local.** Proxmox manages resources efficiently and Ceph serves storage quickly, which matters most for latency-sensitive workloads such as databases and file services that suffer noticeably when they sit a WAN hop away from the people using them.

**It scales by adding nodes.** When you need more capacity you add a node; Ceph rebalances and Proxmox picks up the compute. That lets you size for today rather than over-provisioning against a forecast that may never arrive.

**It tolerates failure.** Ceph's distributed replication keeps data available when hardware dies, and Proxmox clustering fails VMs over between nodes, which amounts to high availability without an enterprise SAN sitting underneath it.

**You control the configuration.** Custom security requirements, unusual resource allocations, a specific network topology: all available, because nothing sits behind a provider's abstraction.

## A worked example: three-node cluster

Consider an organization that needs several Windows VMs — Active Directory, an SMB file server, MSSQL with reporting, and an HA failover for each of them — plus a firewall VM and a Docker host running Grafana and Prometheus for monitoring.

**Per node:**

| Component | Spec | Cost |
| --- | --- | --- |
| Chassis | Minisforum MS-01, 32 GB RAM, 2x 10 Gbps NICs | ~$850 |
| Storage | 3x 2 TB NVMe (M.2) | ~$600 |
| **Node total** | | **~$1,450** |

**Cluster-wide:**

| Component | Cost |
| --- | --- |
| 3x nodes | ~$4,350 |
| 10 Gbps switch | ~$500 |
| Cabling | ~$100 |
| Proxmox VE and Ceph (open source) | $0 |
| **Cluster total** | **~$4,950** |

Two 10 Gbps NICs per node matters here, because Ceph replication traffic and VM traffic should never be contending for the same link.

## Against equivalent AWS compute

That cluster comfortably runs six VMs at 4 cores and 8 GB RAM with 500 GB storage each, with room to grow.

The closest AWS equivalent is a c5.xlarge, which gives you the same 4 vCPU and 8 GiB. On a one-year reserved term that runs somewhere around $78 per month at the time of writing, so six of them comes to roughly $468 per month, or about **$5,600 per year**. That figure is compute alone. It excludes EBS volumes, egress, snapshots, load balancing and the rest of the line items that accumulate quietly on an AWS invoice.

The cluster pays for itself inside the first year and keeps paying afterward, and the gap widens once storage and data transfer enter the picture.

There are honest caveats. You own the hardware lifecycle, you need somewhere with power and cooling to put it, and somebody has to be responsible for it day to day. That last part is exactly the work we do, but it should be priced in rather than comparing a cloud invoice against a hardware receipt and stopping there.

## Is this right for you?

A private cloud fits best when your workloads are steady and predictable, when your data carries residency or latency requirements, when you already pay a cloud bill large enough to amortize hardware against, or when you are exiting VMware licensing and re-evaluating the whole stack anyway.

It fits worst when your load is spiky and unpredictable, when you genuinely need managed services you would otherwise have to build and run yourself, or when you have nowhere suitable to put hardware in the first place.

If this sounds like something that interests you, please feel free to reach out at the [contact form](/contact/) to see how Fries Consulting can help with your private cloud needs.
