type Section = { heading: string; body: string };

export default function LegalDoc({
  title,
  updated,
  intro,
  sections,
  backHref,
  backLabel,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <a
        href={backHref}
        className="text-[13px] text-smoke transition-colors hover:text-bone"
      >
        ← {backLabel}
      </a>

      <h1 className="mt-6 font-display text-3xl tracking-tight">{title}</h1>
      <p className="mt-2 text-[13px] text-smoke">{updated}</p>
      <p className="mt-8 text-[15px] leading-relaxed text-bone/90">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-[15px] font-semibold tracking-tight text-bone">
              {s.heading}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-smoke">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
