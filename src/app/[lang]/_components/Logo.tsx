import Link from "next/link";

// MoshBit wordmark — "Bit" in acid. Links home.
export default function Logo({ lang }: { lang: string }) {
  return (
    <Link
      href={`/${lang}`}
      className="font-display text-2xl tracking-tight transition-opacity hover:opacity-80"
    >
      Mosh<span className="text-acid">bit</span>
    </Link>
  );
}
