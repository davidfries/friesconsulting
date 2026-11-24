import { Link, useParams } from "react-router-dom";
import { MarkdownContent } from "../components/MarkdownContent";
import { TcoCalculator } from "../components/TcoCalculator";
import { posts } from "../generated/content";
import { NotFoundPage } from "./NotFoundPage";

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const postIndex = posts.findIndex((p) => p.slug === slug);
  if (postIndex === -1) {
    return <NotFoundPage />;
  }

  const post = posts[postIndex];
  const newerPost = postIndex > 0 ? posts[postIndex - 1] : null;
  const olderPost = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;
  const showToc = post.toc.length >= 2;

  return (
    <article className="section section--flush-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/posts/">Writing</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>

        <header style={{ maxWidth: "68ch", marginBottom: "2rem" }}>
          <div className="card__meta" style={{ marginBottom: "0.65rem" }}>
            <time dateTime={post.date}>Published {post.dateFormatted}</time>
            {post.lastmodFormatted ? (
              <>
                <span>·</span>
                <time dateTime={post.lastmod}>Updated {post.lastmodFormatted}</time>
              </>
            ) : null}
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
            <span>·</span>
            <a href={`/posts/${post.slug}.md`} className="muted">
              Markdown source
            </a>
          </div>

          <h1 style={{ marginBottom: "0.85rem" }}>{post.title}</h1>
          <p className="lead" style={{ marginBottom: "1rem" }}>
            {post.summary}
          </p>

          {post.keywords.length > 0 ? (
            <div className="tag-row">
              {post.keywords.map((kw) => (
                <span key={kw} className="tag">
                  {kw}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className={showToc ? "article-layout" : undefined}>
          <div>
            <MarkdownContent html={post.html} />
          </div>

          {showToc ? (
            <aside className="toc-aside" aria-label="Table of contents">
              <div className="toc-aside__title">On this page</div>
              <ol className="toc-list">
                {post.toc.map((heading) => (
                  <li
                    key={heading.id}
                    className={
                      heading.level === 3 ? "toc-list__item--level-3" : undefined
                    }
                  >
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>

        {post.slug === "privatecloud" ? (
          <div style={{ marginTop: "2.75rem" }}>
            <TcoCalculator compact />
          </div>
        ) : null}

        <div
          className="card card--subtle"
          style={{
            marginTop: "2.75rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>
              Evaluating a similar architecture?
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              Tell us your environment, constraints, and timeline — every inquiry gets a direct
              answer.
            </p>
          </div>
          <div className="btn-group">
            <Link to="/contact/" className="btn btn--primary">
              Contact Fries Consulting
            </Link>
            <Link to="/services/" className="btn btn--secondary">
              View All Services
            </Link>
          </div>
        </div>

        <nav
          aria-label="More articles"
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            {newerPost ? (
              <Link to={newerPost.url} className="small">
                ← Newer: {newerPost.title}
              </Link>
            ) : (
              <Link to="/posts/" className="small">
                ← All writing
              </Link>
            )}
          </div>
          <div>
            {olderPost ? (
              <Link to={olderPost.url} className="small">
                Older: {olderPost.title} →
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </article>
  );
}
