import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import { prefersMarkdown, resolveB2Target, handleRequest } from "../cloudflare/worker.js";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const EXPECTED_POSTS = [
  "local-llm",
  "privatecloud",
  "small-clouds",
  "awsiac",
  "proxmox",
  "monitoring",
  "automation",
  "inventory",
  "network-audit",
];

const EXPECTED_IMAGES = [
  "banner.jpg",
  "cipa-pipeline/classifications-by-category.png",
  "cipa-pipeline/generation-throughput.png",
  "cipa-pipeline/resolution-funnel.png",
  "cipa-pipeline/staff-dashboard-categories.png",
  "cipa-pipeline/staff-dashboard-downloads.png",
  "cipa-pipeline/staff-dashboard-overview.png",
  "cipa-pipeline/throughput.png",
];

function readDist(relPath) {
  const fullPath = path.join(DIST, relPath);
  assert.ok(fs.existsSync(fullPath), `Missing expected dist file: ${relPath}`);
  return fs.readFileSync(fullPath, "utf8");
}

function extractJsonLd(html, relPath) {
  const match = html.match(/<script id="fcs-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, `Missing #fcs-jsonld script in ${relPath}`);
  const parsed = JSON.parse(match[1].replace(/\\u003c/g, "<"));
  assert.ok(Array.isArray(parsed["@graph"]), `Expected @graph array in JSON-LD of ${relPath}`);
  return parsed["@graph"];
}

async function verifyHtmlRoutes() {
  const coreRoutes = [
    { file: "index.html", types: ["WebPage"] },
    { file: "services/index.html", types: ["WebPage", "FAQPage", "BreadcrumbList"] },
    { file: "posts/index.html", types: ["CollectionPage", "BreadcrumbList"] },
    { file: "calculator/index.html", types: ["WebPage", "WebApplication", "BreadcrumbList"] },
    { file: "contact/index.html", types: ["ContactPage", "BreadcrumbList"] },
    ...EXPECTED_POSTS.map((slug) => ({
      file: `posts/${slug}/index.html`,
      types: ["BlogPosting", "BreadcrumbList"],
    })),
  ];

  const titles = new Set();

  for (const route of coreRoutes) {
    const html = readDist(route.file);
    assert.ok(!html.includes("<!--app-html-->"), `Unreplaced <!--app-html--> in ${route.file}`);
    assert.ok(!html.includes("<!--head-tags-->"), `Unreplaced <!--head-tags--> in ${route.file}`);

    const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<\/body>/);
    assert.ok(rootMatch && rootMatch[1].trim().length > 200, `Empty #root markup in ${route.file}`);

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    assert.ok(titleMatch, `Missing <title> in ${route.file}`);
    assert.ok(!titles.has(titleMatch[1]), `Duplicate title "${titleMatch[1]}" on ${route.file}`);
    titles.add(titleMatch[1]);

    assert.match(html, /<meta name="description" content="[^"]+"/, `Missing description in ${route.file}`);
    assert.match(html, /<link rel="canonical" href="https:\/\/friesconsulting\.services\/[^"]*"/, `Missing canonical in ${route.file}`);
    assert.match(html, /<link rel="alternate" type="text\/markdown" href="https:\/\/friesconsulting\.services\/[^"]+\.md"/, `Missing markdown alternate in ${route.file}`);

    const graph = extractJsonLd(html, route.file);
    const graphTypes = new Set(
      graph.flatMap((node) => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]))
    );
    assert.ok(graphTypes.has("ProfessionalService"), `Missing ProfessionalService in ${route.file}`);
    assert.ok(graphTypes.has("WebSite"), `Missing WebSite in ${route.file}`);
    for (const expectedType of route.types) {
      assert.ok(graphTypes.has(expectedType), `Missing JSON-LD @type=${expectedType} in ${route.file}`);
    }
  }

  // Verify Services page contains all 14 anchors including new local-ai-and-log-analysis & 11 FAQs
  const servicesHtml = readDist("services/index.html");
  assert.ok(servicesHtml.includes('id="local-ai-and-log-analysis"'), "Missing local-ai-and-log-analysis section");
  const servicesGraph = extractJsonLd(servicesHtml, "services/index.html");
  const faqNode = servicesGraph.find((n) => n["@type"] === "FAQPage");
  assert.equal(faqNode.mainEntity.length, 11, "Expected 11 FAQ entries in FAQPage JSON-LD");

  // Verify legacy welcome redirect and 404.html
  const welcomeHtml = readDist("posts/welcome/index.html");
  assert.match(welcomeHtml, /http-equiv="refresh" content="0; url=\/services\/"/);
  const notFoundHtml = readDist("404.html");
  assert.ok(notFoundHtml.includes("Page not found"), "Missing 404 page content");
}

