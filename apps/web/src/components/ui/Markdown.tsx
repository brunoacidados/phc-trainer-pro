import { memo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils.ts";

/** extrai o texto puro de um nó de código (children podem ser spans de highlight) */
function codeText(node: ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(codeText).join("");
  if (typeof node === "object" && "props" in (node as object)) {
    return codeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-([\w-]+)/.exec(className || "")?.[1] || "";
  const raw = codeText(children).replace(/\n$/, "");
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/60 bg-[#161b22] px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {lang || "código"}
        </span>
        <button
          className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-70 hover:bg-secondary/60 hover:text-foreground group-hover:opacity-100"
          onClick={() => {
            navigator.clipboard.writeText(raw);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "copiado" : "copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed">
        <code className={cn("font-mono", className)}>{children}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>;
  },
  code({ className, children, ...rest }) {
    // código inline (não bloco): o react-markdown usa <code> dentro de <pre> p/ blocos;
    // distinguimos: se tem className language-* E está dentro de pre, o pre trata. Aqui inline:
    const isBlock = /language-/.test(className || "");
    if (isBlock)
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    return (
      <code className="rounded border border-border bg-secondary/60 px-1 py-0.5 font-mono text-[0.85em] text-accent">
        {children}
      </code>
    );
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-info underline underline-offset-2 hover:text-accent"
      >
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-border bg-secondary/60 px-3 py-1.5 text-left font-semibold text-accent">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border-b border-border/50 px-3 py-1.5 align-top">{children}</td>;
  },
  h1({ children }) {
    return <h1 className="mb-2 mt-4 text-xl font-bold text-accent">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-4 text-lg font-bold text-accent">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-1 mt-3 text-base font-semibold text-foreground">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="mb-1 mt-2 text-sm font-semibold text-foreground">{children}</h4>;
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-5 marker:text-primary">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-primary">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 rounded-r-md border-l-4 border-primary bg-secondary/40 px-3 py-2 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  p({ children }) {
    return <p className="my-1.5 leading-relaxed">{children}</p>;
  },
  hr() {
    return <hr className="my-3 border-border" />;
  },
};

/** Renderer Markdown p/ texto de IA (chat, aulas, explicações) c/ código formatado + copy */
export const Markdown = memo(function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("text-[13.5px] leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
