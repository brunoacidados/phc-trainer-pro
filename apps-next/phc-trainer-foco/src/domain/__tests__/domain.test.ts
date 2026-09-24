import { describe, expect, it } from "vitest";
import { addDays, diffDays, relativeDay, todayISO } from "../dates";
import { LADDER, NEW_CARD, intervalForBox, isCardDue, registerRep, reviewCard } from "../srs";
import {
  EMPTY_MISSION,
  activeDaysInLastWeek,
  canMarkMastered,
  levelsCompleted,
  masteryBlockers,
  missionCompletion,
  missionStatus,
  nextAction,
  overallPct,
  scoreQuiz,
  type MissionLike,
  type ProgressSnapshot,
} from "../progression";

const T = "2025-03-10";

describe("dates", () => {
  it("usa o dia civil de Lisboa, não o do servidor (bug A6)", () => {
    // 23:30 UTC de 30 jun = 00:30 de 1 jul em Lisboa (WEST, UTC+1)
    expect(todayISO(new Date("2025-06-30T23:30:00Z"))).toBe("2025-07-01");
    // no inverno Lisboa = UTC
    expect(todayISO(new Date("2025-01-15T23:30:00Z"))).toBe("2025-01-15");
  });
  it("soma dias atravessando a mudança de hora sem saltar", () => {
    expect(addDays("2025-03-29", 1)).toBe("2025-03-30");
    expect(addDays("2025-03-30", 1)).toBe("2025-03-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });
  it("diffDays e relativeDay", () => {
    expect(diffDays("2025-03-10", "2025-03-13")).toBe(3);
    expect(relativeDay("2025-03-11", T)).toBe("amanhã");
    expect(relativeDay("2025-03-08", T)).toBe("há 2 dias");
  });
});

describe("srs — cartas", () => {
  it("escada crescente", () => {
    expect([1, 2, 3, 7, 8, 99].map(intervalForBox)).toEqual([1, 2, 4, 60, 60, 60]);
    expect(LADDER).toEqual([1, 2, 4, 7, 14, 30, 60]);
  });
  it("sabia → sobe uma caixa e agenda o intervalo correspondente", () => {
    const s1 = reviewCard(NEW_CARD, 2, T);
    expect(s1).toMatchObject({ box: 1, due: "2025-03-11", reviews: 1 });
    const s2 = reviewCard(s1, 2, "2025-03-11");
    expect(s2).toMatchObject({ box: 2, due: "2025-03-13" });
  });
  it("lapso volta à caixa 0 (bug B3 — o original mantinha o contador)", () => {
    let s = NEW_CARD;
    for (let i = 0; i < 4; i++) s = reviewCard(s, 2, T);
    expect(s.box).toBe(4);
    s = reviewCard(s, 0, T);
    expect(s).toMatchObject({ box: 0, due: "2025-03-11", lapses: 1 });
    // a resposta certa seguinte NÃO salta para o intervalo longo
    expect(reviewCard(s, 2, "2025-03-11").due).toBe("2025-03-12");
  });
  it("com esforço mantém a caixa e repete o intervalo", () => {
    const s = { box: 3, due: T, lapses: 0, reviews: 3 };
    expect(reviewCard(s, 1, T)).toMatchObject({ box: 3, due: addDays(T, 4) });
  });
  it("cartas novas não contam como vencidas", () => {
    expect(isCardDue(undefined, T)).toBe(false);
    expect(isCardDue({ ...NEW_CARD, due: T }, T)).toBe(true);
    expect(isCardDue({ ...NEW_CARD, due: "2025-03-11" }, T)).toBe(false);
  });
});

describe("srs — repetições de missão (bug B7)", () => {
  it("primeira repetição avança sempre", () => {
    const r = registerRep({ reps: 0, due: null }, T);
    expect(r.advanced).toBe(true);
    expect(r.state).toEqual({ reps: 1, due: "2025-03-11" });
  });
  it("repetir no mesmo dia NÃO avança a escada", () => {
    const first = registerRep({ reps: 0, due: null }, T).state;
    const again = registerRep(first, T);
    expect(again.advanced).toBe(false);
    expect(again.state).toEqual(first);
    if (!again.advanced) expect(again.nextCounts).toBe("2025-03-11");
  });
  it("repetição vencida avança", () => {
    const r = registerRep({ reps: 1, due: "2025-03-11" }, "2025-03-12");
    expect(r).toMatchObject({ advanced: true, state: { reps: 2, due: "2025-03-14" } });
  });
});

const M = (id: string, level: number, steps = 2, proofs = 1): MissionLike => ({
  id,
  level,
  title: id,
  steps: Array(steps).fill(0),
  proofs: Array(proofs).fill(0),
});
const snap = (p: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  missions: {},
  cards: {},
  quizzesPassed: new Set(),
  ...p,
});

describe("progressão", () => {
  const m = M("L01", 0);
  it("domínio exige provas e 2 repetições (bug B4)", () => {
    expect(canMarkMastered(m, undefined)).toBe(false);
    expect(masteryBlockers(m, { ...EMPTY_MISSION, reps: 2 })).toHaveLength(1);
    expect(canMarkMastered(m, { ...EMPTY_MISSION, proofs: [0], reps: 1 })).toBe(false);
    expect(canMarkMastered(m, { ...EMPTY_MISSION, proofs: [0], reps: 2 })).toBe(true);
  });
  it("estado da missão", () => {
    expect(missionStatus(undefined, T)).toBe("nova");
    expect(missionStatus({ ...EMPTY_MISSION, steps: [0] }, T)).toBe("em-curso");
    expect(missionStatus({ ...EMPTY_MISSION, reps: 1, due: T }, T)).toBe("a-rever");
    expect(missionStatus({ ...EMPTY_MISSION, reps: 1, due: "2025-03-20" }, T)).toBe("em-curso");
    expect(missionStatus({ ...EMPTY_MISSION, mastered: true }, T)).toBe("dominada");
  });
  it("conclusão parcial dá micro-progresso", () => {
    expect(missionCompletion(m, { ...EMPTY_MISSION, steps: [0] })).toBeCloseTo(1 / 3);
  });
  it("overallPct devolve percentagem real (bug B1 — original devolvia 0 ou 1)", () => {
    const s = snap({ missions: { L01: { ...EMPTY_MISSION, mastered: true } } });
    expect(overallPct(s, { missions: 2, quizzes: 1, cards: 1 })).toBe(35);
    const full = snap({
      missions: { a: { ...EMPTY_MISSION, mastered: true } },
      quizzesPassed: new Set([0]),
      cards: { c: { box: 5, due: T, lapses: 0, reviews: 5 } },
    });
    expect(overallPct(full, { missions: 1, quizzes: 1, cards: 1 })).toBe(100);
  });
  it("níveis concluídos sem teto em 12 (bug B2)", () => {
    const missions = Array.from({ length: 17 }, (_, i) => M(`L${i}`, i));
    const s = snap({
      missions: Object.fromEntries(missions.map((x) => [x.id, { ...EMPTY_MISSION, mastered: true }])),
      quizzesPassed: new Set(Array.from({ length: 17 }, (_, i) => i)),
    });
    expect(levelsCompleted(17, missions, s)).toBe(17);
  });
  it("próxima ação segue a prioridade: continuar > cartas > repetir > nova", () => {
    const ms = [M("A", 0), M("B", 0), M("C", 0)];
    expect(nextAction(ms, snap(), 0, T)).toMatchObject({ kind: "nova-missao", missionId: "A" });
    expect(nextAction(ms, snap(), 4, T)).toMatchObject({ kind: "rever-cartas", count: 4 });
    expect(nextAction(ms, snap(), 40, T)).toMatchObject({ kind: "rever-cartas", count: 10 });
    const withDue = snap({ missions: { B: { ...EMPTY_MISSION, reps: 1, due: T } } });
    expect(nextAction(ms, withDue, 0, T)).toMatchObject({ kind: "repetir-missao", missionId: "B" });
    const started = snap({ missions: { C: { ...EMPTY_MISSION, steps: [0] }, B: { ...EMPTY_MISSION, reps: 1, due: T } } });
    expect(nextAction(ms, started, 9, T)).toMatchObject({ kind: "continuar-missao", missionId: "C" });
    const all = snap({ missions: Object.fromEntries(ms.map((x) => [x.id, { ...EMPTY_MISSION, mastered: true }])) });
    expect(nextAction(ms, all, 0, T).kind).toBe("tudo-feito");
  });
  it("dias ativos na semana (substitui streak punitivo)", () => {
    expect(activeDaysInLastWeek(["2025-03-10", "2025-03-10", "2025-03-04", "2025-03-03"], T, addDays)).toBe(2);
  });
  it("testes pontuados no servidor (bug B6)", () => {
    expect(scoreQuiz([0, 1, 2, 3, 0], [0, 1, 2, 3, 1])).toEqual({ correct: 4, total: 5, pct: 80, passed: true });
    expect(scoreQuiz([0, 1, 2], [0])).toMatchObject({ correct: 1, passed: false });
    expect(scoreQuiz([], []).passed).toBe(false);
  });
});
