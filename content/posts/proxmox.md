---
title: "Proxmox"
date: 2024-01-11T23:18:08-07:00
draft: false
---

# Proxmox, VMWare, and Broadcom

## _So long, VMWare_

It's 2024, and we live in a world where Broadcom now owns VMWare. Enterprises are scrambling on next steps for license renewal and support. The cost of VMWare has skyrocketed, and the support has gone down the drain. What is the next step? If you ask Fries Consulting, we would say Proxmox. Proxmox is a free, open-source hypervisor that is based on Debian. It has a similar look and feel to VMWare, and it is very easy to migrate VMs from VMWare to Proxmox.

## _What about small/medium sized businesses?_

VMWare by Broadcom is only interested in keeping their largest customers. They have raised the price of their licensing to the point where it is no longer feasible for small/medium sized businesses to use their product. Proxmox is a great alternative for these businesses. Our favorite feature of Proxmox is the amazing amount of hardware it can run on. For example, our lab cluster is made up of a laptop, a Lenovo Mini-PC, and a nested VM on an Unraid server. This shows how versatile Proxmox is over the very restricitve hardware compatibility list of VMWare.

## _The Elephant in the Room: Backups_

Proxmox has a built-in backup solution that is very easy to use. It is a simple matter of setting up a backup schedule and pointing it to a storage location. This is a great solution for small/medium sized businesses that do not have a large budget for backup solutions. These are full VM backups, that are unfortunately not incremental. At the time of writing this post, Veeam is staritng to look into supporting Proxmox. FCS will also be doing an investigation on using the native KVM support that Veeam already has to backup VMs on Proxmox.

## _How can Fries Consulting help?_

Fries Consulting Services can help with the migration from VMWare to Proxmox. We can also help with the setup of a Proxmox cluster, as well as the backend network storage. We can also help with the setup of a backup solution for your Proxmox cluster. For a new Proxmox cluster build, we recommend using a Ceph cluster for the backend storage. This will allow for a very robust storage solution that can be scaled out as needed.

If this sounds like something that interests you, please feel free to reach out at the [contact form](/contact/) to see how Fries Consulting can help with your VMWare to Proxmox migration needs.
