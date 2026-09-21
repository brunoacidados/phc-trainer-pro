import { describe, expect, it } from "vitest";
import { BELTS, CARDS, CONTAB_OFICIAL, COURSES, LABS, QUIZZES } from "@phc/content";

/**
 * Testes de integridade do conteúdo pedagógico —
 * garante que o curso de Contabilidade (nível 9) mantém a qualidade/fidelidade
 * após cada enriquecimento (fontes oficiais PHC: certificação, Help Center, vídeos).
 */
describe("conteúdo — integridade geral", () => {
  it("todas as missões têm nível válido e campos obrigatórios", () => {
    for (const l of LABS) {
      expect(l.lv, `${l.id} lv`).toBeGreaterThanOrEqual(0);
      expect(l.lv, `${l.id} lv`).toBeLessThan(BELTS.length);
      expect(l.t.length, `${l.id} título`).toBeGreaterThan(5);
      expect(l.steps.length, `${l.id} steps`).toBeGreaterThan(0);
      expect(l.proofs.length, `${l.id} proofs`).toBeGreaterThan(0);
    }
  });

  it("todas as cartas têm nível válido", () => {
    for (const c of CARDS) {
      expect(c.lv, c.t).toBeGreaterThanOrEqual(0);
      expect(c.lv, c.t).toBeLessThan(BELTS.length);
      expect(c.t.length, c.t).toBeGreaterThan(3);
      expect(c.b.length, c.t).toBeGreaterThan(2);
    }
  });

  it("links de missões são bem formados (kinds válidos + URLs http)", () => {
    const kinds = new Set(["manual", "video", "doc", "legal", "canal"]);
    let n = 0;
    for (const l of LABS) {
      for (const k of l.links ?? []) {
        n++;
        expect(kinds.has(k.k), `${l.id} kind ${k.k}`).toBe(true);
        expect(k.u.startsWith("http"), `${l.id} url ${k.u}`).toBe(true);
        expect(k.t.length).toBeGreaterThan(3);
      }
    }
    expect(n).toBeGreaterThanOrEqual(30); // recursos oficiais de L57–L66
  });
});

describe("curso de Contabilidade (nível 9) — fidelidade oficial", () => {
  const labsContab = LABS.filter((l) => l.lv === 9);

  it("tem as 10 missões L57–L66, todas com recursos oficiais", () => {
    expect(labsContab).toHaveLength(10);
    for (const l of labsContab) {
      expect((l.links ?? []).length, `${l.id} sem links oficiais`).toBeGreaterThanOrEqual(2);
    }
  });

  it("tem baralho de flashcards próprio (>= 20 cartas de nível 9)", () => {
    expect(CARDS.filter((c) => c.lv === 9).length).toBeGreaterThanOrEqual(20);
  });

  it("teste de nível 9 cobre >= 12 perguntas", () => {
    const q9 = QUIZZES.find((q) => q.lv === 9);
    expect(q9).toBeTruthy();
    expect(q9!.qs.length).toBeGreaterThanOrEqual(12);
    // cada pergunta tem 4 opções e índice válido
    for (const q of q9!.qs) {
      expect(q.o).toHaveLength(4);
      expect(q.a).toBeGreaterThanOrEqual(0);
      expect(q.a).toBeLessThan(q.o.length);
      expect(q.why.length).toBeGreaterThan(5);
    }
  });

  it("programa oficial: 7 temas de certificação, 20 aulas e-learning + 3 Enterprise", () => {
    expect(CONTAB_OFICIAL.certificacao.temas).toHaveLength(7);
    expect(CONTAB_OFICIAL.aulasElearning).toHaveLength(20);
    expect(CONTAB_OFICIAL.aulasEnterprise).toHaveLength(3);
    expect(CONTAB_OFICIAL.imobilizado.etapas).toHaveLength(6);
    // cada aula oficial aponta para uma missão existente
    const ids = new Set(LABS.map((l) => l.id));
    for (const a of [...CONTAB_OFICIAL.aulasElearning, ...CONTAB_OFICIAL.aulasEnterprise]) {
      expect(ids.has(a.missao), `aula "${a.t}" → ${a.missao}`).toBe(true);
      expect(a.min).toBeGreaterThan(0);
    }
  });

  it("todos os vídeos oficiais apontam para YouTube e cada missão contab usa fontes oficiais", () => {
    for (const v of CONTAB_OFICIAL.videos) {
      expect(v.u).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    }
    // Help Center: só domínios oficiais
    for (const h of CONTAB_OFICIAL.helpcenter) {
      expect(h.u).toMatch(/^https?:\/\/(helpcenter\.phccs\.net|phc\.pt)/);
    }
  });

  it("curso 'contab' está ativo no catálogo com o belt 9", () => {
    const c = COURSES.find((x) => x.id === "contab");
    expect(c).toBeTruthy();
    expect(c!.status).toBe("ativo");
    expect(c!.belts).toEqual([9]);
  });
});
