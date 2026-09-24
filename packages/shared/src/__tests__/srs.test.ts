import { describe, expect, it } from "vitest";
import { LABS } from "@phc/content";
import {
  overallPct,
  LADDER,
  addDays,
  bumpDaily,
  currentBelt,
  currentMission,
  defaultProgress,
  dueLabs,
  hashStr,
  levelOpen,
  missionUnlocked,
  rateCard,
  registerLabRep,
  submitQuiz,
  todayISO,
  touchStreak,
  xpTotal,
} from "../index.ts";

describe("datas", () => {
  it("addDays cruza meses/anos", () => {
    expect(addDays("2026-01-30", 2)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("todayISO tem formato yyyy-mm-dd", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("hashStr é determinístico", () => {
    expect(hashStr("abc")).toBe(hashStr("abc"));
    expect(hashStr("abc")).not.toBe(hashStr("abd"));
  });
});

describe("SRS de missões", () => {
  it("escada 1→2→4→7→14→30→60", () => {
    expect(LADDER).toEqual([1, 2, 4, 7, 14, 30, 60]);
  });

  it("registerLabRep agenda pela escada e regista histórico/streak/diário", () => {
    const s = defaultProgress();
    const t = "2026-09-01";
    registerLabRep(s, "L00", t);
    expect(s.labs["L00"].c).toBe(1);
    expect(s.labs["L00"].due).toBe("2026-09-02"); // +1d
    expect(s.labs["L00"].hist).toEqual([t]);
    registerLabRep(s, "L00", t);
    expect(s.labs["L00"].due).toBe("2026-09-03"); // +2d
    registerLabRep(s, "L00", t);
    expect(s.labs["L00"].due).toBe("2026-09-05"); // +4d
    expect(s.streak.n).toBe(1);
    expect(s.daily.reps).toBe(3);
  });

  it("dueLabs lista revisões vencidas e exclui dominadas", () => {
    const s = defaultProgress();
    registerLabRep(s, "L00", "2026-09-01");
    registerLabRep(s, "L01", "2026-09-01");
    expect(dueLabs(s, "2026-09-03").sort()).toEqual(["L00", "L01"]);
    s.labs["L00"].mem = true;
    expect(dueLabs(s, "2026-09-03")).toEqual(["L01"]);
  });

  it("streak conta dias consecutivos e reinicia após falha", () => {
    const s = defaultProgress();
    touchStreak(s, "2026-09-01");
    touchStreak(s, "2026-09-02");
    touchStreak(s, "2026-09-03");
    expect(s.streak.n).toBe(3);
    touchStreak(s, "2026-09-06");
    expect(s.streak.n).toBe(1);
  });

  it("bumpDaily reinicia contadores no dia seguinte", () => {
    const s = defaultProgress();
    bumpDaily(s, "reps", "2026-09-01");
    bumpDaily(s, "reps", "2026-09-01");
    expect(s.daily.reps).toBe(2);
    bumpDaily(s, "cards", "2026-09-02");
    expect(s.daily).toMatchObject({ d: "2026-09-02", reps: 0, cards: 1 });
  });
});

describe("SRS de cartas e testes", () => {
  it("rateCard: errei=+1d, quase=+2d, sabia=sobe escada", () => {
    const s = defaultProgress();
    const t = "2026-09-01";
    rateCard(s, 0, 0, t);
    expect(s.cards["0"].due).toBe("2026-09-02");
    rateCard(s, 0, 1, t);
    expect(s.cards["0"].due).toBe("2026-09-03");
    rateCard(s, 0, 2, t);
    expect(s.cards["0"].c).toBe(1);
    expect(s.cards["0"].due).toBe("2026-09-02"); // +1d (1ª vez na escada)
  });

  it("FIX: lapso reinicia o contador da carta", () => {
    const s = defaultProgress();
    const t = "2026-09-01";
    for (let i = 0; i < 4; i++) rateCard(s, 0, 2, t);
    expect(s.cards["0"].c).toBe(4);
    rateCard(s, 0, 0, t);
    expect(s.cards["0"].c).toBe(0);
    rateCard(s, 0, 2, t);
    expect(s.cards["0"].due).toBe("2026-09-02");
  });

  it("FIX: overallPct devolve 0–100", () => {
    const s = defaultProgress();
    expect(overallPct(s)).toBe(0);
    for (const l of LABS) s.labs[l.id] = { c: 5, due: null, mem: true, steps: {}, proofs: {}, hist: [] };
    expect(overallPct(s)).toBe(70);
  });

  it("submitQuiz: aprovação ≥80 e 'passed' nunca volta atrás", () => {
    const s = defaultProgress();
    submitQuiz(s, 0, 70);
    expect(s.quiz["0"]).toMatchObject({ best: 70, passed: false, tries: 1 });
    submitQuiz(s, 0, 90);
    expect(s.quiz["0"]).toMatchObject({ best: 90, passed: true, tries: 2 });
    submitQuiz(s, 0, 50);
    expect(s.quiz["0"]).toMatchObject({ best: 90, passed: true, tries: 3 });
  });
});

describe("progressão guiada", () => {
  it("nível 0 sempre aberto; nível 1 exige 50% do nível 0", () => {
    const s = defaultProgress();
    expect(levelOpen(s, 0)).toBe(true);
    expect(levelOpen(s, 1)).toBe(false);
    // nível 0 tem 6 missões → 3 concluídas abrem o nível 1
    registerLabRep(s, "L00", "2026-09-01");
    registerLabRep(s, "L01", "2026-09-01");
    expect(levelOpen(s, 1)).toBe(false);
    registerLabRep(s, "L02", "2026-09-01");
    expect(levelOpen(s, 1)).toBe(true);
  });

  it("missão seguinte só desbloqueia com a anterior iniciada", () => {
    const s = defaultProgress();
    expect(missionUnlocked(s, "L00")).toBe(true);
    expect(missionUnlocked(s, "L01")).toBe(false);
    registerLabRep(s, "L00", "2026-09-01");
    expect(missionUnlocked(s, "L01")).toBe(true);
  });

  it("freeMode destranca tudo", () => {
    const s = defaultProgress();
    s.settings.freeMode = true;
    expect(missionUnlocked(s, "L89")).toBe(true);
  });

  it("currentMission aponta a próxima missão não iniciada", () => {
    const s = defaultProgress();
    expect(currentMission(s)).toBe("L00");
    registerLabRep(s, "L00", "2026-09-01");
    expect(currentMission(s)).toBe("L01");
  });

  it("cinto só sobe com todas as missões 🧠 + teste aprovado", () => {
    const s = defaultProgress();
    expect(currentBelt(s)).toBe(0);
  });

  it("xpTotal pondera reps, domínios, testes e cartas", () => {
    const s = defaultProgress();
    expect(xpTotal(s)).toBe(0);
    registerLabRep(s, "L00", "2026-09-01");
    expect(xpTotal(s)).toBe(10);
  });
});
