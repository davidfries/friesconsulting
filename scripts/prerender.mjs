import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SSR_DIR = path.join(ROOT, ".ssr-dist");

function writeOutFile(relPath, content) {
  const fullPath = path.join(DIST_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function routeToHtmlFile(route) {
  if (route === "/") return "index.html";
  if (route === "/404.html") return "404.html";
  const clean = route.replace(/^\/+/, "").replace(/\/+$/, "");
  return path.join(clean, "index.html");
}

function buildHomeMarkdown(business, services, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lines = [
    `# ${business.legalName}`,
    "",
    `> ${business.description}`,
    "",
    business.overview,
    "",
    business.sectorFocus,
    "",
    "## Services",
    "",
    ...services.map(
      (s) => `- **${s.name}** (${baseUrl}/services/#${s.id}): ${s.summary}`
    ),
    "",
    "## Who we work with",
    "",
    ...business.audiences.map((a) => `- **${a.label}**: ${a.detail}`),
    "",
    "## Why open source matters here",
    "",
    business.openSourceRationale,
    "",
    "## Service area",
    "",
    `${business.serviceArea.summary} On-site: ${business.serviceArea.onSite.join(", ")}.`,
    "",
    "## How engagements work",
    "",
    business.engagementModel,
    "",
    "## Recent writing",
    "",
    ...posts.slice(0, 5).map(
      (p) => `- [${p.title}](${baseUrl}${p.url}) (${p.dateFormatted}): ${p.summary}`
    ),
    "",
    "## Contact",
    "",
    `Use the scoping form at ${baseUrl}${business.contactPath}. ${business.contactChannelNote}`,
    "",
  ];
  return lines.join("\n");
}

function buildServicesMarkdown(business, services, faqs) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lines = [
    `# Services — ${business.legalName}`,
    "",
    business.overview,
    "",
    ...services.flatMap((s) => [
      `## ${s.name}`,
      "",
      `*Category: ${s.category} · Canonical anchor: ${baseUrl}/services/#${s.id}*`,
      "",
      s.detailsMarkdown,
      "",
    ]),
    "## Technologies we work in",
    "",
    ...business.technologies.map((t) => `- **${t.category}**: ${t.items.join(", ")}`),
    "",
    "## Working with non-profits and schools",
    "",
    ...business.nonProfitRealities.map((r) => `- **${r.title}**: ${r.detail}`),
    "",
    "## Service area & engagement model",
    "",
    business.serviceArea.summary,
    "",
    business.engagementModel,
    "",
    business.pricingModel,
    "",
    "## Frequently asked questions",
    "",
    ...faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "## Contact",
    "",
    `Contact form: ${baseUrl}${business.contactPath}`,
    "",
  ];
  return lines.join("\n");
}

function buildPostsIndexMarkdown(business, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lines = [
    `# Writing & Case Studies — ${business.legalName}`,
    "",
    "Field notes from building private clouds, local LLM CIPA filter log pipelines, network audits, monitoring, and automation.",
    "",
    ...posts.flatMap((p) => [
      `## [${p.title}](${baseUrl}${p.url})`,
      "",
      `- Published: ${p.dateFormatted} · Reading time: ~${p.readingMinutes} min · Markdown: ${baseUrl}/posts/${p.slug}.md`,
      `- Summary: ${p.summary}`,
      p.keywords.length ? `- Keywords: ${p.keywords.join(", ")}` : "",
      "",
    ]),
  ];
  return lines.filter((line) => line !== undefined).join("\n");
}

function buildPostMarkdown(business, post) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lines = [
    `# ${post.title}`,
    "",
    `- Author: ${business.founder} (${business.legalName})`,
    `- Published: ${post.dateFormatted}`,
    post.lastmodFormatted ? `- Updated: ${post.lastmodFormatted}` : null,
    `- Canonical URL: ${baseUrl}${post.url}`,
    post.keywords.length ? `- Keywords: ${post.keywords.join(", ")}` : null,
    "",
    `> ${post.summary}`,
    "",
    post.markdown,
    "",
  ].filter((v) => v !== null);
  return lines.join("\n");
}

