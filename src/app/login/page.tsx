"use client";

import { useState } from "react";
import MoshBit from "./MoshBit";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 주소를 다시 확인해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setLoading(true);
    // TODO: 실제 인증 연동 (Auth.js / Clerk 등)
    setTimeout(() => setLoading(false), 1400);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(360px,420px)]">
      {/* left — pixel-art moshbit */}
      <section className="relative hidden overflow-hidden border-r border-line lg:block">
        <MoshBit />
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-10">
          <span className="font-display text-xl tracking-tight text-bone/90">
            Mosh<span className="text-acid">Bit</span>
          </span>
          <div className="max-w-xs">
            <p className="font-display text-3xl leading-[1.05] tracking-tight text-bone">
              사람과 AI가
              <br />
              함께 부딪쳐 만드는
              <br />
              mosh<span className="text-acid">bit</span>
            </p>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-smoke">
              대화로 시작해 마크다운으로 완성하는
              <br />
              AI 협업 기획 도구.
            </p>
          </div>
        </div>
      </section>

      {/* right — login */}
      <div className="flex flex-col items-center justify-center px-6 py-16">
      <div className="reveal w-full max-w-[21rem]">
        {/* wordmark — mobile only, the left panel carries it on desktop */}
        <div className="mb-12 text-center lg:hidden">
          <span className="font-display text-3xl tracking-tight">
            Mosh<span className="text-acid">Bit</span>
          </span>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight">
          로그인
        </h1>
        <p className="mt-1.5 text-center text-[14px] text-smoke">
          워크스페이스에 들어가려면 인증이 필요해요.
        </p>

        {/* oauth */}
        <div className="mt-8 space-y-2.5">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line py-2.5 text-[14px] font-medium transition-colors hover:border-smoke"
          >
            <GithubMark className="h-[17px] w-[17px]" />
            GitHub로 계속하기
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line py-2.5 text-[14px] font-medium transition-colors hover:border-smoke"
          >
            <GoogleMark className="h-[17px] w-[17px]" />
            Google로 계속하기
          </button>
        </div>

        {/* divider */}
        <div className="my-6 flex items-center gap-3 text-[12px] text-smoke">
          <span className="h-px flex-1 bg-line" />
          또는
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이메일">
            <input
              type="email"
              autoComplete="email"
              placeholder="you@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2.5 text-[14px] outline-none transition-colors placeholder:text-smoke/60 focus:border-bone"
            />
          </Field>

          <Field
            label="비밀번호"
            aside={
              <a href="#" className="text-[12px] text-smoke hover:text-bone">
                비밀번호 찾기
              </a>
            }
          >
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-transparent px-3 py-2.5 pr-14 text-[14px] outline-none transition-colors placeholder:text-smoke/60 focus:border-bone"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-smoke hover:text-bone"
              >
                {show ? "숨기기" : "보기"}
              </button>
            </div>
          </Field>

          {error && <p className="text-[13px] text-acid">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-bone py-2.5 text-[14px] font-semibold text-stage transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-smoke">
          아직 계정이 없으신가요?{" "}
          <a href="#" className="text-bone hover:underline">
            워크스페이스 만들기
          </a>
        </p>
      </div>
      </div>
    </main>
  );
}

/* ---------------- field ---------------- */

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] text-bone">{label}</span>
        {aside}
      </span>
      {children}
    </label>
  );
}
