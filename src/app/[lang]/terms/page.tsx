import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import LegalDoc from "../_components/LegalDoc";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).terms;

  return (
    <LegalDoc
      title={t.title}
      updated={t.updated}
      intro={t.intro}
      sections={t.sections}
      backHref={`/${lang}`}
      backLabel={t.back}
    />
  );
}
