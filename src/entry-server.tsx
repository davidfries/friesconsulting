import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { business, faqs, posts, services } from "./generated/content";
import { getMarkdownPathForRoute, getPageMeta, renderHeadTagsHtml } from "./lib/meta";

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
}

export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/services/",
    "/posts/",
    "/calculator/",
    "/contact/",
    "/posts/welcome/",
    ...posts.map((p) => p.url),
    "/404.html",
  ];
}

export {
  business,
  faqs,
  getMarkdownPathForRoute,
  getPageMeta,
  posts,
  renderHeadTagsHtml,
  services,
};
