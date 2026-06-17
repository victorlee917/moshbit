import { notFound } from "next/navigation";
import MoshBit from "./MoshBit";
import { getDictionary, hasLocale } from "../dictionaries";

/* ---------------- icons ---------------- */

function GithubMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.78 2.71 1.27 3.37.97.1-.75.4-1.27.73-1.56-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  );
}

function GoogleMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#EA4335" d="M12 10.2v3.92h5.46c-.24 1.4-.96 2.6-2.04 3.4v2.82h3.3c1.94-1.78 3.06-4.4 3.06-7.54 0-.7-.06-1.38-.18-2.04H12Z" />
      <path fill="#34A853" d="M12 22c2.76 0 5.08-.92 6.78-2.48l-3.3-2.82c-.92.62-2.1.98-3.48.98-2.68 0-4.94-1.8-5.76-4.24H2.82v2.92A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.24 13.44A6 6 0 0 1 5.92 12c0-.5.08-.98.22-1.44V7.64H2.82A10 10 0 0 0 2 12c0 1.6.38 3.12 1.04 4.46l3.2-2.5Z" />
      <path fill="#4285F4" d="M12 5.78c1.5 0 2.86.52 3.92 1.52l2.92-2.92C17.08 1.74 14.76.8 12 .8A10 10 0 0 0 2.82 7.64l3.42 2.92C7.06 7.58 9.32 5.78 12 5.78Z" />
    </svg>
  );
}

/* ---------------- page ---------------- */

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).login;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* full-bleed pixel-art moshbit */}
      <MoshBit />

      {/* login card, floating bottom-centre over the animation */}
      <div className="relative z-10 flex min-h-screen items-end justify-center px-6 pb-16 pt-16">
        <div className="reveal w-full max-w-[22rem] rounded-2xl border border-line bg-stage/70 p-8 backdrop-blur-md">
          <div className="text-center">
            <span className="font-display text-3xl tracking-tight">
              Mosh<span className="text-acid">bit</span>
            </span>
            <p className="mt-2 font-mono text-[13px] tracking-wide text-smoke">
              {t.tagline}
            </p>
          </div>

          {/* social login */}
          <div className="mt-8 space-y-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-stage/40 py-2.5 text-[14px] font-medium transition-colors hover:border-smoke"
            >
              <GithubMark className="h-[17px] w-[17px]" />
              {t.continueWithGithub}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-stage/40 py-2.5 text-[14px] font-medium transition-colors hover:border-smoke"
            >
              <GoogleMark className="h-[17px] w-[17px]" />
              {t.continueWithGoogle}
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-smoke">
            {t.consent.before}
            <br />
            <a
              href={`/${lang}/terms`}
              className="underline underline-offset-2 transition-colors hover:text-bone"
            >
              {t.consent.terms}
            </a>
            {t.consent.and}
            <a
              href={`/${lang}/privacy`}
              className="underline underline-offset-2 transition-colors hover:text-bone"
            >
              {t.consent.privacy}
            </a>
            {t.consent.after}
          </p>
        </div>
      </div>
    </main>
  );
}
