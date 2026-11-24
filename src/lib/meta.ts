import { business, faqs, posts, services } from "../generated/content";
import type { PostItem } from "../types/content";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  markdownUrl: string;
  ogType: "website" | "article";
  ogImage: string;
  publishedTime?: string;
  modifiedTime?: string;
  robots?: string;
  jsonLd: Record<string, unknown>;
}

function absUrl(relPath: string): string {
  const base = business.baseUrl.replace(/\/+$/, "");
  if (relPath.startsWith("http://") || relPath.startsWith("https://")) {
    return relPath;
  }
  const clean = relPath.startsWith("/") ? relPath : `/${relPath}`;
  return `${base}${clean}`;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.endsWith(".html")) return clean;
  return clean.endsWith("/") ? clean : `${clean}/`;
}

export function getMarkdownPathForRoute(routePath: string): string {
  const normalized = normalizePath(routePath);
  if (normalized === "/") return "/index.md";
  if (normalized === "/404.html") return "/index.md";
  return `${normalized.replace(/\/+$/, "")}.md`;
}

function buildOrgAndWebsiteNodes() {
  const orgId = `${absUrl("/")}#organization`;
  const siteId = `${absUrl("/")}#website`;
  const contactUrl = absUrl(business.contactPath);

  const offers = services.map((service) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: service.name,
      description: service.summary,
      url: absUrl(service.primaryUrl),
      provider: { "@id": orgId },
    },
  }));

  const orgNode = {
    "@type": ["ProfessionalService", "Organization"],
    "@id": orgId,
    name: business.name,
    legalName: business.legalName,
    alternateName: business.shortName,
    url: absUrl("/"),
    description: business.description,
    image: absUrl(business.ogImage),
    knowsAbout: business.knowsAbout,
    founder: {
      "@type": "Person",
      name: business.founder,
    },
    audience: business.audiences.map((aud) => ({
      "@type": "Audience",
      audienceType: aud.schemaType,
    })),
    areaServed: [
      ...business.serviceArea.onSite.map((place) => ({ "@type": "Place", name: place })),
      { "@type": "Place", name: business.serviceArea.remote },
    ],
    sameAs: business.github ? [business.github] : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales and general enquiries",
      url: contactUrl,
      availableLanguage: "English",
      areaServed: "US",
    },
    potentialAction: {
      "@type": "CommunicateAction",
      name: "Contact Fries Consulting Services",
      target: contactUrl,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "IT Consulting Services",
      itemListElement: offers,
    },
  };

  const websiteNode = {
    "@type": "WebSite",
    "@id": siteId,
    url: absUrl("/"),
    name: business.title,
    description: business.description,
    publisher: { "@id": orgId },
    inLanguage: business.language,
  };

  return { orgId, siteId, orgNode, websiteNode };
}

function buildBreadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

function buildPostNode(post: PostItem, orgId: string, siteId: string) {
  return {
    "@type": "BlogPosting",
    "@id": `${absUrl(post.url)}#article`,
    headline: post.title,
    description: post.description || post.summary,
    url: absUrl(post.url),
    datePublished: post.date,
    dateModified: post.lastmod || post.date,
    wordCount: post.wordCount,
    inLanguage: business.language,
    image: absUrl(post.featuredImage || business.ogImage),
    author: {
      "@type": "Person",
      name: business.founder,
    },
    publisher: { "@id": orgId },
    isPartOf: { "@id": siteId },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absUrl(post.url),
    },
    ...(post.keywords.length > 0 ? { keywords: post.keywords.join(", ") } : {}),
  };
}

