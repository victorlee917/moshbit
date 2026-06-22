// Specs are the planning documents the app gathers. Each one is a markdown file
// under content/specs/ — the GitHub repo IS the source of truth, so the grid is
// built from the files at build time (no database). Add a .md file to add a spec.

import { promises as fs } from "fs";
import path from "path";
import { pageCount } from "./deck";

export interface SpecMeta {
  /** Filename without the .md extension; also the URL slug. */
  slug: string;
  title: string;
  summary: string;
  /** draft | review | final — free-form; the UI labels known values. */
  status: string;
  /** ISO date (YYYY-MM-DD) of the last edit; empty if unset. */
  updated: string;
  /** Project this spec belongs to — specs are grouped by it. */
  project: string;
  /** Current document version, e.g. "v0.1". Empty if unset. */
  version: string;
  /** Key keywords for the card; also the basis for future filtering. */
  keywords: string[];
  /** Number of deck pages in the document. */
  pages: number;
}

export interface SpecGroup {
  project: string;
  specs: SpecMeta[];
}

export interface Spec extends SpecMeta {
  /** The markdown body — everything after the frontmatter block. */
  content: string;
}

export interface ChangeEntry {
  /** stable block key this change targets — survives page reordering (preferred) */
  block: string | null;
  /** legacy 1-based page index; used only as a fallback when `block` is unset */
  page: number | null;
  title: string;
  /** git-style diff text; lines prefixed with +, -, or a space (context) */
  diff: string;
}

export interface VersionLog {
  version: string;
  date: string;
  entries: ChangeEntry[];
}

const SPECS_DIR = path.join(process.cwd(), "content", "specs");

// A spec file is a .md whose name doesn't start with `_` or `.` — the underscore
// prefix marks templates/partials (e.g. _TEMPLATE.md) that should never surface
// as real specs in the grid or routes.
const isSpecFile = (f: string): boolean =>
  f.endsWith(".md") && !f.startsWith("_") && !f.startsWith(".");

// A tiny YAML-frontmatter reader — enough for the flat `key: value` blocks we
// author here. Not a general YAML parser; nested/structured values aren't needed.
function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const out: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function buildMeta(
  slug: string,
  fm: Record<string, string>,
  body: string
): SpecMeta {
  return {
    slug,
    title: fm.title || slug,
    summary: fm.summary || "",
    status: fm.status || "draft",
    updated: fm.updated || "",
    project: fm.project || "",
    version: fm.version || "",
    keywords: (fm.keywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    pages: pageCount(body),
  };
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

export async function getSpecs(): Promise<SpecMeta[]> {
  let files: string[];
  try {
    files = await fs.readdir(SPECS_DIR);
  } catch {
    return []; // no content/specs dir yet → empty collection
  }

  const specs = await Promise.all(
    files
      .filter(isSpecFile)
      .map(async (file) => {
        const raw = await fs.readFile(path.join(SPECS_DIR, file), "utf8");
        return buildMeta(
          file.replace(/\.md$/, ""),
          parseFrontmatter(raw),
          stripFrontmatter(raw)
        );
      })
  );

  // newest first — ISO date strings sort lexicographically
  return specs.sort((a, b) => (a.updated < b.updated ? 1 : -1));
}

export async function getSpecSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(SPECS_DIR);
    return files.filter(isSpecFile).map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

export async function getSpec(slug: string): Promise<Spec | null> {
  // slugs come from a dynamic route param — reject anything that isn't a plain
  // slug, then confirm the resolved path stays inside SPECS_DIR (no traversal).
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(slug)) return null;
  const full = path.resolve(SPECS_DIR, `${slug}.md`);
  if (!full.startsWith(path.resolve(SPECS_DIR) + path.sep)) return null;

  let raw: string;
  try {
    raw = await fs.readFile(full, "utf8");
  } catch {
    return null; // unknown slug
  }
  // drop the leading frontmatter block; the rest is the markdown body
  const content = stripFrontmatter(raw);
  return { ...buildMeta(slug, parseFrontmatter(raw), content), content };
}

// per-spec changelog, loaded from a sidecar <slug>.changelog.json.
// Authored newest-version-first; an empty array means "no changelog".
export async function getChangelog(slug: string): Promise<VersionLog[]> {
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(slug)) return [];
  const full = path.resolve(SPECS_DIR, `${slug}.changelog.json`);
  if (!full.startsWith(path.resolve(SPECS_DIR) + path.sep)) return [];

  let raw: string;
  try {
    raw = await fs.readFile(full, "utf8");
  } catch {
    return []; // no changelog file
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  const versions = (data as { versions?: unknown }).versions;
  if (!Array.isArray(versions)) return [];

  return versions.map((v) => {
    const ver = v as { version?: unknown; date?: unknown; entries?: unknown };
    const entries = Array.isArray(ver.entries) ? ver.entries : [];
    return {
      version: String(ver.version ?? ""),
      date: String(ver.date ?? ""),
      entries: entries.map((e) => {
        const en = e as {
          block?: unknown;
          page?: unknown;
          title?: unknown;
          diff?: unknown;
        };
        return {
          block: typeof en.block === "string" ? en.block : null,
          page: typeof en.page === "number" ? en.page : null,
          title: String(en.title ?? ""),
          diff: String(en.diff ?? ""),
        };
      }),
    };
  });
}

// Specs grouped by project — one project can hold many specs. Projects are
// ordered by their most recently updated spec; specs inside keep newest-first.
export async function getSpecGroups(): Promise<SpecGroup[]> {
  const specs = await getSpecs();
  const byProject = new Map<string, SpecMeta[]>();
  for (const spec of specs) {
    const key = spec.project || "";
    const group = byProject.get(key);
    if (group) group.push(spec);
    else byProject.set(key, [spec]);
  }

  return [...byProject.entries()]
    .map(([project, specs]) => ({ project, specs }))
    .sort((a, b) => (a.specs[0].updated < b.specs[0].updated ? 1 : -1));
}
