import { describe, expect, it } from "vitest";
import { BELTS, CARDS, LABS, QUIZZES, labsOfLevel } from "@/content";
import {
  type Snapshot,
  applyMissionRep,
  currentBelt,
  emptyMission,
  levelStatus,
  missionAccessible,
  nextAction,
  overallPct,
  scoreQuiz,
} from "../progression";

const T = "2025-03-10";
function snap(p: Partial<Snapshot> = {}): Snapshot {
  return { missions: {}, cardsDue: 0, cardsNew: CARDS.length, cardsMastered: 0, quizzes: {}, freeMode: false, today: T, ...p };
}
const practiced = (reps = 1) => ({ ...emptyMission(), reps, box: reps, due: "2025-03-20", lastRep: T });

describe("overallPct()", () => {
  it("CORREÇÃO: devolve 0–100 (o original devolvia 0 ou 1)", () => {
    const missions = Object.fromEntries(LABS.map((l) => [l.id, { ...practiced(5), mastered: true }]));
    const quizzes = Object.fromEntries(QUIZZES.map((q) => [q.lv, { best: 100, passed: true, tries: 1 }]));
    expect(overallPct(snap({ missions, quizzes, cardsMastered: CARDS.length }), CARDS.length)).toBe(100);
    expect(overallPct(snap(), CARDS.length)).toBe(0);
  });
  it("metade das missões dominadas ≈ 35%", () => {
    const half = LABS.slice(0, LABS.length / 2);
    const missions = Object.fromEntries(half.map((l) => [l.id, { ...practiced(5), mastered: true }]));
    expect(overallPct(snap({ missions }), CARDS.length)).toBe(35);
  });
});

describe("currentBelt()", () => {
  it("começa no nível 0", () => expect(currentBelt(snap())).toBe(0));
  it("CORREÇÃO: não tem teto 12 — pode chegar ao último nível", () => {
    const missions = Object.fromEntries(LABS.map((l) => [l.id, { ...practiced(5), mastered: true }]));
    const quizzes = Object.fromEntries(BELTS.map((b) => [b.n, { best: 100, passed: true, tries: 1 }]));
    expect(currentBelt(snap({ missions, quizzes }))).toBe(BELTS.length - 1);
    expect(BELTS.length - 1).toBeGreaterThan(12);
  });
});

describe("abertura de níveis", () => {
  it("nível 1 fechado até praticar metade do nível 0", () => {
    const l0 = labsOfLevel(0);
    const need = Math.ceil(l0.length / 2);
    const some = Object.fromEntries(l0.slice(0, need - 1).map((l) => [l.id, practiced()]));
    expect(levelStatus(snap({ missions: some }), 1)).toMatchObject({ open: false, missingToOpen: 1 });
    const enough = Object.fromEntries(l0.slice(0, need).map((l) => [l.id, practiced()]));
    expect(levelStatus(snap({ missions: enough }), 1).open).toBe(true);
  });
  it("modo livre abre tudo", () => {
    expect(missionAccessible(snap({ freeMode: true }), LABS[LABS.length - 1].id)).toBe(true);
  });
});

describe("nextAction()", () => {
  it("sem progresso → primeira missão", () => {
    expect(nextAction(snap())).toEqual({ kind: "mission", missionId: LABS[0].id });
  });
  it("missão começada tem prioridade (acabar o que se começou)", () => {
    const missions = { L02: { ...emptyMission(), steps: [0] } };
    expect(nextAction(snap({ missions, cardsDue: 5 }))).toEqual({ kind: "resume", missionId: "L02" });
  });
  it("revisão vencida antes de cartas", () => {
    const missions = { L00: { ...practiced(), due: T } };
    expect(nextAction(snap({ missions, cardsDue: 3 }))).toMatchObject({ kind: "review-mission", missionId: "L00" });
  });
  it("cartas vencidas antes de missão nova", () => {
    expect(nextAction(snap({ cardsDue: 4 }))).toEqual({ kind: "cards", count: 4 });
  });
});

describe("applyMissionRep()", () => {
  it("precisei de ajuda → volta amanhã, caixa 0", () => {
    const r = applyMissionRep({ ...practiced(3) }, 0, T);
    expect(r).toMatchObject({ box: 0, due: "2025-03-11", reps: 4 });
  });
  it("5 repetições fáceis → dominada automaticamente", () => {
    let m = emptyMission();
    for (let i = 0; i < 5; i++) m = applyMissionRep(m, 2, T);
    expect(m.mastered).toBe(true);
  });
});

describe("scoreQuiz()", () => {
  it("calcula no servidor e aprova com 80%", () => {
    expect(scoreQuiz([0, 1, 2, 3, 0], [0, 1, 2, 3, 1])).toEqual({ correct: 4, total: 5, pct: 80, passed: true });
    expect(scoreQuiz([0, 1], [1, 1]).passed).toBe(false);
  });
});
