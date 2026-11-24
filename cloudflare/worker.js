const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function parseAcceptQuality(acceptHeader, mimeType) {
  if (!acceptHeader) return -1;
  const entries = acceptHeader.split(",").map((part) => part.trim().toLowerCase());
  for (const entry of entries) {
    const [type, ...params] = entry.split(";").map((s) => s.trim());
    if (type !== mimeType) continue;
    const qParam = params.find((p) => p.startsWith("q="));
    if (!qParam) return 1;
    const parsed = Number.parseFloat(qParam.slice(2));
    return Number.isFinite(parsed) ? parsed : 1;
  }
  return -1;
}

export function prefersMarkdown(acceptHeader) {
  if (!acceptHeader) return false;
  const mdQ = parseAcceptQuality(acceptHeader, "text/markdown");
  if (mdQ <= 0) return false;
  const htmlQ = parseAcceptQuality(acceptHeader, "text/html");
  if (htmlQ < 0) return true;
  return mdQ >= htmlQ;
}

export function normalizeIncomingPath(pathname, originBase = "") {
  let clean = pathname || "/";

  if (originBase) {
    try {
      const originPrefix = new URL(originBase).pathname.replace(/\/+$/, "");
      if (originPrefix && (clean === originPrefix || clean === `${originPrefix}/`)) {
        clean = "/";
      } else if (originPrefix && clean.startsWith(`${originPrefix}/`)) {
        clean = clean.slice(originPrefix.length);
      }
    } catch {
      // Ignore invalid originBase strings.
    }
  }

  if (clean === "/index.html") {
    return "/";
  }
  if (clean.endsWith("/index.html")) {
    return clean.slice(0, -"/index.html".length) || "/";
  }

  return clean || "/";
}

export function resolveB2Target(pathname, acceptHeader = "", originBase = "") {
  const normalized = normalizeIncomingPath(pathname, originBase);

  if (normalized === "/") {
    return prefersMarkdown(acceptHeader)
      ? {
          objectPath: "/index.md",
          isMarkdown: true,
          isHtmlPage: false,
          mdAlternate: "/index.md",
          htmlFallbackPath: "/index.html",
        }
      : {
          objectPath: "/index.html",
          isMarkdown: false,
          isHtmlPage: true,
          mdAlternate: "/index.md",
          htmlFallbackPath: null,
        };
  }

  const lastSegment = normalized.split("/").pop() || "";
  const hasExtension = lastSegment.includes(".") && !lastSegment.startsWith(".");

  if (hasExtension || normalized.startsWith("/.well-known/")) {
    return {
      objectPath: normalized,
      isMarkdown:
        normalized.endsWith(".md") ||
        normalized.endsWith("llms.txt") ||
        normalized.endsWith("llms-full.txt"),
      isHtmlPage: normalized.endsWith(".html"),
      mdAlternate: normalized.endsWith(".html") ? "/index.md" : null,
      htmlFallbackPath: null,
    };
  }

  const clean = normalized.replace(/\/+$/, "");
  const mdPath = `${clean}.md`;
  const htmlPath = `${clean}/index.html`;

  if (prefersMarkdown(acceptHeader)) {
    return {
      objectPath: mdPath,
      isMarkdown: true,
      isHtmlPage: false,
      mdAlternate: mdPath,
      htmlFallbackPath: htmlPath,
    };
  }

  return {
    objectPath: htmlPath,
    isMarkdown: false,
    isHtmlPage: true,
    mdAlternate: mdPath,
    htmlFallbackPath: null,
  };
}

function getContentType(objectPath, upstreamContentType) {
  const lower = objectPath.toLowerCase();
  for (const [ext, mime] of Object.entries(CONTENT_TYPES)) {
    if (lower.endsWith(ext)) return mime;
  }
  return upstreamContentType || "application/octet-stream";
}

function applySecurityAndCacheHeaders(headers, objectPath) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");

  if (objectPath.startsWith("/assets/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (objectPath.startsWith("/images/")) {
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  } else {
    headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  }

  for (const key of Array.from(headers.keys())) {
    if (key.toLowerCase().startsWith("x-bz-")) {
      headers.delete(key);
    }
  }
}

const UPSTREAM_CF_OPTIONS = {
  cacheEverything: true,
  cacheTtlByStatus: {
    "200-299": 300,
    "404": 10,
    "500-599": 0,
  },
};

export async function handleRequest(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const originBase = (env?.B2_ORIGIN || "").replace(/\/+$/, "");
  if (!originBase) {
    return new Response("Missing B2_ORIGIN environment variable.", { status: 500 });
  }

  const url = new URL(request.url);
  const accept = request.headers.get("Accept") || "";
  const target = resolveB2Target(url.pathname, accept, originBase);

  let activePath = target.objectPath;
  let activeIsMarkdown = target.isMarkdown;
  let activeIsHtmlPage = target.isHtmlPage;

  let upstreamResponse = await fetch(`${originBase}${activePath}`, {
    method: request.method,
    cf: UPSTREAM_CF_OPTIONS,
  });

  if (upstreamResponse.status === 404 && target.htmlFallbackPath) {
    const fallbackResponse = await fetch(`${originBase}${target.htmlFallbackPath}`, {
      method: request.method,
      cf: UPSTREAM_CF_OPTIONS,
    });
    if (fallbackResponse.status !== 404) {
      upstreamResponse = fallbackResponse;
      activePath = target.htmlFallbackPath;
      activeIsMarkdown = false;
      activeIsHtmlPage = true;
    }
  }

  if (upstreamResponse.status === 404) {
    const notFoundResp = await fetch(`${originBase}/404.html`, {
      method: request.method,
      cf: UPSTREAM_CF_OPTIONS,
    });
    const headers = new Headers(notFoundResp.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    applySecurityAndCacheHeaders(headers, "/404.html");
    headers.set("Cache-Control", "public, max-age=15");
    return new Response(request.method === "HEAD" ? null : notFoundResp.body, {
      status: 404,
      headers,
    });
  }

  const headers = new Headers(upstreamResponse.headers);
  headers.set(
    "Content-Type",
    getContentType(activePath, upstreamResponse.headers.get("Content-Type"))
  );
  applySecurityAndCacheHeaders(headers, activePath);

  if (activeIsHtmlPage || activeIsMarkdown) {
    headers.set("Vary", "Accept");
  }

  if (activeIsHtmlPage && target.mdAlternate) {
    headers.append("Link", '</llms.txt>; rel="describedby"; type="text/plain"');
    headers.append("Link", `<${target.mdAlternate}>; rel="alternate"; type="text/markdown"`);
  }

  if (activeIsMarkdown && request.method === "GET") {
    const text = await upstreamResponse.text();
    const estimatedTokens = Math.max(1, Math.ceil(text.length / 4));
    headers.set("x-markdown-tokens", String(estimatedTokens));
    headers.set("Content-Length", String(new TextEncoder().encode(text).byteLength));
    return new Response(text, {
      status: upstreamResponse.status,
      headers,
    });
  }

  return new Response(request.method === "HEAD" ? null : upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
