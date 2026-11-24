---
title: "Monitoring"
date: 2022-01-11T23:14:26-05:00
draft: false
description: "Infrastructure monitoring and alerting for non-profits, schools, and businesses from Fries Consulting Services, using open-source Grafana, InfluxDB, and Telegraf. Percentage-based thresholds and suppression during scheduled operations avoid alert fatigue — alerting with purpose."
summary: "Infrastructure monitoring and alerting is the first line of defense against malware spread and system unavailability. Grafana, InfluxDB, and Telegraf are a common stack for visualization, alarms, and alerting. The goal is alerting with purpose: an alert should fire only when someone needs to act."
keywords: ["infrastructure monitoring", "alerting", "Grafana", "InfluxDB", "Telegraf", "Prometheus", "alert fatigue", "uptime monitoring"]
---

## Why is it important?

Infrastructure monitoring and alerting is something that all organizations, from small to large, should strive to do. It can be the first line of defense when it comes to malware spread or system unavailability. There are many solutions to monitoring depending on the current infrastructure. Grafana, InfluxDB, and Telegraf are a common stack for visualization, alarms, and alerting to your endpoint of choice. Implementing all of these technologies together can be a daunting task; however, starting with a goal in mind and working piece by piece is the way to accomplish what we like to call "alerting with purpose".

The one thing that causes pause to many organizations is "alert fatigue". This is the concept of receiving too many alerts for either things that are asinine, or having alerts that are triggered during certain scheduled operations (i.e. database backups, Windows Server updates, etc.). It should be the goal of all alarms to only trigger when it is truly necessary. A great way of doing this is using percentage-based alerts instead of absolute values.

## What should I monitor?

Some important metrics to watch are the average records in a database or even average network throughput in the 95th percentile. This will tell you if you potentially are starting to either have data issues or network issues before they become a downtime-causing problem. Latency and uptime monitoring of internal/external applications is also very important. If you were to start having quality issues with your ISP, would you be able to provide historical data to their support staff?

If this sounds like something that interests you, please feel free to reach out at the [contact form](/contact/) to see how Fries Consulting can help with your infrastructure monitoring needs.
