import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { Marked } from "marked";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const DATA_DIR = path.join(CONTENT_DIR, "data");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");
const OUT_DIR = path.join(ROOT, "src", "generated");
const OUT_FILE = path.join(OUT_DIR, "content.ts");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripMarkdownToPlain(md) {
  return md
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCalendarDate(isoLike) {
  const str = isoLike instanceof Date ? isoLike.toISOString() : String(isoLike);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return str;
  const [, yearStr, monthStr, dayStr] = match;
  const dateObj = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateObj);
}

function normalizeIsoString(val) {
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function postProcessHtml(html) {
  let out = html;

  // Upgrade image + italic caption paragraphs into semantic figures.
  out = out.replace(
    /<p>(<img\b[^>]*>)<\/p>\s*<p><em>([\s\S]*?)<\/em><\/p>/g,
    (_, imgTag, caption) => {
      const enhancedImg = imgTag.replace(
        /<img\s/,
        '<img loading="lazy" decoding="async" '
      );
      return `<figure class="editorial-figure">${enhancedImg}<figcaption>${caption}</figcaption></figure>`;
    }
  );

  // Upgrade any remaining standalone image paragraphs.
  out = out.replace(/<p>(<img\b[^>]*>)<\/p>/g, (_, imgTag) => {
    const enhancedImg = imgTag.replace(
      /<img\s/,
      '<img loading="lazy" decoding="async" '
    );
    return `<figure class="editorial-figure">${enhancedImg}</figure>`;
  });

  // Wrap tables for horizontal overflow on narrow viewports.
  out = out.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="table-scroll"><table>$1</table></div>');

  return out;
}

function renderMarkdownWithToc(markdown) {
  const toc = [];
  const slugCounts = new Map();

  const marked = new Marked({
    gfm: true,
    breaks: false,
  });

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const innerHtml = this.parser.parseInline(tokens);
        const plainText = innerHtml.replace(/<[^>]+>/g, "").trim();
        let baseSlug = slugify(plainText) || "section";
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

        if (depth === 2 || depth === 3) {
          toc.push({ id, text: plainText, level: depth });
        }

        return `<h${depth} id="${id}">${innerHtml}</h${depth}>\n`;
      },
    },
  });

  const rawHtml = marked.parse(markdown);
  const html = postProcessHtml(typeof rawHtml === "string" ? rawHtml : "");
  return { html, toc };
}

function renderSimpleMarkdown(markdown) {
  const marked = new Marked({ gfm: true, breaks: false });
  const rawHtml = marked.parse(markdown);
  return postProcessHtml(typeof rawHtml === "string" ? rawHtml : "");
}

function renderInlineMarkdown(markdown) {
  const marked = new Marked({ gfm: true, breaks: false });
  const rawHtml = marked.parseInline(markdown.trim());
  return typeof rawHtml === "string" ? rawHtml : "";
}

function readYaml(fileName) {
  const raw = fs.readFileSync(path.join(DATA_DIR, fileName), "utf8");
  return yaml.load(raw);
}

function build() {
  const rawBusiness = readYaml("business.yaml");
  const rawServices = readYaml("services.yaml");
  const rawFaqs = readYaml("faq.yaml");

  const business = {
    ...rawBusiness,
    overview: rawBusiness.overview.trim(),
    sectorFocus: rawBusiness.sectorFocus.trim(),
    eRateSummary: rawBusiness.eRateSummary.trim(),
    cipaSummary: rawBusiness.cipaSummary.trim(),
    openSourceRationale: rawBusiness.openSourceRationale.trim(),
    engagementModel: rawBusiness.engagementModel.trim(),
    pricingModel: rawBusiness.pricingModel.trim(),
    responsePromise: rawBusiness.responsePromise.trim(),
    contactChannelNote: rawBusiness.contactChannelNote.trim(),
    audiences: rawBusiness.audiences.map((a) => ({ ...a, detail: a.detail.trim() })),
    engagementShapes: rawBusiness.engagementShapes.map((s) => ({
      ...s,
      description: s.description.trim(),
    })),
    engagementSteps: rawBusiness.engagementSteps.map((s) => ({
      ...s,
      description: s.description.trim(),
    })),
    nonProfitRealities: rawBusiness.nonProfitRealities.map((r) => ({
      ...r,
      detail: r.detail.trim(),
    })),
    contactChecklist: rawBusiness.contactChecklist.map((c) => ({
      ...c,
      description: c.description.trim(),
    })),
  };

  const services = rawServices.map((service) => {
    const detailsMarkdown = (service.details ?? "").trim();
    return {
      id: service.id,
      name: service.name,
      shortName: service.shortName,
      category: service.category,
      audiences: service.audiences ?? [],
      primaryUrl: service.primaryUrl,
      ...(service.relatedPost ? { relatedPost: service.relatedPost } : {}),
      summary: service.summary.trim(),
      tags: service.tags ?? [],
      detailsMarkdown,
      detailsHtml: renderSimpleMarkdown(detailsMarkdown),
    };
  });

  const faqs = rawFaqs.map((faq) => ({
    q: faq.q.trim(),
    a: faq.a.trim(),
    answerHtml: renderInlineMarkdown(faq.a),
    answerPlain: stripMarkdownToPlain(faq.a),
  }));

  const postFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const posts = postFiles
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
      const parsed = matter(raw);
      const data = parsed.data;
      if (data.draft === true) return null;

      const markdown = parsed.content.trim();
      const { html, toc } = renderMarkdownWithToc(markdown);
      const plainWords = stripMarkdownToPlain(markdown)
        .split(/\s+/)
        .filter(Boolean).length;

      const dateIso = normalizeIsoString(data.date);
      const lastmodIso = normalizeIsoString(data.lastmod ?? data.date);
      const firstImageMatch = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);

      return {
        slug,
        url: `/posts/${slug}/`,
        title: String(data.title ?? slug),
        date: dateIso,
        lastmod: lastmodIso,
        dateFormatted: formatCalendarDate(dateIso),
        ...(data.lastmod ? { lastmodFormatted: formatCalendarDate(lastmodIso) } : {}),
        description: String(data.description ?? data.summary ?? "").trim(),
        summary: String(data.summary ?? data.description ?? "").trim(),
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
        wordCount: plainWords,
        readingMinutes: Math.max(1, Math.round(plainWords / 220)),
        toc,
        markdown,
        html,
        ...(firstImageMatch ? { featuredImage: firstImageMatch[1] } : {}),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tsOutput = `/* eslint-disable */
// Auto-generated by scripts/generate-content.mjs from content/data/*.yaml and content/posts/*.md.
// Do not edit directly.

import type { BusinessProfile, FaqItem, PostItem, ServiceItem } from "../types/content";

export const business: BusinessProfile = ${JSON.stringify(business, null, 2)};

export const services: ServiceItem[] = ${JSON.stringify(services, null, 2)};

export const faqs: FaqItem[] = ${JSON.stringify(faqs, null, 2)};

export const posts: PostItem[] = ${JSON.stringify(posts, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, tsOutput, "utf8");
  console.log(
    `Generated ${path.relative(ROOT, OUT_FILE)} (${services.length} services, ${faqs.length} FAQs, ${posts.length} posts).`
  );
}

build();
