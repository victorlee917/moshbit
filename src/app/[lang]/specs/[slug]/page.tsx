import { redirect } from "next/navigation";
import { getSpecSlugs } from "@/lib/specs";

// the bare spec URL has no page in the path — send it to the first page
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getSpecSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function SpecRedirect({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  redirect(`/${lang}/specs/${slug}/1`);
}
