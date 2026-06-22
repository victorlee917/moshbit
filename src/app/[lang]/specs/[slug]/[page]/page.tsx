import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../../dictionaries";
import { getSpec, getSpecSlugs, getChangelog } from "@/lib/specs";
import { buildPages, pageCount } from "@/lib/deck";
import SpecDeck from "../../../_components/SpecDeck";

// only serve slug/page pairs known at build time
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getSpecSlugs();
  const params: { slug: string; page: string }[] = [];
  for (const slug of slugs) {
    const spec = await getSpec(slug);
    if (!spec) continue;
    const n = pageCount(spec.content);
    for (let p = 1; p <= n; p++) params.push({ slug, page: String(p) });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string; page: string }>;
}) {
  const { slug } = await params;
  const spec = await getSpec(slug);
  return { title: spec ? `${spec.title} — Moshbit` : "Moshbit" };
}

export default async function SpecPageView({
  params,
}: {
  params: Promise<{ lang: string; slug: string; page: string }>;
}) {
  const { lang, slug, page } = await params;
  if (!hasLocale(lang)) notFound();

  const spec = await getSpec(slug);
  if (!spec) notFound();

  const t = (await getDictionary(lang)).specs;
  const statusLabels = t.status as Record<string, string>;
  // content is authored in the repo (trusted), so rendered HTML is safe to inline
  const pages = await buildPages(spec.content, spec.title, t.deck.page);
  const changelog = await getChangelog(slug);

  const initialPage = Number(page);
  if (
    !Number.isInteger(initialPage) ||
    initialPage < 1 ||
    initialPage > pages.length
  ) {
    notFound();
  }

  return (
    <SpecDeck
      lang={lang}
      slug={slug}
      initialPage={initialPage}
      meta={{
        title: spec.title,
        status: spec.status,
        statusLabel: statusLabels[spec.status] ?? spec.status,
        version: spec.version,
        updated: spec.updated,
      }}
      pages={pages}
      changelog={changelog}
      labels={{
        contents: t.deck.contents,
        prev: t.deck.prev,
        next: t.deck.next,
        home: t.deck.home,
        page: t.deck.page,
        fullscreen: t.deck.fullscreen,
        exitFullscreen: t.deck.exitFullscreen,
        prototype: t.deck.prototype,
        element: t.deck.element,
        policy: t.deck.policy,
        share: t.deck.share,
        shareFirst: t.deck.shareFirst,
        shareCurrent: t.deck.shareCurrent,
        copied: t.deck.copied,
        updated: t.updated,
        emptyBody: t.emptyBody,
      }}
    />
  );
}
