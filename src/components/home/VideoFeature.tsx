"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ExternalLink } from "lucide-react";

interface VideoFeatureProps {
  videoId: string;
  title: string;
  /** Optional poster image. Defaults to the YouTube maxres thumbnail. */
  thumbnailUrl?: string;
}

/**
 * VideoFeature
 *
 * Lazy, viewport-triggered YouTube embed with a click-to-play fallback.
 *
 * - Before activation: a poster thumbnail with a play button is shown (no
 *   iframe is loaded, so the homepage stays light).
 * - When the player scrolls into view, an IntersectionObserver activates the
 *   iframe with autoplay, mute and loop enabled.
 * - The play button remains available as a manual fallback (click to activate)
 *   in case IntersectionObserver or autoplay is unavailable.
 */
export function VideoFeature({ videoId, title, thumbnailUrl }: VideoFeatureProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activated, setActivated] = useState(false);

  const poster =
    thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  // loop=1 on a single YouTube video also requires playlist=<videoId>.
  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Auto-play when the player scrolls into view.
  useEffect(() => {
    if (activated) return;
    const node = containerRef.current;
    if (!node) return;

    // Respect reduced-motion: do not auto-start playback for those users.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Fallback browsers without IntersectionObserver keep the manual button.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivated(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {activated ? (
          <iframe
            className="absolute top-0 left-0 h-full w-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play video: ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* Poster */}
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Dark overlay for contrast */}
            <span className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/30" />
            {/* Play button */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--nav-theme))] shadow-lg shadow-[hsl(var(--nav-theme)/0.4)] transition-transform group-hover:scale-110 md:h-20 md:w-20">
                <Play className="ml-1 h-7 w-7 text-white md:h-9 md:w-9" aria-hidden="true" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
