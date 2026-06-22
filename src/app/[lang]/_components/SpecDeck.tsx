"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import VersionLogPanel from "./VersionLogPanel";
import type { DeckPage } from "@/lib/deck";
import type { ChangeEntry, VersionLog } from "@/lib/specs";

/* ---------------- icons ---------------- */

function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function FullscreenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
      <path d="M4 15v4a1 1 0 0 0 1 1h4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

function FullscreenExitIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 4v3a2 2 0 0 1-2 2H4" />
      <path d="M15 4v3a2 2 0 0 0 2 2h3" />
      <path d="M9 20v-3a2 2 0 0 0-2-2H4" />
      <path d="M15 20v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1.3 1.3" />
      <path d="M14 11a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1.3-1.3" />
    </svg>
  );
}

/* ---------------- types ---------------- */

type Meta = {
  title: string;
  status: string;
  statusLabel: string;
  version: string;
  updated: string;
};

type Labels = {
  contents: string;
  prev: string;
  next: string;
  updated: string;
  home: string;
  emptyBody: string;
  page: string;
  fullscreen: string;
  exitFullscreen: string;
  prototype: string;
  element: string;
  policy: string;
  share: string;
  shareFirst: string;
  shareCurrent: string;
  copied: string;
};

/* ---------------- page templates ---------------- */

function PageView({ page, labels }: { page: DeckPage; labels: Labels }) {
  if (page.type === "cover") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-bone sm:text-5xl">
          {page.title}
        </h2>
        {page.html ? (
          <div
            className="markdown mt-6 text-smoke"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        ) : null}
      </div>
    );
  }

  if (page.type === "divider") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <span className="mb-6 h-px w-12 bg-acid" />
        <h2 className="text-3xl font-semibold tracking-tight text-bone sm:text-4xl">
          {page.title}
        </h2>
      </div>
    );
  }

  // policy (default)
  return page.html ? (
    <div
      className="markdown p-8 sm:p-12"
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  ) : (
    <p className="p-8 text-[14px] text-smoke sm:p-12">{labels.emptyBody}</p>
  );
}