function buildCalculatorMarkdown(business) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  return [
    `# Private Cloud vs. AWS TCO Calculator — ${business.legalName}`,
    "",
    `Interactive estimator URL: ${baseUrl}/calculator/`,
    "",
    "Compares an owned three-node Proxmox VE + Ceph cluster against equivalent AWS EC2 compute.",
    "",
    "## Baseline Worked Example (from /posts/privatecloud/)",
    "",
    "- Workload: 6 VMs × (4 vCPU, 8 GB RAM, 500 GB storage)",
    "- Hardware: 3× Minisforum MS-01 (32 GB RAM, 2× 10 Gbps NICs, 3× 2 TB NVMe each) + 10 Gbps switch + DAC cabling = ~$4,950 upfront",
    "- Software licensing: Proxmox VE + Ceph = $0",
    "- Equivalent AWS compute: 6× c5.xlarge (1-year reserved @ ~$78/mo) = $468/mo (~$5,616/yr), excluding EBS, snapshots, and egress",
    "- Estimated hardware payback: ~10.6 months",
    "",
    `To scope a cluster for your organization, use ${baseUrl}${business.contactPath}.`,
    "",
  ].join("\n");
}

function buildContactMarkdown(business) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  return [
    `# Contact — ${business.legalName}`,
    "",
    business.contactChannelNote,
    "",
    "## What to include in an inquiry",
    "",
    ...business.contactChecklist.map((item, i) => `${i + 1}. **${item.title}** — ${item.description}`),
    "",
    `Form endpoint (HTML): ${baseUrl}${business.contactPath}`,
    `Service area: ${business.serviceArea.summary}`,
    business.responsePromise,
    "",
  ].join("\n");
}

function buildLlmsTxt(business, services, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  return [
    `# ${business.legalName}`,
    "",
    `> ${business.description}`,
    "",
    `${business.overview}`,
    "",
    `${business.sectorFocus}`,
    "",
    `- Website: ${baseUrl}/`,
    `- Contact: web form at ${baseUrl}${business.contactPath} (only public contact channel; no public email address or phone number)`,
    `- On-site service area: ${business.serviceArea.onSite.join(", ")}`,
    `- Remote service area: ${business.serviceArea.remote}`,
    `- Clients: non-profits, charter schools and K-12 schools, small businesses up to ~50 staff`,
    `- E-Rate: ${business.eRateSummary}`,
    `- CIPA: ${business.cipaSummary}`,
    `- Engagement model: ${business.engagementModel}`,
    `- Pricing: ${business.pricingModel}`,
    "",
    "## Machine-readable endpoints",
    "",
    `- [Full-text site dossier](${baseUrl}/llms-full.txt): complete services, FAQs, and all technical posts in one Markdown document`,
    `- [Structured business profile](${baseUrl}/business.json): JSON profile, audiences, technologies, FAQs, and contact schema`,
    `- [Service catalog](${baseUrl}/services.json): structured JSON list of all 14 services`,
    `- [A2A Agent Card](${baseUrl}/.well-known/agent-card.json): A2A v1.0 discovery card`,
    `- [Private Cloud TCO Calculator](${baseUrl}/calculator.md): baseline Proxmox + Ceph vs. AWS numbers`,
    "",
    "## Services",
    "",
    ...services.map(
      (s) => `- [${s.name}](${baseUrl}/services/#${s.id}): ${s.summary}`
    ),
    "",
    "## Technologies",
    "",
    ...business.technologies.map((t) => `- ${t.category}: ${t.items.join(", ")}`),
    "",
    "## Key pages (HTML and Markdown alternates)",
    "",
    `- [Home](${baseUrl}/) ([Markdown](${baseUrl}/index.md))`,
    `- [Services & FAQ](${baseUrl}/services/) ([Markdown](${baseUrl}/services.md))`,
    `- [Writing & Case Studies](${baseUrl}/posts/) ([Markdown](${baseUrl}/posts.md))`,
    `- [Private Cloud vs. AWS TCO Calculator](${baseUrl}/calculator/) ([Markdown](${baseUrl}/calculator.md))`,
    `- [Contact](${baseUrl}/contact/) ([Markdown](${baseUrl}/contact.md))`,
    "",
    "## Writing",
    "",
    ...posts.map(
      (p) =>
        `- [${p.title}](${baseUrl}${p.url}) (${p.dateFormatted}, [Markdown](${baseUrl}/posts/${p.slug}.md)): ${p.summary}`
    ),
    "",
    "## Contacting Fries Consulting Services",
    "",
    business.contactChannelNote,
    "",
    "A first message gets a substantive reply when it states:",
    ...business.contactChecklist.map((c, idx) => `${idx + 1}. ${c.title}: ${c.description}`),
    "",
    business.responsePromise,
    "",
  ].join("\n");
}

function buildLlmsFullTxt(business, services, faqs, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const parts = [
    `# ${business.legalName} — Complete Site Dossier`,
    "",
    `> ${business.description}`,
    "",
    `Canonical URL: ${baseUrl}/`,
    `Contact form: ${baseUrl}${business.contactPath}`,
    `Service area: ${business.serviceArea.summary}`,
    "",
    "---",
    "",
    buildServicesMarkdown(business, services, faqs),
    "---",
    "",
    buildCalculatorMarkdown(business),
    "---",
    "",
    buildContactMarkdown(business),
    "---",
    "",
    "# Technical Writing & Case Studies",
    "",
    ...posts.flatMap((p) => [buildPostMarkdown(business, p), "---", ""]),
  ];
  return parts.join("\n");
}

