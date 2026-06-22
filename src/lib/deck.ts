// Deck model — a spec body is a sequence of pages separated by `---`.
// Each page declares its kind with a leading directive comment, e.g.
//   <!-- type: cover -->
// and is rendered with a kind-specific template in the viewer.
//
//   cover   표지        the very first page (title page)
//   divider 간지        a chapter separator
//   policy  정책 페이지  high-level policy / background / sequence diagrams (free markdown)
//   detail  상세 기획   prototype (left, numbered) + definitions (right, per number)
//
// Authoring a detail page:
//   <!-- type: detail -->
//   # 화면 이름
//   ![](/wireframe.png)        ← optional prototype image (placeholder shown if absent)
//   1. **요소 이름** — 이 요소의 정책/동작 설명
//   2. ...
//
// Stable block keys:
//   Every page gets a `key` that is STABLE across reordering — so changelog
//   entries, diffs, and (later) comments can anchor to a block without breaking
//   when pages move. By default the key is derived from the page's type + heading
//   (e.g. "detail-로그인-화면"); add an explicit, hand-picked key with
//   <!-- id: login-screen --> when you want it to survive heading edits too.

import { marked } from "marked";

export type PageType = "cover" | "divider" | "policy" | "detail";

const PAGE_TYPES: PageType[] = ["cover", "divider", "policy", "detail"];

export interface Definition {
  /** the number shown on the prototype and in the policy table */
  n: number;
  /** the element name (left of the dash) */
  name: string;
  /** the policy / behaviour for that element (right of the dash) */
  policy: string;
}

export interface DeckPage {
  /** stable identifier for this block — survives reordering (see header note) */
  key: string;
  type: PageType;
  title: string;
  /** rendered markdown — cover subtitle / policy body; empty for divider & detail */
  html: string;
  /** detail only — prototype image src, or null to show the placeholder */
  prototypeSrc: string | null;
  /** detail only — numbered element definitions */
  definitions: Definition[];
  /** detail only — "app" (portrait) or "web" (landscape); sets prototype ratio & badge */
  medium: string;
}

function readDirectives(chunk: string): {
  type: PageType | null;
  medium: string | null;
  id: string | null;
  body: string;
} {
  let body = chunk;
  let type: PageType | null = null;
  let medium: string | null = null;
  let id: string | null = null;
  const directive = /^\s*<!--\s*([\w-]+)\s*:\s*(.*?)\s*-->\s*\r?\n?/;
  let m: RegExpMatchArray | null;
  while ((m = body.match(directive))) {
    const key = m[1];
    const value = m[2].trim();
    if (key === "type" && (PAGE_TYPES as string[]).includes(value)) {
      type = value as PageType;
    } else if (key === "medium") {
      medium = value.toLowerCase();
    } else if (key === "id") {
      id = value;
    }
    body = body.slice(m[0].length);
  }
  return { type, medium, id, body: body.trim() };
}

function firstHeading(md: string): string {
  const m = md.match(/^#{1,6}\s+(.+)$/m);
  return m ? m[1].replace(/[*_`]/g, "").trim() : "";
}

// derive a key fragment from text — keep unicode letters/digits (Korean stays
// readable), collapse everything else to single hyphens. Only used to build a
// stable block key, so legibility beats strict ASCII.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function stripFirstHeading(md: string): string {
  return md.replace(/^#{1,6}\s+.+(\r?\n)?/m, "").trim();
}

function firstImage(md: string): string | null {
  const m = md.match(/!\[[^\]]*\]\(([^)\s]+)/);
  return m ? m[1].trim() : null;
}

async function parseDefinitions(md: string): Promise<Definition[]> {
  const defs: Definition[] = [];
  const re = /^\s*(\d+)\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    // "요소 이름 — 정책 설명" → split on the first dash surrounded by spaces
    const parts = m[2].trim().split(/\s+[—–-]\s+/);
    const name = parts[0].trim();
    const policy = parts.slice(1).join(" — ").trim();
    defs.push({
      n: Number(m[1]),
      name: await marked.parseInline(name),
      policy: await marked.parseInline(policy),
    });
  }
  return defs;
}

// number of pages a body splits into — used for static params & range checks
export function pageCount(body: string): number {
  const n = body
    .split(/^\s*---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean).length;
  return Math.max(1, n);
}

const emptyPage = (
  key: string,
  title: string,
  type: PageType,
  medium = ""
): DeckPage => ({
  key,
  type,
  title,
  html: "",
  prototypeSrc: null,
  definitions: [],
  medium,
});

export async function buildPages(
  body: string,
  fallbackTitle: string,
  pageWord: string
): Promise<DeckPage[]> {
  const chunks = body
    .split(/^\s*---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return [emptyPage("page-1", fallbackTitle, "policy")];
  }

  // first pass: read directives + heading so we can derive keys before rendering
  const parsed = chunks.map((chunk, i) => {
    const { type, medium, id, body: b } = readDirectives(chunk);
    return {
      kind: type ?? "policy",
      medium,
      id,
      body: b,
      title: firstHeading(b) || `${pageWord} ${i + 1}`,
    };
  });

  // explicit <!-- id: --> wins; otherwise derive from type + heading. Dedupe by
  // suffixing -2, -3, … so keys stay unique even when two blocks would collide.
  const seen = new Map<string, number>();
  const keys = parsed.map((p) => {
    const base = (p.id ? slugify(p.id) : `${p.kind}-${slugify(p.title)}`) || p.kind;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });

  return Promise.all(
    parsed.map(async (p, i): Promise<DeckPage> => {
      const key = keys[i];
      switch (p.kind) {
        case "cover":
          return {
            ...emptyPage(key, p.title, "cover"),
            html: await marked.parse(stripFirstHeading(p.body)),
          };
        case "divider":
          return emptyPage(key, p.title, "divider");
        case "detail":
          return {
            ...emptyPage(key, p.title, "detail", p.medium || "web"),
            prototypeSrc: firstImage(p.body),
            definitions: await parseDefinitions(p.body),
          };
        default:
          return {
            ...emptyPage(key, p.title, "policy"),
            html: await marked.parse(p.body),
          };
      }
    })
  );
}