// detail page — the prototype is pulled out of any box and shown large on the
// left; the policy table sits on the right.
function DetailView({ page, labels }: { page: DeckPage; labels: Labels }) {
  const frame = page.medium === "app" ? "aspect-[6/13]" : "aspect-[16/9]";
  return (
    <div className="flex h-full w-full max-w-6xl gap-8">
      {/* prototype — no surrounding box, just the prototype at full height.
          numbered pins float on top at each element's authored position. */}
      <div className="flex h-full shrink-0 items-center justify-center">
        <div className={`relative h-full ${frame} max-w-full`}>
          {page.prototypeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.prototypeSrc}
              alt=""
              className="h-full w-full rounded-2xl object-contain shadow-2xl shadow-black/50"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-line-strong text-[12px] text-smoke">
              {labels.prototype}
            </div>
          )}
          {page.definitions
            .filter((d) => d.x != null && d.y != null)
            .map((d) => (
              <span
                key={d.n}
                aria-hidden
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-acid text-[12px] font-bold text-stage shadow-lg ring-2 ring-stage"
              >
                {d.n}
              </span>
            ))}
        </div>
      </div>

      {/* policy table */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2.5">
          <h2 className="text-xl font-semibold tracking-tight text-bone">
            {page.title}
          </h2>
          {page.medium ? (
            <span className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] uppercase text-smoke">
              {page.medium}
            </span>
          ) : null}
        </div>
        <p className="mb-3 mt-1 shrink-0 font-mono text-[11px] uppercase tracking-wide text-smoke">
          {labels.policy}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-line">
          <table className="w-full table-fixed border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-smoke">
                <th className="w-9 border-b border-line px-3 py-2 font-medium">
                  #
                </th>
                <th className="w-1/4 border-b border-line px-3 py-2 font-medium">
                  {labels.element}
                </th>
                <th className="border-b border-line px-3 py-2 font-medium">
                  {labels.policy}
                </th>
              </tr>
            </thead>
            <tbody>
              {page.definitions.map((d) => (
                <tr key={d.n} className="align-top">
                  <td className="border-b border-line/60 px-3 py-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-acid text-[11px] font-bold text-stage">
                      {d.n}
                    </span>
                  </td>
                  <td
                    className="border-b border-line/60 px-3 py-2.5 font-medium text-bone"
                    dangerouslySetInnerHTML={{ __html: d.name }}
                  />
                  <td
                    className="border-b border-line/60 px-3 py-2.5 leading-relaxed text-smoke [&_a]:text-acid [&_strong]:text-bone"
                    dangerouslySetInnerHTML={{ __html: d.policy }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- deck ---------------- */

export default function SpecDeck({
  lang,
  slug,
  initialPage,
  meta,
  pages,
  changelog,
  labels,
}: {
  lang: string;
  slug: string;
  initialPage: number;
  meta: Meta;
  pages: DeckPage[];
  changelog: VersionLog[];
  labels: Labels;
}) {
  const total = pages.length;
  const [current, setCurrent] = useState(() =>
    Math.min(total - 1, Math.max(0, initialPage - 1))
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<"first" | "current" | null>(null);
  const [versionOpen, setVersionOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const copyLink = useCallback(
    async (which: "first" | "current") => {
      const n = which === "first" ? 1 : current + 1;
      const url = `${window.location.origin}/${lang}/specs/${slug}/${n}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // clipboard may be unavailable (e.g. non-secure context) — ignore
      }
      setCopied(which);
      window.setTimeout(() => {
        setCopied(null);
        setShareOpen(false);
      }, 1200);
    },
    [current, lang, slug]
  );

  const go = useCallback(
    (i: number) => setCurrent(Math.min(total - 1, Math.max(0, i))),
    [total]
  );
  const next = useCallback(
    () => setCurrent((c) => Math.min(total - 1, c + 1)),
    [total]
  );
  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // reflect the current page in the URL path so it's shareable, without a
  // full navigation (the deck stays mounted)
  useEffect(() => {
    const url = `/${lang}/specs/${slug}/${current + 1}`;
    window.history.replaceState(window.history.state, "", url);
  }, [current, lang, slug]);

  const page = pages[current];
  // dividers (간지) act as chapter headers; pages after the first one indent under them
  const firstDivider = pages.findIndex((p) => p.type === "divider");
  // resolve a changelog entry to its current page index: prefer the stable block
  // key (survives reordering), fall back to the legacy 1-based page number.
  const keyToIndex = new Map(pages.map((p, i) => [p.key, i]));
  const resolveEntryIndex = (entry: ChangeEntry): number | null => {
    if (entry.block != null) {
      const idx = keyToIndex.get(entry.block);
      if (idx !== undefined) return idx;
    }
    if (entry.page != null && entry.page >= 1 && entry.page <= pages.length) {
      return entry.page - 1;
    }
    return null;
  };

  // pages touched by the latest version's changelog → tag them in the index
  const latestVersion = changelog[0]?.version ?? "";
  const changedInLatest = new Set(
    (changelog[0]?.entries ?? [])
      .map(resolveEntryIndex)
      .filter((i): i is number => i != null)
  );

  return (
    <div
      ref={rootRef}
      className="relative flex h-screen flex-col overflow-hidden bg-stage"
    >
      {/* ── header: home + title + status (left), version + updated (right) ── */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/${lang}/specs`}
            aria-label={labels.home}
            title={labels.home}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-smoke transition-colors hover:border-line-strong hover:text-bone"
          >
            <HomeIcon className="h-4 w-4" />
          </Link>
          <h1 className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-bone">
            {meta.title}
          </h1>
          <span className="shrink-0">
            <StatusBadge status={meta.status} label={meta.statusLabel} />
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {meta.updated ? (
            <span className="font-mono text-[11px] text-smoke">
              {labels.updated} {meta.updated}
            </span>
          ) : null}
          {meta.version ? (
            changelog.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVersionOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={versionOpen}
                  className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    versionOpen
                      ? "border-line-strong bg-panel text-bone"
                      : "border-line bg-panel text-smoke hover:border-line-strong hover:text-bone"
                  }`}
                >
                  {meta.version}
                </button>

                {versionOpen ? (
                  <>
                    <button
                      type="button"
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setVersionOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-lg border border-line bg-panel shadow-xl shadow-black/40">
                      <VersionLogPanel
                        changelog={changelog}
                        pageTitles={pages.map((p) => p.title)}
                        pageWord={labels.page}
                        onNavigate={(i) => go(i)}
                        resolveIndex={resolveEntryIndex}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <span className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-smoke">
                {meta.version}
              </span>
            )
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShareOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={shareOpen}
              aria-label={labels.share}
              title={labels.share}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                shareOpen
                  ? "border-line-strong bg-panel text-bone"
                  : "border-line text-smoke hover:border-line-strong hover:text-bone"
              }`}
            >
              <ShareIcon className="h-4 w-4" />
            </button>

            {shareOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setShareOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-line bg-panel shadow-xl shadow-black/40"
                >
                  {current !== 0 ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => copyLink("first")}
                      className="flex w-full items-center px-3 py-2.5 text-left text-[13px] text-smoke transition-colors hover:bg-stage/60 hover:text-bone"
                    >
                      {copied === "first" ? labels.copied : labels.shareFirst}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => copyLink("current")}
                    className={`flex w-full items-center px-3 py-2.5 text-left text-[13px] text-smoke transition-colors hover:bg-stage/60 hover:text-bone ${
                      current !== 0 ? "border-t border-line" : ""
                    }`}
                  >
                    {copied === "current" ? labels.copied : labels.shareCurrent}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── middle: slide + TOC ── */}
      <div className="flex min-h-0 flex-1">
        <section className="relative flex min-w-0 flex-1 items-center justify-center p-6 sm:p-10">
          <button
            type="button"
            aria-label={labels.prev}
            onClick={prev}
            disabled={current === 0}
            className="absolute left-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-smoke transition-colors hover:border-line-strong hover:text-bone disabled:pointer-events-none disabled:opacity-30 min-[1440px]:flex"
          >
            ‹
          </button>

          {page.type === "detail" ? (
            <DetailView page={page} labels={labels} />
          ) : (
            <div className="aspect-[16/9] max-h-full w-full max-w-5xl overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40">
              <div className="h-full overflow-auto">
                <PageView page={page} labels={labels} />
              </div>
            </div>
          )}

          <button
            type="button"
            aria-label={labels.next}
            onClick={next}
            disabled={current === total - 1}
            className="absolute right-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-smoke transition-colors hover:border-line-strong hover:text-bone disabled:pointer-events-none disabled:opacity-30 min-[1440px]:flex"
          >
            ›
          </button>
        </section>

        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-3 lg:block">
          <p className="px-2 pb-2 font-mono text-[11px] uppercase tracking-wide text-smoke">
            {labels.contents}
          </p>
          <nav className="space-y-0.5">
            {pages.map((p, i) => {
              const isChapter = p.type === "divider";
              const indented =
                !isChapter && firstDivider !== -1 && i > firstDivider;
              const active = i === current;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-[13px] transition-colors ${
                    indented ? "pl-7" : "pl-2"
                  } ${isChapter && i !== 0 ? "mt-2" : ""} ${
                    active
                      ? "bg-panel text-bone"
                      : isChapter
                        ? "font-semibold text-bone hover:bg-panel/60"
                        : "text-smoke hover:bg-panel/60 hover:text-bone"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  {changedInLatest.has(i) ? (
                    <span className="shrink-0 rounded border border-acid/40 px-1 py-0.5 font-mono text-[10px] leading-none text-acid">
                      {latestVersion}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* ── footer: Instagram-style dot carousel + fullscreen toggle ── */}
      <footer className="flex shrink-0 items-center gap-3 border-t border-line px-4 py-3">
        <span className="w-20 shrink-0 font-mono text-[12px] text-smoke">
          {current + 1} / {total}
        </span>

        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-x-auto">
          {pages.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`${labels.page} ${i + 1}`}
              aria-current={i === current}
              className={`shrink-0 rounded-full transition-all ${
                i === current
                  ? "h-2 w-2 bg-acid"
                  : "h-1.5 w-1.5 bg-smoke/40 hover:bg-smoke"
              }`}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 min-[1440px]:w-20">
          {/* prev/next move here once the overlay arrows would overlap the slide */}
          <button
            type="button"
            aria-label={labels.prev}
            onClick={prev}
            disabled={current === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-smoke transition-colors hover:border-line-strong hover:text-bone disabled:pointer-events-none disabled:opacity-30 min-[1440px]:hidden"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={next}
            disabled={current === total - 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-smoke transition-colors hover:border-line-strong hover:text-bone disabled:pointer-events-none disabled:opacity-30 min-[1440px]:hidden"
          >
            ›
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
            title={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
              isFullscreen
                ? "border-line-strong bg-panel text-bone"
                : "border-line text-smoke hover:border-line-strong hover:text-bone"
            }`}
          >
            {isFullscreen ? (
              <FullscreenExitIcon className="h-4 w-4" />
            ) : (
              <FullscreenIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