function buildAgentCard(business, services) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  return {
    name: "Fries Consulting Services",
    description: business.description,
    version: "2.0.0",
    provider: {
      organization: business.legalName,
      name: business.legalName,
      url: `${baseUrl}/`,
      support_contact: `${baseUrl}${business.contactPath}`,
    },
    documentationUrl: `${baseUrl}/llms.txt`,
    supportedInterfaces: [
      {
        url: `${baseUrl}/business.json`,
        protocolBinding: "HTTP+JSON",
        protocolVersion: "1.0",
        description: "Read-only structured business profile, services, FAQs, and scoping contact requirements.",
      },
      {
        url: `${baseUrl}/services.json`,
        protocolBinding: "HTTP+JSON",
        protocolVersion: "1.0",
        description: "Read-only structured catalog of all 14 IT infrastructure consulting services.",
      },
    ],
    capabilities: {
      a2aVersion: "1.0",
      streaming: false,
      pushNotifications: false,
    },
    authentication: {
      schemes: ["none"],
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/markdown", "text/html", "application/json"],
    skills: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.summary,
      tags: [s.category, ...s.tags, ...s.audiences],
      url: `${baseUrl}/services/#${s.id}`,
    })),
    contactChannel: {
      type: "web-form",
      url: `${baseUrl}${business.contactPath}`,
      note: business.contactChannelNote,
      requiredFields: ["name", "email", "message"],
      recommendedContext: business.contactChecklist.map((c) => c.title),
    },
  };
}

function buildBusinessJson(business, services, faqs, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    legalName: business.legalName,
    name: business.name,
    shortName: business.shortName,
    founder: business.founder,
    website: `${baseUrl}/`,
    description: business.description,
    overview: business.overview,
    sectorFocus: business.sectorFocus,
    eRateSummary: business.eRateSummary,
    cipaSummary: business.cipaSummary,
    openSourceRationale: business.openSourceRationale,
    engagementModel: business.engagementModel,
    pricingModel: business.pricingModel,
    responsePromise: business.responsePromise,
    serviceArea: business.serviceArea,
    audiences: business.audiences,
    engagementShapes: business.engagementShapes,
    engagementSteps: business.engagementSteps,
    nonProfitRealities: business.nonProfitRealities,
    technologies: business.technologies,
    contact: {
      url: `${baseUrl}${business.contactPath}`,
      note: business.contactChannelNote,
      checklist: business.contactChecklist,
    },
    servicesCount: services.length,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      audiences: s.audiences,
      url: `${baseUrl}/services/#${s.id}`,
      primaryUrl: `${baseUrl}${s.primaryUrl}`,
      summary: s.summary,
      tags: s.tags,
    })),
    faqs: faqs.map((f) => ({
      question: f.q,
      answer: f.answerPlain,
    })),
    writing: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      url: `${baseUrl}${p.url}`,
      markdownUrl: `${baseUrl}/posts/${p.slug}.md`,
      datePublished: p.date,
      dateModified: p.lastmod,
      summary: p.summary,
      keywords: p.keywords,
    })),
    discovery: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      agentCard: `${baseUrl}/.well-known/agent-card.json`,
      servicesJson: `${baseUrl}/services.json`,
      sitemapXml: `${baseUrl}/sitemap.xml`,
      rssXml: `${baseUrl}/rss.xml`,
      calculator: `${baseUrl}/calculator/`,
    },
  };
}

