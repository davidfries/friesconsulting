---
title: "Reading the Filter Logs: A Local LLM for CIPA Compliance"
date: 2026-09-16T10:00:00-06:00
draft: false
description: "A working deployment at a charter school: a self-hosted language model on Ollama and a single NVIDIA GPU categorizing content filter traffic for roughly 500 students, evidencing the CIPA monitoring requirement and feeding a staff dashboard. Student browsing data never leaves the building. Includes real throughput, cost and classification figures from production."
summary: "A content filter produces more log volume than any school staff member will ever read, which makes the CIPA monitoring requirement hard to satisfy in practice. This is a working system at a charter school: rules and cache absorb about 99 percent of URLs, a local model on one consumer GPU classifies the rest, and staff get a dashboard in plain language. No student browsing history leaves the building."
keywords: ["CIPA compliance", "content filter logs", "local LLM", "Ollama", "NVIDIA GPU", "self-hosted AI", "K-12 IT", "charter school", "student data privacy", "Grafana dashboard", "log analysis", "filter evasion"]
---

Every school running a content filter is sitting on a data set nobody reads. The filter logs every request it blocks and most of what it allows, which across a few hundred one-to-one devices comes to hundreds of thousands of events a week. CIPA requires that the school monitor the online activity of minors. In practice, monitoring frequently means the logs exist and someone could look at them, which is a weaker position than it sounds when a funding review or an incident asks what you actually knew.

The problem is not that the data is missing. The problem is that the signal in it — a filter category miscoded badly enough to block legitimate coursework, a student persistently probing for a way around the filter, a pattern a counselor genuinely needs to see — is buried under an enormous volume of ordinary traffic that means nothing at all.

We built a system to solve this for a charter school we work with. Everything below is from that deployment, running against roughly 500 students.

## Why it has to run locally

The records in question tie students, or device identifiers that resolve to students, to their browsing history. That is about as sensitive as school data gets. Sending it to a hosted API means shipping minors' browsing behavior to a vendor, which raises student data privacy questions most schools would rather not have to answer, and which many are contractually or legally unable to answer favorably.

Running the model on a machine in the building removes the question entirely. The logs never leave, no vendor agreement governs them, and the data protection story is the same one the school already tells about the filter appliance itself.

Volume makes the same argument from the other direction. The deployment below processes around a quarter of a million events a week. Classifying that through a metered API is a real and recurring expense that grows with enrollment. On owned hardware it costs electricity.

## Not everything goes to the model

This is the part that makes the whole thing affordable, and it is the design decision we would most want another engineer to take away from this post.

A language model is the most expensive way to identify a URL, so it should be the last thing you reach for. Traffic hits a rule engine first, which resolves anything matching a known pattern. What survives that hits a cache, because the same few thousand domains recur endlessly in a school. Only genuinely novel URLs reach the model.

![Grafana panel titled Resolution funnel, showing URLs per minute resolved by rule, cache and LLM across a school day. Rule averages 48.88 URLs per minute, cache 7.26, and the LLM 0.68.](/images/cipa-pipeline/resolution-funnel.png)

*Rules carry 48.88 URLs/min on average and the cache another 7.26. The model sees 0.68 — a little over one percent of the total.*

That ratio is why a single consumer GPU keeps up with a school of 500 students without breaking a sweat. It also means the model's cost and latency barely matter, because it is on the rare path rather than the hot one. Build the funnel first and the hardware question mostly answers itself.

![Grafana panel titled Throughput, showing request rate across a school day, sustaining roughly two to four requests per second with sharp dips around 07:00, 08:00, 09:00 and 12:00.](/images/cipa-pipeline/throughput.png)

*Sustained throughput across a school day. The dips are passing periods and lunch, which is a useful sanity check that you are looking at real student traffic rather than something automated.*

## The hardware

This is a smaller build than people expect. The constraint is VRAM rather than compute, because a model has to fit in video memory to run at a sensible speed, and once it fits, a mid-range consumer card classifies text faster than the filter produces novel URLs.

At four-bit quantization an 8-billion-parameter model wants roughly 6 GB and a 14B model roughly 10 GB, which puts both comfortably inside a 16 GB consumer card. Classification is undemanding work for a model of that size, and this is not a task that needs a frontier model. Consumer RTX hardware is far better value here than a datacenter accelerator, which costs several times more and buys almost nothing for a workload this shape.

![Grafana panel titled Generation throughput, showing tokens per second across a day with a mean of 68.1 tokens per second.](/images/cipa-pipeline/generation-throughput.png)

*68.1 tokens per second on average. Given the funnel above, that is far more headroom than the workload needs.*

The card does not need a dedicated machine either. If the school already runs a [Proxmox cluster](/posts/privatecloud/), passing the GPU through to a single Linux VM is a perfectly reasonable home for it.

Ollama is what makes this manageable operationally. It pulls and serves models over a local HTTP API, and that API is OpenAI-compatible, so the integration work is the same work you would write against any hosted model. If the school ever wants to move the workload, it is a base URL change rather than a rewrite.

## What the model produces

The categories are the school's, not a vendor's. That distinction matters more than it sounds, because filter vendors categorize for the entire internet while a school cares about a much narrower set of questions.

![Grafana panel titled Classifications by category, a horizontal bar chart. School admin and search lead at about 10,000 each, followed by productivity at 9,000, system browser and games or entertainment at 6,000 each, academic LMS at 4,000, then smaller categories including proxy bypass at 274 and social media at 130.](/images/cipa-pipeline/classifications-by-category.png)

