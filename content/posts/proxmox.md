---
title: "Proxmox"
date: 2024-01-11T23:18:08-07:00
draft: false
lastmod: 2025-03-26T16:45:00+00:00
description: "VMware to Proxmox VE migration for non-profits, schools, and small businesses after the Broadcom acquisition. Fries Consulting Services handles cluster design, VM migration, Ceph backend storage, and backup strategy."
summary: "Broadcom's VMware licensing changes have priced virtualization out of reach for many small and mid-sized businesses. Proxmox VE is a credible destination: KVM-based, open source, familiar to anyone who has run vSphere, and far less restrictive about hardware."
keywords: ["Proxmox", "VMware migration", "Broadcom VMware", "Proxmox VE", "hypervisor", "Ceph", "virtualization", "Proxmox Backup Server", "Veeam"]
---

## So long, VMware

Broadcom now owns VMware, and organizations of every size are scrambling over license renewal and support. Costs have risen sharply while support quality has gone the other way. So what is the next step? If you ask Fries Consulting, the answer is Proxmox.

Proxmox VE is a free, open-source hypervisor built on Debian and KVM, with a look and feel familiar enough that most vSphere administrators find their footing quickly. Moving VMs across is by now a well-trodden path.

## What about small and medium sized businesses?

VMware by Broadcom is primarily interested in keeping its largest customers, and licensing has been repriced well past what many smaller organizations can justify. Non-profits and schools have been hit hardest of all, since a renewal quote that multiplies overnight lands against a budget that was fixed a year earlier and cannot absorb it.

Proxmox is a genuinely good alternative for these organizations, and our favorite feature is the sheer range of hardware it will run on. Our own lab cluster consists of a laptop, a Lenovo mini PC and a nested VM on an Unraid server, which is worth contrasting against VMware's restrictive hardware compatibility list. You can build a cluster out of what makes sense for your budget rather than out of what appears on somebody's approved list.

## The elephant in the room: backups

Proxmox has a built-in backup facility that is straightforward to use: set a schedule, point it at a storage location, and you are running. For an organization without much budget for backup tooling, that alone covers a lot of ground. The one caveat is that `vzdump` produces full VM backups rather than incremental ones, which starts to have real storage and backup-window implications as your VM count grows.

Two things address that:

- **Proxmox Backup Server** performs incremental, deduplicated backups with verification, which removes the `vzdump` full-backup limitation entirely on its own.
- **Veeam Backup & Replication** added native Proxmox VE support in version 12.2, so anyone already standardized on Veeam no longer needs a second backup product to cover their Proxmox estate.

*Note: this post was written in January 2024, before either option above was as mature as it is now. If you evaluated Proxmox backups then, and the full-backup limitation is what stopped you, it is worth a second look.*

## How can Fries Consulting help?

We handle VMware to Proxmox migrations end to end, covering cluster design, VM migration, backend network storage and backup strategy. For a new cluster build we generally recommend [Ceph for the backend storage](/posts/privatecloud/), since it gives you a robust distributed storage layer that scales out by adding nodes rather than by forklifting the whole array.

If this sounds like something that interests you, please feel free to reach out at the [contact form](/contact/) to see how Fries Consulting can help with your VMware to Proxmox migration needs.