export function getPageMeta(rawPathname: string): PageMeta {
  const path = normalizePath(rawPathname);
  const { orgId, siteId, orgNode, websiteNode } = buildOrgAndWebsiteNodes();
  const graph: Array<Record<string, unknown>> = [orgNode, websiteNode];

  if (path === "/") {
    const url = absUrl("/");
    graph.push({
      "@type": "WebPage",
      "@id": url,
      url,
      name: business.name,
      description: business.description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: business.language,
    });

    return {
      path,
      title: `${business.name} — IT Infrastructure Consulting`,
      description: business.description,
      canonicalUrl: url,
      markdownUrl: absUrl(getMarkdownPathForRoute("/")),
      ogType: "website",
      ogImage: absUrl(business.ogImage),
      jsonLd: { "@context": "https://schema.org", "@graph": graph },
    };
  }

  if (path === "/services/" || path === "/posts/welcome/") {
    const url = absUrl("/services/");
    const description =
      "Full list of IT consulting services from Fries Consulting Services, LLC for non-profits, charter schools, and small businesses. Network audits, E-Rate and CIPA compliance, Proxmox and Ceph private cloud, VMware migration, monitoring, AWS architecture and cost optimization, infrastructure as code, asset inventory, automation, and local AI.";

    graph.push(
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "Services", path: "/services/" },
      ])
    );
    graph.push({
      "@type": "WebPage",
      "@id": url,
      url,
      name: "Services",
      description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: business.language,
    });
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      isPartOf: { "@id": siteId },
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answerPlain,
        },
      })),
    });

    return {
      path: "/services/",
      title: `Services — ${business.name}`,
      description,
      canonicalUrl: url,
      markdownUrl: absUrl(getMarkdownPathForRoute("/services/")),
      ogType: "website",
      ogImage: absUrl(business.ogImage),
      jsonLd: { "@context": "https://schema.org", "@graph": graph },
    };
  }

  if (path === "/posts/") {
    const url = absUrl("/posts/");
    const description =
      "Technical write-ups and case studies from Fries Consulting Services covering local LLM CIPA filter log pipelines, Proxmox and Ceph private clouds, VMware migration, AWS IaC, network audits, monitoring, and automation.";

    graph.push(
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "Writing", path: "/posts/" },
      ])
    );
    graph.push({
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: "Writing & Case Studies",
      description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: business.language,
    });

    return {
      path,
      title: `Writing & Case Studies — ${business.name}`,
      description,
      canonicalUrl: url,
      markdownUrl: absUrl(getMarkdownPathForRoute("/posts/")),
      ogType: "website",
      ogImage: absUrl(business.ogImage),
      jsonLd: { "@context": "https://schema.org", "@graph": graph },
    };
  }

  if (path.startsWith("/posts/")) {
    const slug = path.replace(/^\/posts\//, "").replace(/\/+$/, "");
    const post = posts.find((p) => p.slug === slug);
    if (post) {
      const url = absUrl(post.url);
      graph.push(
        buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Writing", path: "/posts/" },
          { name: post.title, path: post.url },
        ])
      );
      graph.push(buildPostNode(post, orgId, siteId));

      return {
        path: post.url,
        title: `${post.title} — ${business.name}`,
        description: post.description || post.summary,
        canonicalUrl: url,
        markdownUrl: absUrl(getMarkdownPathForRoute(post.url)),
        ogType: "article",
        ogImage: absUrl(post.featuredImage || business.ogImage),
        publishedTime: post.date,
        modifiedTime: post.lastmod,
        jsonLd: { "@context": "https://schema.org", "@graph": graph },
      };
    }
  }

  if (path === "/calculator/") {
    const url = absUrl("/calculator/");
    const description =
      "Interactive Private Cloud vs. AWS total cost of ownership estimator based on a three-node Proxmox VE and Ceph hardware build (~$4,950) versus equivalent AWS EC2 compute (~$5,600/year).";

    graph.push(
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "TCO Calculator", path: "/calculator/" },
      ])
    );
    graph.push({
      "@type": "WebPage",
      "@id": url,
      url,
      name: "Private Cloud vs. AWS TCO Calculator",
      description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: business.language,
    });
    graph.push({
      "@type": "WebApplication",
      "@id": `${url}#calculator`,
      name: "Proxmox & Ceph Private Cloud vs. AWS TCO Estimator",
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      description,
      provider: { "@id": orgId },
    });

    return {
      path,
      title: `Private Cloud vs. AWS TCO Calculator — ${business.name}`,
      description,
      canonicalUrl: url,
      markdownUrl: absUrl(getMarkdownPathForRoute("/calculator/")),
      ogType: "website",
      ogImage: absUrl(business.ogImage),
      jsonLd: { "@context": "https://schema.org", "@graph": graph },
    };
  }

  if (path === "/contact/") {
    const url = absUrl("/contact/");
    const description =
      "Contact Fries Consulting Services, LLC for IT infrastructure consulting for non-profits, charter schools, and small businesses. Use the contact form on this page. Serving Denver and Northern Colorado on-site, and the United States remotely.";

    graph.push(
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact/" },
      ])
    );
    graph.push({
      "@type": "ContactPage",
      "@id": url,
      url,
      name: "Contact Fries Consulting Services",
      description,
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      inLanguage: business.language,
    });

    return {
      path,
      title: `Contact — ${business.name}`,
      description,
      canonicalUrl: url,
      markdownUrl: absUrl(getMarkdownPathForRoute("/contact/")),
      ogType: "website",
      ogImage: absUrl(business.ogImage),
      jsonLd: { "@context": "https://schema.org", "@graph": graph },
    };
  }

  const notFoundUrl = absUrl("/404.html");
  graph.push({
    "@type": "WebPage",
    "@id": notFoundUrl,
    url: notFoundUrl,
    name: "Page Not Found",
    description: "Requested page was not found.",
    isPartOf: { "@id": siteId },
    inLanguage: business.language,
  });

  return {
    path: "/404.html",
    title: `Page Not Found — ${business.name}`,
    description: "The requested page could not be found on Fries Consulting Services.",
    canonicalUrl: notFoundUrl,
    markdownUrl: absUrl("/index.md"),
    ogType: "website",
    ogImage: absUrl(business.ogImage),
    robots: "noindex, nofollow",
    jsonLd: { "@context": "https://schema.org", "@graph": graph },
  };
}

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHeadTagsHtml(meta: PageMeta): string {
  const tags: string[] = [
    `<title>${escapeAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    meta.robots ? `<meta name="robots" content="${escapeAttr(meta.robots)}" />` : "",
    `<link rel="canonical" href="${escapeAttr(meta.canonicalUrl)}" />`,
    `<link rel="alternate" type="text/markdown" href="${escapeAttr(meta.markdownUrl)}" />`,
    `<link rel="describedby" type="text/plain" href="${escapeAttr(absUrl("/llms.txt"))}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${escapeAttr(business.name)}" href="${escapeAttr(absUrl("/rss.xml"))}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:url" content="${escapeAttr(meta.canonicalUrl)}" />`,
    `<meta property="og:site_name" content="${escapeAttr(business.name)}" />`,
    `<meta property="og:image" content="${escapeAttr(meta.ogImage)}" />`,
    meta.publishedTime
      ? `<meta property="article:published_time" content="${escapeAttr(meta.publishedTime)}" />`
      : "",
    meta.modifiedTime
      ? `<meta property="article:modified_time" content="${escapeAttr(meta.modifiedTime)}" />`
      : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(meta.ogImage)}" />`,
    `<script id="fcs-jsonld" type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`,
  ];

  return tags.filter(Boolean).join("\n    ");
}
