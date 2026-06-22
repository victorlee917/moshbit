import Link from "next/link";
import type { SpecMeta } from "@/lib/specs";
import StatusBadge from "./StatusBadge";

export default function SpecCard({
  spec,
  lang,
  statusLabel,
  updatedLabel,
  pagesLabel,
}: {
  spec: SpecMeta;
  lang: string;
  statusLabel: string;
  updatedLabel: string;
  pagesLabel: string;
}) {
  return (
    <Link
      href={`/${lang}/specs/${spec.slug}/1`}
      className="flex min-h-[12rem] flex-col rounded-lg border border-line bg-panel p-5 transition-colors duration-200 hover:border-line-strong"
    >
      {/* status + current version */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={spec.status} label={statusLabel} />
        {spec.version ? (
          <span className="rounded-md border border-line bg-stage/60 px-2 py-0.5 font-mono text-[11px] text-smoke">
            {spec.version}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-bone">
        {spec.title}
      </h3>

      {spec.summary ? (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-smoke">
          {spec.summary}
        </p>
      ) : null}

      {/* key keywords — basis for future filtering */}
      {spec.keywords.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {spec.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-md border border-line bg-stage/40 px-2 py-0.5 font-mono text-[11px] text-smoke"
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-5 font-mono text-[11px] text-smoke/80">
        <span>{spec.updated ? `${updatedLabel} ${spec.updated}` : ""}</span>
        <span>
          {spec.pages} {pagesLabel}
        </span>
      </div>
    </Link>
  );
}