function verifyAgentDiscoverySuite() {
  const llms = readDist("llms.txt");
  assert.ok(llms.includes("Fries Consulting Services, LLC"));
  assert.ok(llms.includes("/llms-full.txt"));
  assert.ok(llms.includes("/business.json"));
  assert.ok(llms.includes("/.well-known/agent-card.json"));

  const llmsFull = readDist("llms-full.txt");
  assert.ok(llmsFull.length > 25000, "Expected llms-full.txt to contain complete site dossier");
  assert.ok(llmsFull.includes("Reading the Filter Logs: A Local LLM for CIPA Compliance"));
  assert.ok(llmsFull.includes("Local AI and Log Analysis"));

  const robots = readDist("robots.txt");
  assert.ok(robots.includes("Allow: /"));
  assert.ok(robots.includes("GPTBot"));
  assert.ok(robots.includes("ClaudeBot"));
  assert.ok(robots.includes("PerplexityBot"));
  assert.ok(robots.includes("Sitemap: https://friesconsulting.services/sitemap.xml"));

  const sitemap = readDist("sitemap.xml");
  for (const slug of EXPECTED_POSTS) {
    assert.ok(sitemap.includes(`/posts/${slug}/`), `Missing post ${slug} in sitemap.xml`);
  }

  const rss = readDist("rss.xml");
  const indexXml = readDist("index.xml");
  assert.equal(rss, indexXml, "rss.xml and index.xml should stay identical");
  assert.ok(rss.includes("<rss version=\"2.0\""));
  for (const slug of EXPECTED_POSTS) {
    assert.ok(rss.includes(`/posts/${slug}/`), `Missing post ${slug} in rss.xml`);
  }

  const agentCard = JSON.parse(readDist(".well-known/agent-card.json"));
  assert.equal(agentCard.capabilities.a2aVersion, "1.0");
  assert.ok(Array.isArray(agentCard.supportedInterfaces) && agentCard.supportedInterfaces.length >= 2);
  assert.equal(agentCard.skills.length, 14);

  const businessJson = JSON.parse(readDist("business.json"));
  assert.equal(businessJson.services.length, 14);
  assert.equal(businessJson.faqs.length, 11);
  assert.equal(businessJson.writing.length, 9);

  const servicesJson = JSON.parse(readDist("services.json"));
  assert.equal(servicesJson.services.length, 14);

  // Markdown alternates (both <route>.md and <route>/index.md)
  assert.ok(readDist("index.md").length > 200);
  for (const route of ["services", "posts", "calculator", "contact", ...EXPECTED_POSTS.map((s) => `posts/${s}`)]) {
    const flat = readDist(`${route}.md`);
    const nested = readDist(`${route}/index.md`);
    assert.ok(flat.length > 100, `Empty ${route}.md`);
    assert.equal(flat, nested, `Mismatch between ${route}.md and ${route}/index.md`);
  }

  // Images
  for (const img of EXPECTED_IMAGES) {
    const imgPath = path.join(DIST, "images", img);
    assert.ok(fs.existsSync(imgPath), `Missing image asset dist/images/${img}`);
    assert.ok(fs.statSync(imgPath).size > 1000, `Image dist/images/${img} looks truncated`);
  }
}

