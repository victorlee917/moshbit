// MoshBit domain model — the shared shape for specs that humans and each user's
// own AI (via MCP) co-edit. Persistence is not wired up yet.

export type Role = "owner" | "editor" | "viewer";
export type AuthorKind = "human" | "ai";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  /** Full markdown — the source of truth. */
  content: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  documentId: string;
  /** A heading slug or line range the comment is anchored to. */
  anchor: string | null;
  body: string;
  authorKind: AuthorKind;
  authorId: string | null;
  createdAt: string;
}