*The engineering view of classification output. Most traffic is exactly what you would hope for in a school, which is itself worth being able to demonstrate.*

Four kinds of finding matter in practice. **Filter mistakes** are the ones staff appreciate most, because every research database or curriculum tool wrongly blocked is a teacher who lost twenty minutes of a lesson. **Bypass attempts** show up as proxy and VPN traffic, worth tracking as a pattern rather than chased as individual incidents. **Policy-relevant patterns** are the material CIPA actually concerns itself with. **Welfare signals** — searches suggesting self-harm, bullying or crisis — matter more than everything else combined, and route to a human immediately rather than waiting for a weekly summary.

## Two dashboards, two audiences

The panels above are the engineering view, and they are in the language engineers want: `games_entertainment`, `proxy_bypass`, URLs per minute. That view exists so we can tell whether the pipeline is healthy.

It is the wrong view for a principal. Staff get a separate dashboard built around the questions they actually ask, in the words they actually use.

![Staff dashboard overview showing four cards: filter evasion 969 events from proxies, VPNs and unblockers, up 33 percent on the previous seven days; off task 26,000 events across games, social media and shopping, up 35 percent; 388 students involved of 505 seen, of whom 91 were evading the filter; and 241,000 total activity events, 11 percent of it off task or evasion. Below, a chart of activity over time across seven days.](/images/cipa-pipeline/staff-dashboard-overview.png)

*A week at a glance. Aggregate by default, with week-over-week movement, because a number without a direction is not actionable.*

Everything on that screen is aggregate. No student is named anywhere in the default view, and the individual detail behind a welfare flag sits on a defined escalation path available to a designated counselor or administrator and to nobody else. Role-based access is not a nice-to-have here. The dashboard should make the aggregate case easy and the individual case deliberate.

![Staff dashboard panel titled What students were doing, listing categories with event counts and student counts: school systems 50,541 across 501 students, docs and files 38,016, web searches 36,590, browser pages 31,775, games and video 24,602, coursework 22,527, learning tools 18,691, email and chat 5,754, research and reference 5,210, unclassified 4,369, shopping 1,087, filter evasion 969 across 91 students, AI assistants 631, social media 592.](/images/cipa-pipeline/staff-dashboard-categories.png)

*The same classification data as the engineering panel, rewritten for people who do not think in snake case. Note the second number on each row: 969 filter evasion events sounds alarming until you see it came from 91 students, and one determined student generates a lot of events.*

That last point is why both numbers are on every row. Event counts describe the traffic; student counts describe the problem. A category with a large event count and a tiny student count is one or two people, and a category with a small event count spread across hundreds of students is something else entirely.

![Staff dashboard panel titled What was downloaded, judging file type from name, type and source. Documents 1,242 across 190 students, images or video 501 across 80 students, archives 10, unidentified 7, game or emulator 2, code or script 2. Below, a breakdown of where the downloads came from, led by docs and files at 535 and school systems at 524.](/images/cipa-pipeline/staff-dashboard-downloads.png)

*Downloads, classified by what the file actually appears to be rather than by extension. The long tail is the interesting part — two game or emulator downloads and two scripts, against 1,242 ordinary documents.*

## What this does for compliance

CIPA conditions [E-Rate discounts](/services/#e-rate-funding-and-cipa-compliance) on a technology protection measure, an internet safety policy, and monitoring of minors' online activity. Most schools have the first two comfortably. The third is where the evidence tends to be thin.

A pipeline like this produces the record. It demonstrates that the filter is doing what the policy says it does, it generates a documented review cadence rather than an assertion that someone checks occasionally, and it surfaces the gap between written policy and actual filter behavior — which, in our experience, is the single most common finding when anyone looks properly. A filter configured years ago and never reviewed since is the usual starting condition, and it is a funding risk as much as a safety one.

The design choices above are worth stating plainly as policy, not just architecture. A system like this is student monitoring, and how far a school goes beyond CIPA's baseline belongs to the school and its board rather than being a default the technology quietly sets. The internet safety policy should describe what is monitored and how long it is retained, families should be able to read that policy, and the retention window should be short enough to defend. We build to whatever the school decides, and we will raise it if nobody has decided.

## Where this is the wrong tool

The model is doing triage, not judgment. It will flag things that turn out to be nothing and occasionally miss something a person would have caught, which is why every welfare signal goes to a human and why none of this should ever be wired to an automatic consequence for a student. Discipline decisions belong to people who know the student.

A school with fifty devices and a filter console somebody already reviews weekly does not need any of this and should not buy a GPU to solve a problem it does not have. The build makes sense at the point where log volume has outgrown the attention available to read it, which for most schools arrives somewhere around a full one-to-one program.

## How Fries Consulting can help

We build these end to end: sizing and sourcing the GPU, standing up Ollama and selecting a model that suits both the card and the task, writing the rule and cache layers that keep the model off the hot path, building the ingest and classification pipeline against your particular filter, and producing the dashboards your staff will actually open. It pairs naturally with the [E-Rate and CIPA work](/services/#e-rate-funding-and-cipa-compliance) and the [network audit](/posts/network-audit/) that usually precedes it.

If this sounds like something that interests you, please feel free to reach out at the [contact form](/contact/) to see how Fries Consulting can help.