async function verifyTcoBaseline() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const { calculatePrivateCloudTco } = await vite.ssrLoadModule("/src/lib/tco.ts");

    const baseline = calculatePrivateCloudTco();
    assert.equal(baseline.nodeCount, 3, "Baseline cluster must be 3 nodes");
    assert.equal(baseline.clusterUpfrontCost, 4950, "Baseline hardware total must equal $4,950");
    assert.equal(baseline.awsInstanceType, "c5.xlarge", "Baseline AWS instance must be c5.xlarge");
    assert.equal(baseline.awsMonthlyCompute, 468, "Baseline AWS monthly compute must be $468");
    assert.equal(baseline.awsAnnualTotal, 5616, "Baseline AWS annual compute must be $5,616");
    assert.ok(
      baseline.breakEvenMonths !== null && baseline.breakEvenMonths > 10 && baseline.breakEvenMonths < 11,
      `Expected ~10.6 month break-even, got ${baseline.breakEvenMonths}`
    );

    const small = calculatePrivateCloudTco({ vmCount: 1, vcpuPerVm: 2, ramGbPerVm: 4, storageGbPerVm: 100 });
    assert.equal(small.fitAssessment.status, "consider-smaller-cloud");

    const large = calculatePrivateCloudTco({ vmCount: 14, vcpuPerVm: 4, ramGbPerVm: 8, storageGbPerVm: 500 });
    assert.ok(large.nodeCount >= 4, "14 VMs should scale node count or RAM cleanly");
  } finally {
    await vite.close();
  }
}