function buildRobotsTxt(business) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lines = [
    `# ${business.legalName} — ${baseUrl}/`,
    "# IT infrastructure consulting. Denver and Northern Colorado on-site,",
    `# United States remote. Contact: ${baseUrl}${business.contactPath}`,
    "#",
    "# All crawlers, including AI assistants and agents, are welcome on this site.",
    `# Plain-text index: ${baseUrl}/llms.txt`,
    `# Full-text dossier: ${baseUrl}/llms-full.txt`,
    `# Structured business JSON: ${baseUrl}/business.json`,
    `# A2A Agent Card: ${baseUrl}/.well-known/agent-card.json`,
    "",
    "User-agent: *",
    "Allow: /",
    "",
    "# AI crawlers and assistants, named explicitly so there is no ambiguity.",
    ...business.aiCrawlers.flatMap((bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ];
  return lines.join("\n");
}

function buildSitemapXml(business, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const newestPostDate = posts[0]?.lastmod ?? posts[0]?.date ?? new Date().toISOString();

  const entries = [
    { loc: `${baseUrl}/`, lastmod: newestPostDate, priority: "1.0" },
    { loc: `${baseUrl}/services/`, lastmod: newestPostDate, priority: "0.9" },
    { loc: `${baseUrl}/posts/`, lastmod: newestPostDate, priority: "0.8" },
    { loc: `${baseUrl}/calculator/`, lastmod: newestPostDate, priority: "0.8" },
    { loc: `${baseUrl}/contact/`, lastmod: newestPostDate, priority: "0.8" },
    ...posts.map((p) => ({
      loc: `${baseUrl}${p.url}`,
      lastmod: p.lastmod || p.date,
      priority: "0.7",
    })),
  ];

  const urlsXml = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;
}

function buildRssXml(business, posts) {
  const baseUrl = business.baseUrl.replace(/\/+$/, "");
  const lastBuild = posts[0] ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const itemsXml = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(`${baseUrl}${p.url}`)}</link>
      <guid isPermaLink="true">${escapeXml(`${baseUrl}${p.url}`)}</guid>
      <pubDate>${escapeXml(new Date(p.date).toUTCString())}</pubDate>
      <description>${escapeXml(p.description || p.summary)}</description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(business.title)}</title>
    <link>${escapeXml(`${baseUrl}/`)}</link>
    <description>${escapeXml(business.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`;
}

async function main() {
  const templateHtml = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
  const entryServerPath = pathToFileURL(path.join(SSR_DIR, "entry-server.js")).href;
  const {
    render,
    getPrerenderRoutes,
    getPageMeta,
    renderHeadTagsHtml,
    business,
    services,
    faqs,
    posts,
  } = await import(entryServerPath);

  const routes = getPrerenderRoutes();

  for (const route of routes) {
    const appHtml = render(route);
    const meta = getPageMeta(route);
    let headTags = renderHeadTagsHtml(meta);

    if (route === "/posts/welcome/") {
      headTags += `\n    <meta http-equiv="refresh" content="0; url=/services/" />`;
    }

    const finalHtml = templateHtml
      .replace("<!--head-tags-->", headTags)
      .replace("<!--app-html-->", appHtml);

    writeOutFile(routeToHtmlFile(route), finalHtml);
  }

  // Per-route clean Markdown alternates (written both as <route>.md and <route>/index.md for B2 compatibility)
  const markdownPages = [
    { slugPath: "index", content: buildHomeMarkdown(business, services, posts) },
    { slugPath: "services", content: buildServicesMarkdown(business, services, faqs) },
    { slugPath: "posts", content: buildPostsIndexMarkdown(business, posts) },
    { slugPath: "calculator", content: buildCalculatorMarkdown(business) },
    { slugPath: "contact", content: buildContactMarkdown(business) },
    ...posts.map((post) => ({
      slugPath: `posts/${post.slug}`,
      content: buildPostMarkdown(business, post),
    })),
  ];

  for (const page of markdownPages) {
    if (page.slugPath === "index") {
      writeOutFile("index.md", page.content);
    } else {
      writeOutFile(`${page.slugPath}.md`, page.content);
      writeOutFile(`${page.slugPath}/index.md`, page.content);
    }
  }

  // Machine-readable discovery suite
  writeOutFile("llms.txt", buildLlmsTxt(business, services, posts));
  writeOutFile("llms-full.txt", buildLlmsFullTxt(business, services, faqs, posts));
  writeOutFile(
    ".well-known/agent-card.json",
    JSON.stringify(buildAgentCard(business, services), null, 2) + "\n"
  );
  writeOutFile(
    "business.json",
    JSON.stringify(buildBusinessJson(business, services, faqs, posts), null, 2) + "\n"
  );
  writeOutFile(
    "services.json",
    JSON.stringify(
      {
        provider: business.legalName,
        url: `${business.baseUrl}/services/`,
        count: services.length,
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          audiences: s.audiences,
          url: `${business.baseUrl}/services/#${s.id}`,
          primaryUrl: `${business.baseUrl}${s.primaryUrl}`,
          summary: s.summary,
          tags: s.tags,
        })),
      },
      null,
      2
    ) + "\n"
  );

  writeOutFile("robots.txt", buildRobotsTxt(business));
  writeOutFile("sitemap.xml", buildSitemapXml(business, posts));

  const rssXml = buildRssXml(business, posts);
  writeOutFile("rss.xml", rssXml);
  writeOutFile("index.xml", rssXml);

  fs.rmSync(SSR_DIR, { recursive: true, force: true });
  console.log(
    `Pre-rendered ${routes.length} HTML routes, ${markdownPages.length} Markdown alternates, and agent discovery suite into dist/.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
