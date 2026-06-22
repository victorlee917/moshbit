import { notFound } from "next/navigation";
import { hasLocale } from "./dictionaries";
import MoshBit from "./_components/MoshBit";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* full-bleed pixel-art mosh pit */}
      <MoshBit />
    </main>
  );
}