async function verifyCloudflareWorker() {
  execFileSync(process.execPath, ["--check", "cloudflare/worker.js"]);

  assert.equal(prefersMarkdown("text/markdown"), true);
  assert.equal(prefersMarkdown("text/markdown, text/html;q=0.8"), true);
  assert.equal(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), false);
  assert.equal(prefersMarkdown("text/html;q=1.0, text/markdown;q=0.5"), false);

  assert.equal(resolveB2Target("/", "text/html").objectPath, "/index.html");
  assert.equal(resolveB2Target("/", "text/markdown").objectPath, "/index.md");
  assert.equal(resolveB2Target("/services", "text/html").objectPath, "/services/index.html");
  assert.equal(resolveB2Target("/services/", "text/markdown").objectPath, "/services.md");
  assert.equal(resolveB2Target("/posts/local-llm/", "text/markdown").objectPath, "/posts/local-llm.md");
  assert.equal(resolveB2Target("/.well-known/agent-card.json", "text/markdown").objectPath, "/.well-known/agent-card.json");

  const cfRewriteOrigin = "https://f001.backblazeb2.com/file/friesconsulting";
  assert.equal(
    resolveB2Target("/file/friesconsulting/index.html", "text/html", cfRewriteOrigin).objectPath,
    "/index.html"
  );
  const rewrittenSvcMd = resolveB2Target(
    "/file/friesconsulting/services/index.html",
    "text/markdown",
    cfRewriteOrigin
  );
  assert.equal(rewrittenSvcMd.objectPath, "/services.md");
  assert.equal(rewrittenSvcMd.htmlFallbackPath, "/services/index.html");
  assert.equal(
    resolveB2Target("/file/friesconsulting/llms.txt", "text/plain", cfRewriteOrigin).objectPath,
    "/llms.txt"
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const pathname = new URL(String(url)).pathname.replace(/^\/file\/bucket/, "");
    const rel = pathname.replace(/^\/+/, "");
    const diskPath = path.join(DIST, rel);
    if (!fs.existsSync(diskPath) || fs.statSync(diskPath).isDirectory()) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(fs.readFileSync(diskPath), {
      status: 200,
      headers: { "x-bz-file-name": rel },
    });
  };

  try {
    const env = { B2_ORIGIN: "https://f005.backblazeb2.com/file/bucket" };

    const mdResp = await handleRequest(
      new Request("https://friesconsulting.services/services/", {
        headers: { Accept: "text/markdown" },
      }),
      env
    );
    assert.equal(mdResp.status, 200);
    assert.equal(mdResp.headers.get("Content-Type"), "text/markdown; charset=utf-8");
    assert.equal(mdResp.headers.get("Vary"), "Accept");
    assert.ok(Number(mdResp.headers.get("x-markdown-tokens")) > 100);
    assert.equal(mdResp.headers.get("x-bz-file-name"), null);
    assert.ok((await mdResp.text()).includes("# Services"));

    const htmlResp = await handleRequest(
      new Request("https://friesconsulting.services/posts/local-llm", {
        headers: { Accept: "text/html" },
      }),
      env
    );
    assert.equal(htmlResp.status, 200);
    assert.equal(htmlResp.headers.get("Content-Type"), "text/html; charset=utf-8");
    assert.ok((htmlResp.headers.get("Link") || "").includes("/posts/local-llm.md"));

    // Verify Transform-Rule-rewritten paths (/file/bucket/...) resolve cleanly
    const rewrittenMdResp = await handleRequest(
      new Request("https://friesconsulting.services/file/bucket/services/index.html", {
        headers: { Accept: "text/markdown" },
      }),
      env
    );
    assert.equal(rewrittenMdResp.status, 200);
    assert.equal(rewrittenMdResp.headers.get("Content-Type"), "text/markdown; charset=utf-8");
    assert.ok((await rewrittenMdResp.text()).includes("# Services"));

    const rewrittenHtmlResp = await handleRequest(
      new Request("https://friesconsulting.services/file/bucket/services/index.html", {
        headers: { Accept: "text/html" },
      }),
      env
    );
    assert.equal(rewrittenHtmlResp.status, 200);
    assert.equal(rewrittenHtmlResp.headers.get("Content-Type"), "text/html; charset=utf-8");
    assert.ok((rewrittenHtmlResp.headers.get("Link") || "").includes("/services.md"));

    const missingResp = await handleRequest(
      new Request("https://friesconsulting.services/non-existent-page"),
      env
    );
    assert.equal(missingResp.status, 404);
    assert.ok((await missingResp.text()).includes("Page not found"));

    // Verify graceful HTML fallback when Accept: text/markdown hits a missing .md object on B2
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const pathname = new URL(String(url)).pathname.replace(/^\/file\/bucket/, "");
      if (pathname === "/services.md") {
        return new Response("Not Found", { status: 404 });
      }
      return previousFetch(url, init);
    };
    const fallbackResp = await handleRequest(
      new Request("https://friesconsulting.services/services/", {
        headers: { Accept: "text/markdown" },
      }),
      env
    );
    assert.equal(fallbackResp.status, 200);
    assert.equal(fallbackResp.headers.get("Content-Type"), "text/html; charset=utf-8");
    assert.equal(fallbackResp.headers.get("Vary"), "Accept");
    assert.ok((await fallbackResp.text()).includes("IT Infrastructure Services"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function verifyRepoHygieneAndScripts() {
  const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.ok(gitignore.split(/\r?\n/).includes(".env"), ".gitignore must ignore .env");
  assert.ok(gitignore.split(/\r?\n/).includes(".env.*"), ".gitignore must ignore .env.*");
  assert.ok(gitignore.split(/\r?\n/).includes("!.env.example"), ".gitignore must allow .env.example");

  execFileSync("bash", ["-n", path.join(ROOT, "scripts/deploy-b2.sh")]);
  execFileSync("bash", ["-n", path.join(ROOT, "scripts/deploy-worker.sh")]);
}

async function main() {
  verifyRepoHygieneAndScripts();
  await verifyHtmlRoutes();
  verifyAgentDiscoverySuite();
  await verifyTcoBaseline();
  await verifyCloudflareWorker();
  console.log("ALL VERIFICATION CHECKS PASSED.");
}

main().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  process.exit(1);
});
