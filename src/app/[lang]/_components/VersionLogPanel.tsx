"use client";

import { useState } from "react";
import type { ChangeEntry, VersionLog } from "@/lib/specs";

function DiffView({ diff }: { diff: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-line bg-stage/50 p-2 font-mono text-[11px] leading-relaxed">
      {diff.split("\n").map((line, i) => {
        const tone = line.startsWith("+")
          ? "bg-[#3ecf8e]/10 text-[#7ee2b8]"
          : line.startsWith("-")
            ? "bg-[#f47067]/10 text-[#f6a6a0]"
            : "text-smoke";
        return (
          <div key={i} className={`px-1 ${tone}`}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

export default function VersionLogPanel({
  changelog,
  pageTitles,
  onNavigate,
  pageWord,
  resolveIndex,
}: {
  changelog: VersionLog[];
  pageTitles: string[];
  onNavigate: (pageIndex0: number) => void;
  pageWord: string;
  /** resolve an entry to its current 0-based page index, or null if it has none */
  resolveIndex: (entry: ChangeEntry) => number | null;
}) {
  const [selected, setSelected] = useState(0);
  const version = changelog[selected];
  // newest version is first; only its entries link to the current pages
  const isLatest = selected === 0;

  return (
    <div>
      {/* version chips */}
      <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
        {changelog.map((v, i) => (
          <button
            key={v.version}
            type="button"
            onClick={() => setSelected(i)}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
              i === selected
                ? "border-acid text-bone"
                : "border-line text-smoke hover:border-line-strong hover:text-bone"
            }`}
          >
            {v.version}
          </button>
        ))}
      </div>

      {/* selected version's change log */}
      <div className="max-h-[50vh] space-y-2.5 overflow-y-auto p-3">
        {version.entries.length === 0 ? (
          <p className="text-[12px] text-smoke">—</p>
        ) : (
          version.entries.map((entry, i) => {
            // only the latest version maps onto the current pages; older versions
            // may reference blocks/pages that no longer exist, so don't resolve them
            const idx = isLatest ? resolveIndex(entry) : null;
            const title = idx != null && pageTitles[idx] ? pageTitles[idx] : "";
            const ref =
              idx != null
                ? `${pageWord} ${idx + 1}${title ? ` · ${title}` : ""}`
                : "";
            const clickable = idx != null;

            const body = (
              <>
                {ref ? (
                  <span
                    className={`font-mono text-[11px] ${
                      clickable ? "text-acid" : "text-smoke"
                    }`}
                  >
                    {ref}
                  </span>
                ) : null}
                {entry.title ? (
                  <p className="mt-0.5 text-[13px] text-bone">{entry.title}</p>
                ) : null}
                {entry.diff ? (
                  <div className="mt-2">
                    <DiffView diff={entry.diff} />
                  </div>
                ) : null}
              </>
            );

            return clickable ? (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(idx!)}
                className="block w-full rounded-lg border border-line bg-panel/50 p-3 text-left transition-colors hover:border-line-strong"
              >
                {body}
              </button>
            ) : (
              <div
                key={i}
                className="rounded-lg border border-line bg-panel/50 p-3"
              >
                {body}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
