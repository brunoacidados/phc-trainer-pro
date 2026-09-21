import { describe, expect, it } from "vitest";
import {
  BELTS,
  CARDS,
  CONTAB_OFICIAL,
  LABS,
  QUIZZES,
  SECTOR_PORTAS,
  SEGMENTS,
  THEORY,
  labById,
  sectorCaseForLevel,
  sectorPhasesForMission,
} from "./index.ts";

describe("content integrity — Contabilidade (v6.14.0)", () => {
  it("tem 17 níveis e 114 missões", () => {
    expect(BELTS.length).toBe(17);
    expect(LABS.length).toBe(114);
  });

  it("todas as missões L57–L66 têm recursos oficiais", () => {
    for (let i = 57; i <= 66; i++) {
      const lab = labById(`L${i}`);
      expect(lab, `L${i} existe`).toBeDefined();
      expect(lab!.links?.length ?? 0, `L${i} tem links`).toBeGreaterThan(0);
    }
  });

  it("todos os links de missão são URLs válidas", () => {
    for (const lab of LABS) {
      for (const l of lab.links ?? []) {
        expect(l.u, `${lab.id} link`).toMatch(/^https?:\/\//);
        expect(["manual", "video", "doc", "legal", "canal"]).toContain(l.k);
      }
    }
  });

  it("programa oficial de Contabilidade carregado com vídeos e certificação", () => {
    expect(CONTAB_OFICIAL.aulasElearning.length).toBeGreaterThanOrEqual(20);
    expect(CONTAB_OFICIAL.videos.length).toBeGreaterThanOrEqual(10);
    expect(CONTAB_OFICIAL.certificacao.url).toMatch(/^https?:\/\/.+phc/i);
    expect(CONTAB_OFICIAL.helpcenter.length).toBeGreaterThanOrEqual(10);
  });

  it("todas as aulas e-learning oficiais mapeiam para uma missão existente", () => {
    for (const a of [...CONTAB_OFICIAL.aulasElearning, ...CONTAB_OFICIAL.aulasEnterprise]) {
      expect(labById(a.missao), `aula "${a.t}" -> ${a.missao}`).toBeDefined();
    }
    expect(labById(CONTAB_OFICIAL.imobilizado.missao)).toBeDefined();
  });

  it("quiz do nível 9 tem pelo menos 12 perguntas", () => {
    const q = QUIZZES.find((x) => x.lv === 9);
    expect(q).toBeDefined();
    expect(q!.qs.length).toBeGreaterThanOrEqual(12);
  });

  it("nível 9 tem flashcards e o total é >=180", () => {
    expect(CARDS.filter((c) => c.lv === 9).length).toBeGreaterThanOrEqual(20);
    expect(CARDS.length).toBeGreaterThanOrEqual(180);
  });

  it("cada pergunta de quiz tem índice correto válido", () => {
    for (const q of QUIZZES) {
      for (const qq of q.qs) {
        expect(qq.a, q.nome).toBeGreaterThanOrEqual(0);
        expect(qq.a, q.nome).toBeLessThan(qq.o.length);
      }
    }
  });

  it("todas as missões têm teoria com conceito", () => {
    for (const lab of LABS) {
      const t = THEORY[lab.id];
      expect(t, `teoria de ${lab.id}`).toBeDefined();
      expect(typeof t.c).toBe("string");
      expect(t.c.length).toBeGreaterThan(0);
    }
  });
});

/* ---------- Trilha vertical do setor (Portas & Automatismos / PORTALUSA) ---------- */
describe("sector vertical (PORTALUSA)", () => {
  it("empresa tem perfil completo", () => {
    const e = SECTOR_PORTAS.empresa;
    expect(e.nome).toMatch(/PORTALUSA/);
    expect(e.produtosFamilias.length).toBeGreaterThanOrEqual(6);
    expect(e.departamentos.length).toBeGreaterThanOrEqual(5);
    expect(e.mercados.some((m) => m.tipo === "internacional")).toBe(true);
    expect(e.parceiro.nome.length).toBeGreaterThan(0);
  });

  it("ciclo completo cobre os módulos e referencia missões válidas", () => {
    const fases = SECTOR_PORTAS.ciclo.map((f) => f.fase);
    for (const esperado of [
      "CRM",
      "Vendas",
      "Compras",
      "Armazéns",
      "Produção",
      "Contabilidade",
      "Pessoal",
      "Suporte",
    ]) {
      expect(fases).toContain(esperado);
    }
    for (const f of SECTOR_PORTAS.ciclo) {
      for (const m of f.missoes) {
        expect(labById(m), `fase ${f.fase} -> missão ${m}`).toBeDefined();
      }
    }
  });

  it("há um caso do setor para cada nível (0..16)", () => {
    for (let lv = 0; lv < BELTS.length; lv++) {
      expect(sectorCaseForLevel(lv), `nível ${lv}`).toBeDefined();
    }
    expect(SECTOR_PORTAS.porNivel.length).toBe(BELTS.length);
  });

  it("glossário e catálogo de produtos não vazios", () => {
    expect(SECTOR_PORTAS.glossario.length).toBeGreaterThanOrEqual(10);
    expect(SECTOR_PORTAS.produtos.length).toBeGreaterThanOrEqual(10);
    for (const p of SECTOR_PORTAS.produtos) {
      expect(p.ref.length).toBeGreaterThan(0);
      expect(["fabrico", "revenda", "misto", "servico"]).toContain(p.origem);
    }
  });

  it("helpers: sectorPhasesForMission liga missões às fases", () => {
    const phases = sectorPhasesForMission("L99");
    expect(phases.some((f) => f.fase === "Produção")).toBe(true);
  });

  it("segmento 'portas' existe e os destaques são missões válidas", () => {
    const seg = SEGMENTS.find((s) => s.id === "portas");
    expect(seg).toBeDefined();
    expect(seg!.empresa.nome).toMatch(/PORTALUSA/);
    for (const d of seg!.plano.destaques) {
      expect(labById(d), `destaque ${d}`).toBeDefined();
    }
  });
});
