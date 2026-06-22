import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getSpecGroups } from "@/lib/specs";
import Logo from "../_components/Logo";
import SpecCard from "../_components/SpecCard";

export default async function SpecsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).specs;
  const groups = await getSpecGroups();
  const statusLabels = t.status as Record<string, string>;

  return (
    <div className="dotgrid relative min-h-screen">
      {/* soft acid glow at the top */}
      <div
        aria-hidden
        className="topglow pointer-events-none absolute inset-x-0 top-0 h-72"
      />

      {/* header */}
      <header className="sticky top-0 z-20 border-b border-line bg-stage/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-3.5">
          <Logo lang={lang} />
        </div>
      </header>

      {/* body — spec grid grouped by project */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-bone">
            {t.heading}
          </h1>
          <p className="mt-2 text-[14px] text-smoke">{t.subtitle}</p>
        </div>

        {groups.length === 0 ? (
          <p className="text-[14px] text-smoke">{t.empty}</p>
        ) : (
          <div className="space-y-14">
            {groups.map((group) => (
              <section key={group.project || "__none"}>
                <div className="mb-5 flex items-center gap-2.5 border-b border-line pb-3">
                  <h2 className="text-[15px] font-semibold tracking-tight text-bone">
                    {group.project || t.untitledProject}
                  </h2>
                  <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-smoke">
                    {group.specs.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.specs.map((spec) => (
                    <SpecCard
                      key={spec.slug}
                      spec={spec}
                      lang={lang}
                      statusLabel={statusLabels[spec.status] ?? spec.status}
                      updatedLabel={t.updated}
                      pagesLabel={t.pages}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
