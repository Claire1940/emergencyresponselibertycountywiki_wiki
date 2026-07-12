"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

/* ----------------------------------------------------------------------------
 * Reusable building blocks (kept module-agnostic; each module section below is
 * still an independent <section>, not generated from a module array).
 * ------------------------------------------------------------------------- */

/** A single promo-code card with a click-to-copy button. */
function CodeCard({
  code,
  reward,
  status,
  rewardType,
  activeLabel,
  expiredLabel,
}: {
  code: string;
  reward: string;
  status: string;
  rewardType: string;
  activeLabel: string;
  expiredLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const isActive = status === "active";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 md:p-5 transition-colors ${
        isActive
          ? "border-[hsl(var(--nav-theme)/0.6)] bg-[hsl(var(--nav-theme)/0.08)]"
          : "border-border bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <code
          className={`rounded-md px-2.5 py-1 text-sm font-bold tracking-wide ${
            isActive
              ? "bg-[hsl(var(--nav-theme)/0.2)] text-[hsl(var(--nav-theme-light))]"
              : "bg-white/5 text-muted-foreground"
          }`}
        >
          {code}
        </code>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-muted-foreground border border-border"
          }`}
        >
          {isActive ? activeLabel : expiredLabel}
        </span>
      </div>
      <p className="text-sm text-foreground/90">{reward}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{rewardType}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Generic accordion list. Items normalize to { title, subtitle?, body?, bullets? }. */
function AccordionList({
  items,
  icon,
}: {
  items: Array<{
    title: string;
    subtitle?: string;
    body?: string;
    bullets?: string[];
  }>;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-white/5"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-3">
                {icon}
                <span className="font-semibold">{item.title}</span>
              </span>
              <ChevronDown
                className={`h-5 w-5 flex-shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-sm text-muted-foreground">
                {item.subtitle && (
                  <p className="mb-3 font-medium text-foreground/90">
                    {item.subtitle}
                  </p>
                )}
                {item.body && <p className="mb-3">{item.body}</p>}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-2">
                    {item.bullets.map((b: string, bi: number) => (
                      <li key={bi} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.emergencyresponselibertycountywiki.wiki";

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Emergency Response Liberty County Wiki",
        description:
          "Complete Emergency Response Liberty County Wiki covering codes, vehicles, departments, robberies, map, private server commands, and update logs for the open-world emergency services roleplay game on Roblox.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Emergency Response Liberty County - Open-World Emergency Services Roleplay",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Emergency Response Liberty County Wiki",
        alternateName: "ERLC Wiki",
        url: siteUrl,
        description:
          "Complete Emergency Response Liberty County Wiki resource hub for codes, vehicles, departments, robbery guides, private server commands, and update logs",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Emergency Response Liberty County Wiki - Open-World Emergency Services Roleplay",
        },
        sameAs: [
          "https://erlc.gg",
          "https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County",
          "https://discord.gg/prc",
          "https://x.com/PRC_Roblox",
          "https://www.reddit.com/r/erlc/",
          "https://www.youtube.com/c/policeroleplaycommunity",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Emergency Response Liberty County",
        gamePlatform: ["Roblox", "PC", "Mac", "Mobile"],
        applicationCategory: "Game",
        genre: ["Roleplay", "Simulation", "Multiplayer"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 50,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County",
        },
      },
      {
        "@type": "VideoObject",
        name: "Emergency Response: Liberty County - Game Trailer",
        description:
          "Official Emergency Response: Liberty County game trailer by Police Roleplay Community.",
        uploadDate: "2024-11-16",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/tbagi4eht-4",
        url: "https://www.youtube.com/watch?v=tbagi4eht-4",
      },
    ],
  };

  const mobileBannerAd = getPreferredMobileBannerSelection();

  // Codes: split active vs expired so the active code can be pinned on top.
  const allCodes: any[] = t.modules.erlcCodes.items;
  const activeCodes = allCodes.filter((c: any) => c.status === "active");
  const expiredCodes = allCodes.filter((c: any) => c.status !== "active");

  // Tools Grid card -> section anchor mapping (one card per module).
  const toolsSectionIds = [
    "codes",
    "beginner-guide",
    "police-sheriff-guide",
    "fire-rescue-dot-guide",
    "vehicles-guide",
    "money-rank-up-guide",
    "private-servers-custom-liveries",
    "updates",
  ];

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* =========================================================
          Hero Section
         ========================================================= */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("codes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* =========================================================
          Video Section - 紧跟 Hero（容器上限 max-w-5xl）
         ========================================================= */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="tbagi4eht-4"
              title="Emergency Response: Liberty County - Game Trailer"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          Tools Grid - 8 Navigation Cards（位于视频区之后、Latest Updates 之前）
         ========================================================= */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = toolsSectionIds[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                                bg-[hsl(var(--nav-theme)/0.1)]
                                flex items-center justify-center
                                group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                transition-colors"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm md:text-base font-semibold leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          Latest Updates Section（保留模板模块，不修改其组件）
         ========================================================= */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* =========================================================
          Module 1: Emergency Response Liberty County Codes
         ========================================================= */}
      <section id="codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcCodes.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcCodes.intro}
            </p>
          </div>

          {/* Active codes pinned first */}
          {activeCodes.length > 0 && (
            <div className="scroll-reveal mb-6 md:mb-8 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              {activeCodes.map((c: any, index: number) => (
                <CodeCard
                  key={`active-${index}`}
                  code={c.code}
                  reward={c.reward}
                  status={c.status}
                  rewardType={c.rewardType}
                  activeLabel={t.modules.erlcCodes.activeLabel}
                  expiredLabel={t.modules.erlcCodes.expiredLabel}
                />
              ))}
            </div>
          )}

          {/* Expired codes */}
          <div className="scroll-reveal grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            {expiredCodes.map((c: any, index: number) => (
              <CodeCard
                key={`expired-${index}`}
                code={c.code}
                reward={c.reward}
                status={c.status}
                rewardType={c.rewardType}
                activeLabel={t.modules.erlcCodes.activeLabel}
                expiredLabel={t.modules.erlcCodes.expiredLabel}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* =========================================================
          Module 2: Emergency Response Liberty County Beginner Guide
         ========================================================= */}
      <section
        id="beginner-guide"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcBeginnerGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcBeginnerGuide.intro}
            </p>
          </div>

          {/* Steps */}
          <div className="scroll-reveal space-y-3 md:space-y-4 mb-8 md:mb-10">
            {t.modules.erlcBeginnerGuide.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                  <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-4 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.erlcBeginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================
          Module 3: Emergency Response Liberty County Police and Sheriff Guide
         ========================================================= */}
      <section id="police-sheriff-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcPoliceSheriffGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcPoliceSheriffGuide.intro}
            </p>
          </div>

          <div className="scroll-reveal">
            <AccordionList
              items={t.modules.erlcPoliceSheriffGuide.items.map((it: any) => ({
                title: it.heading,
                subtitle: it.summary,
                bullets: it.details,
              }))}
            />
          </div>
        </div>
      </section>

      {/* 广告位: 中部阅读停顿 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* =========================================================
          Module 4: Emergency Response Liberty County Fire Rescue and DOT Guide
         ========================================================= */}
      <section
        id="fire-rescue-dot-guide"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcFireRescueDotGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcFireRescueDotGuide.intro}
            </p>
          </div>

          {/* Comparison table */}
          <div className="scroll-reveal overflow-hidden rounded-xl border border-border">
            {/* Header row */}
            <div className="grid grid-cols-1 md:grid-cols-3 bg-white/5 border-b border-border">
              <div className="hidden md:block p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.modules.erlcFireRescueDotGuide.categoryHeader}
              </div>
              <div className="p-4 md:border-l border-border flex items-center gap-2 font-semibold text-[hsl(var(--nav-theme-light))]">
                <span className="md:hidden text-xs uppercase text-muted-foreground">Fire &amp; Rescue — </span>
                {t.modules.erlcFireRescueDotGuide.fireRescueHeader}
              </div>
              <div className="p-4 md:border-l border-border flex items-center gap-2 font-semibold text-[hsl(var(--nav-theme-light))]">
                <span className="md:hidden text-xs uppercase text-muted-foreground">DOT — </span>
                {t.modules.erlcFireRescueDotGuide.dotHeader}
              </div>
            </div>
            {/* Body rows */}
            {t.modules.erlcFireRescueDotGuide.rows.map((row: any, index: number) => (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-3 ${
                  index !== t.modules.erlcFireRescueDotGuide.rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="p-4 text-sm font-semibold bg-white/[0.02] md:bg-transparent">
                  {row.category}
                </div>
                <div className="p-4 text-sm text-muted-foreground md:border-l border-border">
                  {row.fireRescue}
                </div>
                <div className="p-4 text-sm text-muted-foreground md:border-l border-border">
                  {row.dot}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          Module 5: Emergency Response Liberty County Vehicles Guide
         ========================================================= */}
      <section id="vehicles-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcVehiclesGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcVehiclesGuide.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.modules.erlcVehiclesGuide.cards.map((card: any, index: number) => (
              <div
                key={index}
                className="flex flex-col gap-3 p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <DynamicIcon
                    name={card.team === "Department of Transportation" ? "Truck" : "Car"}
                    className="h-5 w-5 text-[hsl(var(--nav-theme-light))]"
                  />
                  <h3 className="font-bold">{card.title}</h3>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] px-2 py-0.5 text-xs">
                  {card.team}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t.modules.erlcVehiclesGuide.labels.access}
                  </p>
                  <p className="text-sm text-muted-foreground">{card.access}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t.modules.erlcVehiclesGuide.labels.bestFor}
                  </p>
                  <p className="text-sm text-muted-foreground">{card.bestFor}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    {t.modules.erlcVehiclesGuide.labels.keyFeatures}
                  </p>
                  <ul className="space-y-1">
                    {card.features.map((f: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto rounded-lg bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.2)] p-3">
                  <p className="text-xs font-semibold text-[hsl(var(--nav-theme-light))] mb-1">
                    {t.modules.erlcVehiclesGuide.labels.recommendation}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位: 阅读停顿 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* =========================================================
          Module 6: Emergency Response Liberty County Money and Rank Up Guide
         ========================================================= */}
      <section
        id="money-rank-up-guide"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcMoneyRankUpGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcMoneyRankUpGuide.intro}
            </p>
          </div>

          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.erlcMoneyRankUpGuide.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="flex flex-col gap-3 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors md:flex-row md:gap-5"
              >
                <div className="flex items-center gap-3 md:flex-shrink-0 md:w-48 md:flex-col md:items-start">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                    <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg leading-snug">
                      {step.title}
                    </h3>
                    <span className="mt-1 inline-flex items-center rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] px-2 py-0.5 text-xs">
                      {step.team}
                    </span>
                  </div>
                </div>
                <div className="md:flex-1">
                  <ul className="space-y-1.5 mb-3">
                    {step.actions.map((a: string, ai: number) => (
                      <li key={ai} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] px-2.5 py-1">
                      {t.modules.erlcMoneyRankUpGuide.labels.rewardFocus}: {step.rewardFocus}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/5 border border-border px-2.5 py-1 text-muted-foreground">
                      {t.modules.erlcMoneyRankUpGuide.labels.bestFor}: {step.bestFor}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          Module 7: Emergency Response Liberty County Private Servers and Custom Liveries
         ========================================================= */}
      <section
        id="private-servers-custom-liveries"
        className="scroll-mt-24 px-4 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcPrivateServersCustomLiveries.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcPrivateServersCustomLiveries.intro}
            </p>
          </div>

          <div className="scroll-reveal">
            <AccordionList
              items={t.modules.erlcPrivateServersCustomLiveries.items.map((it: any) => ({
                title: it.title,
                body: it.content,
                bullets: it.checklist,
              }))}
            />
          </div>
        </div>
      </section>

      {/* 广告位 6: 移动端横幅 320×50 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* =========================================================
          Module 8: Emergency Response Liberty County Updates
         ========================================================= */}
      <section
        id="updates"
        className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.erlcUpdates.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.erlcUpdates.intro}
            </p>
          </div>

          {/* Timeline */}
          <div className="scroll-reveal relative pl-6 border-l-2 border-[hsl(var(--nav-theme)/0.3)] space-y-8">
            {t.modules.erlcUpdates.entries.map((entry: any, index: number) => (
              <div key={index} className="relative">
                <div className="absolute -left-[1.4rem] w-4 h-4 rounded-full bg-[hsl(var(--nav-theme))] border-2 border-background" />
                <div className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                      {entry.date}
                    </span>
                  </div>
                  <h3 className="font-bold mb-1.5">{entry.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{entry.summary}</p>
                  <ul className="space-y-1">
                    {entry.highlights.map((h: string, hi: number) => (
                      <li key={hi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--nav-theme-light))]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.footer.description}
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://erlc.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.website}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/games/2534724415/Emergency-Response-Liberty-County"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.roblox}
                  </a>
                </li>
              </ul>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.gg/prc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/PRC_Roblox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.reddit.com/r/erlc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.reddit}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/c/policeroleplaycommunity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.youtube}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
