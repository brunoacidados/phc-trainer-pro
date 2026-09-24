import { describe, expect, it } from "vitest";
import { CARDS, CODE_EXAMPLES, LABS, QUIZZES, cardKey, labById, theoryFor } from "@/content";
import { addDays, diffDays, relativeDay, todayISO } from "../dates";

describe("integridade do conteúdo", () => {
  it("todas as missões têm teoria, passos e provas", () => {
    for (const l of LABS) {
      expect(theoryFor(l.id), l.id).toBeTruthy();
      expect(l.steps.length, l.id).toBeGreaterThan(0);
    }
  });
  it("sem passos duplicados (errata E1)", () => {
    for (const l of LABS) expect(new Set(l.steps).size, l.id).toBe(l.steps.length);
  });
  it("pré-requisitos apontam para missões existentes", () => {
    for (const l of LABS) for (const p of l.pre) expect(labById(p), `${l.id} → ${p}`).toBeTruthy();
  });
  it("respostas dos testes são índices válidos", () => {
    for (const q of QUIZZES) for (const qq of q.qs) expect(qq.a).toBeLessThan(qq.o.length);
  });
  it("chaves de cartas são únicas (progresso não colide)", () => {
    const keys = CARDS.map(cardKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("exemplos de código referem missões existentes e têm fontes", () => {
    for (const e of CODE_EXAMPLES) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const m of e.missions) expect(labById(m), `${e.id} → ${m}`).toBeTruthy();
    }
  });
  it("errata E2: apuramento de IVA com contas SNC corretas", () => {
    const t = JSON.stringify(theoryFor("L62"));
    expect(t).not.toContain("a pagar (2432>2433)");
    expect(t).toContain("liquidado (2433)");
  });
  it("errata E3: datas legais de QR/ATCUD", () => {
    expect(theoryFor("L34")!.c).toContain("1 jan 2023");
  });
});

describe("datas", () => {
  it("addDays atravessa meses e mudança de hora", () => {
    expect(addDays("2025-03-29", 2)).toBe("2025-03-31");
    expect(addDays("2025-01-31", 1)).toBe("2025-02-01");
  });
  it("todayISO respeita o fuso (00:30 em Lisboa no verão = 23:30 UTC do dia anterior)", () => {
    const d = new Date("2025-07-14T23:30:00Z");
    expect(todayISO("Europe/Lisbon", d)).toBe("2025-07-15");
    expect(todayISO("UTC", d)).toBe("2025-07-14");
  });
  it("relativeDay em linguagem simples", () => {
    expect(relativeDay("2025-03-10", "2025-03-10")).toBe("hoje");
    expect(relativeDay("2025-03-11", "2025-03-10")).toBe("amanhã");
    expect(relativeDay("2025-03-15", "2025-03-10")).toBe("em 5 dias");
    expect(diffDays("2025-03-10", "2025-03-01")).toBe(-9);
  });
});
