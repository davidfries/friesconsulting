import { useState } from "react";
import { Link } from "react-router-dom";
import { posts } from "../generated/content";

type TopicFilter = "all" | "cloud" | "compliance" | "operations";

function matchesTopic(slug: string, topic: TopicFilter): boolean {
  if (topic === "all") return true;
  if (topic === "cloud") return ["privatecloud", "proxmox", "awsiac", "small-clouds"].includes(slug);
  if (topic === "compliance") return ["local-llm", "network-audit", "inventory"].includes(slug);
  return ["monitoring", "automation", "network-audit", "inventory"].includes(slug);
}

export function PostsPage() {
  const [topic, setTopic] = useState<TopicFilter>("all");
  const visiblePosts = posts.filter((p) => matchesTopic(p.slug, topic));

  return (
    <section className="section section--flush-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Writing</span>
        </nav>

        <div className="eyebrow">Technical Notes & Production Case Studies</div>
        <h1>Writing</h1>
        <p className="lead" style={{ marginBottom: "1.5rem" }}>
          Field notes from building private clouds, school content filter pipelines, network
          audits, infrastructure as code, and operational automation.
        </p>

        <div className="filter-bar" role="group" aria-label="Filter articles by topic">
          <button
            type="button"
            className={topic === "all" ? "pill pill--active" : "pill"}
            onClick={() => setTopic("all")}
          >
            All articles ({posts.length})
          </button>
          <button
            type="button"
            className={topic === "cloud" ? "pill pill--active" : "pill"}
            onClick={() => setTopic("cloud")}
          >
            Proxmox, VMware & AWS
          </button>
          <button
            type="button"
            className={topic === "compliance" ? "pill pill--active" : "pill"}
            onClick={() => setTopic("compliance")}
          >
            CIPA, Local AI & Audits
          </button>
          <button
            type="button"
            className={topic === "operations" ? "pill pill--active" : "pill"}
            onClick={() => setTopic("operations")}
          >
            Monitoring, Inventory & Automation
          </button>
        </div>

        <div className="grid-2">
          {visiblePosts.map((post) => (
            <article key={post.slug} className="card">
              <div className="card__meta">
                <time dateTime={post.date}>{post.dateFormatted}</time>
                <span>·</span>
                <span>{post.readingMinutes} min read</span>
                <span>·</span>
                <span>{post.wordCount} words</span>
              </div>
              <h2 className="card__title" style={{ fontSize: "1.25rem" }}>
                <Link to={post.url}>{post.title}</Link>
              </h2>
              <p className="card__body">{post.summary}</p>
              <div className="tag-row">
                {post.keywords.slice(0, 4).map((kw) => (
                  <span key={kw} className="tag">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="card__footer">
                <Link to={post.url}>Read full article →</Link>
                <a href={`/posts/${post.slug}.md`} className="mono small muted">
                  .md
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
