import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMPLES, exampleBySlug } from "@/content/examples";
import { missionById } from "@/content";
import { Breadcrumbs, Callout, Disclosure, Pill } from "@/components/ui";
import { CopyButton, StudiedButton } from "@/components/interactive";
import { ExampleCheck } from "@/components/ExampleCheck";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = exampleBySlug((await params).slug);
  return { title: e ? e.title : "Exemplo" };
}

function Code({ code, label, tone }: { code: string; label: string; tone: "bad" | "ok" }) {
  return (
    <figure>
      <figcaption className={`mb-2 flex items-center gap-2 font-bold ${tone === "bad" ? "text-bad" : "text-ok"}`}>
        <span aria-hidden>{tone === "bad" ? "✗" : "✓"}</span> {label}
      </figcaption>
      <div className="relative">
        <div className="absolute right-2 top-2">
          <CopyButton text={code} />
        </div>
        <pre className={`code border-l-4 ${tone === "bad" ? "border-bad" : "border-ok"}`}>
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  );
}

export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = exampleBySlug(slug);
  if (!e) notFound();
  const idx = EXAMPLES.findIndex((x) => x.slug === slug);
  const next = EXAMPLES[idx + 1];

  return (
    <article className="space-y-6">
      <Breadcrumbs items={[{ href: "/", label: "Hoje" }, { href: "/exemplos", label: "Código" }, { label: e.title }]} />
      <header>
        <p className="flex flex-wrap gap-2 text-sm">
          <Pill tone="accent">{e.tag}</Pill>
          <Pill>Nível {e.level}</Pill>
          <Pill>⏱ {e.minutes} min</Pill>
        </p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">{e.title}</h1>
        <p className="reading mt-2 text-lg text-ink-soft">{e.outcome}</p>
      </header>

      <Callout title="Situação">{e.situation}</Callout>

      <section className="space-y-3">
        <Code code={e.wrong.code} label="Como NÃO fazer" tone="bad" />
        <ul className="space-y-1.5">
          {e.wrong.problems.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-bad">
                ✗
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Code code={e.right.code} label="Como fazer" tone="ok" />
        <h2 className="pt-2 font-bold">Porquê</h2>
        <ul className="space-y-1.5">
          {e.why.map((w, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-ok">
                ✓
              </span>
              <span className="reading">{w}</span>
            </li>
          ))}
        </ul>
      </section>

      <ExampleCheck {...e.check} />

      <section className="card p-5">
        <h2 className="font-bold">Checklist para usar no dia a dia</h2>
        <ul className="mt-2 space-y-1.5">
          {e.checklist.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden>☐</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {e.caveat && (
        <Callout tone="warn" title="Atenção / dúvidas declaradas">
          {e.caveat}
        </Callout>
      )}

      <Disclosure summary={`Fontes (${e.sources.length})`}>
        <ul className="space-y-2">
          {e.sources.map((s) => (
            <li key={s.url}>
              <a className="link" href={s.url} target="_blank" rel="noreferrer noopener">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </Disclosure>

      {e.relatedMissions.length > 0 && (
        <p className="text-sm text-ink-soft">
          Missões relacionadas:{" "}
          {e.relatedMissions.map((id, i) => (
            <span key={id}>
              {i > 0 && " · "}
              <Link className="link" href={`/missao/${id}`}>
                {missionById(id)?.title ?? id}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line pt-5">
        <StudiedButton slug={e.slug} />
        {next && (
          <Link href={`/exemplos/${next.slug}`} className="btn btn-secondary">
            Próximo: {next.title} →
          </Link>
        )}
      </div>
    </article>
  );
}
