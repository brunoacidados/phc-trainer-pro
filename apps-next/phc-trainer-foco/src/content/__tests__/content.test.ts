import { describe, expect, it } from "vitest";
import { CARDS, GLOSSARY, LEVELS, MISSIONS, QUIZZES, splitSentences } from "..";
import { EXAMPLES } from "../examples";

const allText = JSON.stringify({ MISSIONS, CARDS, QUIZZES, GLOSSARY });

describe("integridade do conteúdo", () => {
  it("volumes esperados", () => {
    expect(MISSIONS.length).toBe(114);
    expect(LEVELS.length).toBe(17);
    expect(QUIZZES.length).toBe(17);
    expect(CARDS.length).toBeGreaterThanOrEqual(188);
  });
  it("ids de carta são únicos e estáveis (bug A3 — original usava a posição no array)", () => {
    const ids = new Set(CARDS.map((c) => c.id));
    expect(ids.size).toBe(CARDS.length);
    expect(CARDS[0].id).toMatch(/^c0-[0-9a-z]+$/);
  });
  it("todas as missões têm teoria, passos e pelo menos uma prova", () => {
    for (const m of MISSIONS) {
      expect(m.theory.sentences.length, m.id).toBeGreaterThan(0);
      expect(m.steps.length, m.id).toBeGreaterThan(0);
      expect(m.proofs.length, m.id).toBeGreaterThan(0);
    }
  });
  it("sem passos duplicados (errata E1)", () => {
    for (const m of MISSIONS) expect(new Set(m.steps).size, m.id).toBe(m.steps.length);
  });
  it("respostas dos testes apontam para opções existentes", () => {
    for (const q of QUIZZES) for (const x of q.questions) expect(x.answer).toBeLessThan(x.options.length);
  });
  it("todos os pré-requisitos existem", () => {
    const ids = new Set(MISSIONS.map((m) => m.id));
    for (const m of MISSIONS) for (const p of m.prerequisites) expect(ids.has(p), `${m.id}→${p}`).toBe(true);
  });
});

describe("errata não regride", () => {
  it.each([
    ["E2 IVA invertido", "a pagar (2432>2433)"],
    ["E3 ATCUD 2021", "Desde 2021 (v27 do PHC CS) todos"],
    ["E3 glossário", "Desde 2021 é obrigatório"],
    ["E4 NOLOCK como regra", "Boas práticas: NOLOCK em leituras"],
    ["E5 stamp como versão", "stamp marca a 'versão'"],
    ["E7 UI legada", "💾 Exportar"],
  ])("%s", (_label, bad) => {
    expect(allText.includes(bad)).toBe(false);
  });
  it("E3 tem as datas corretas", () => {
    expect(allText).toContain("obrigatório desde 1 jan 2023");
  });
});

describe("chunking", () => {
  it("não parte em abreviaturas", () => {
    expect(splitSentences("Use p.ex. o SSMS. Depois teste.")).toEqual(["Use p.ex. o SSMS.", "Depois teste."]);
    expect(splitSentences("Ver art. 2.º do CIVA. Fim.")).toHaveLength(2);
  });
});

describe("exemplos de código", () => {
  it("cada exemplo tem errado, certo, porquê, verificação e fontes", () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(8);
    const slugs = new Set<string>();
    for (const e of EXAMPLES) {
      expect(slugs.has(e.slug)).toBe(false);
      slugs.add(e.slug);
      expect(e.wrong.code.length).toBeGreaterThan(20);
      expect(e.right.code.length).toBeGreaterThan(20);
      expect(e.why.length).toBeGreaterThanOrEqual(2);
      expect(e.check.options[e.check.answer]).toBeDefined();
      expect(e.sources.length).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.url).toMatch(/^https:\/\//);
      for (const id of e.relatedMissions) expect(MISSIONS.some((m) => m.id === id), id).toBe(true);
    }
  });
});
