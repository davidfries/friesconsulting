import { useEffect } from "react";
import { getPageMeta } from "../lib/meta";

function upsertMeta(attrName: "name" | "property", attrValue: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, type: string | null, href: string) {
  const selector = type ? `link[rel="${rel}"][type="${type}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (type) el.setAttribute("type", type);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageMeta(pathname: string) {
  useEffect(() => {
    const meta = getPageMeta(pathname);
    document.title = meta.title;

    upsertMeta("name", "description", meta.description);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:type", meta.ogType);
    upsertMeta("property", "og:url", meta.canonicalUrl);
    upsertMeta("property", "og:image", meta.ogImage);
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);

    upsertLink("canonical", null, meta.canonicalUrl);
    upsertLink("alternate", "text/markdown", meta.markdownUrl);

    let jsonLdScript = document.getElementById("fcs-jsonld") as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.id = "fcs-jsonld";
      jsonLdScript.type = "application/ld+json";
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(meta.jsonLd);
  }, [pathname]);
}
