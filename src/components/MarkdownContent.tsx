import { type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

interface MarkdownContentProps {
  html: string;
  className?: string;
}

export function MarkdownContent({ html, className }: MarkdownContentProps) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || anchor.hasAttribute("download") || anchor.target === "_blank") return;

    if (href.startsWith("#")) {
      const targetEl = document.getElementById(href.slice(1));
      if (targetEl) {
        event.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", href);
      }
      return;
    }

    if (href.startsWith("/")) {
      event.preventDefault();
      navigate(href);
    }
  };

  return (
    <div
      className={className ? `prose ${className}` : "prose"}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
