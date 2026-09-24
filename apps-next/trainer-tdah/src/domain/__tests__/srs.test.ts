import { describe, expect, it } from "vitest";
import { CARD_MASTERY_BOX, canMarkMastered, intervalForBox, isCardMastered, newReviewState, pickSession, review } from "../srs";

const T = "2025-03-10";

describe("review() — Leitner com escada [1,2,4,7,14,30,60]", () => {
  it("carta nova + Fácil → 1 dia, caixa 1", () => {
    const s = review(newReviewState(T), 2, T);
    expect(s).toMatchObject({ box: 1, due: "2025-03-11", reviews: 1, lapses: 0 });
  });

  it("sobe a escada com respostas fáceis consecutivas", () => {
    let s = newReviewState(T);
    const dues: string[] = [];
    for (let i = 0; i < 4; i++) {
      s = review(s, 2, T);
      dues.push(s.due);
    }
    expect(dues).toEqual(["2025-03-11", "2025-03-12", "2025-03-14", "2025-03-17"]);
  });

  it("CORREÇÃO: Errei reinicia a caixa e volta hoje (no original mantinha o contador)", () => {
    let s = newReviewState(T);
    for (let i = 0; i < 4; i++) s = review(s, 2, T);
    const lapsed = review(s, 0, T);
    expect(lapsed).toMatchObject({ box: 0, due: T, lapses: 1 });
    // a seguir a um lapso, a próxima resposta certa volta ao intervalo de 1 dia
    expect(review(lapsed, 2, T).due).toBe("2025-03-11");
  });

  it("Com esforço mantém a caixa e usa metade do intervalo (mín. 1 dia)", () => {
    const s = { box: 4, due: T, lapses: 0, reviews: 4 };
    expect(review(s, 1, T)).toMatchObject({ box: 4, due: "2025-03-17" }); // 14/2 = 7
    expect(review({ ...s, box: 0 }, 1, T).due).toBe("2025-03-11");
  });

  it("não ultrapassa o último degrau", () => {
    expect(intervalForBox(99)).toBe(60);
    expect(intervalForBox(-3)).toBe(1);
  });

  it("dominada a partir da caixa 5", () => {
    expect(isCardMastered({ box: CARD_MASTERY_BOX - 1 })).toBe(false);
    expect(isCardMastered({ box: CARD_MASTERY_BOX })).toBe(true);
  });

  it("é pura: não altera o estado recebido", () => {
    const s = Object.freeze(newReviewState(T));
    expect(() => review(s, 2, T)).not.toThrow();
  });
});

describe("canMarkMastered() — domínio exige evidência", () => {
  it("recusa sem todas as provas", () => {
    expect(canMarkMastered({ proofsDone: 1, proofsTotal: 3, box: 4 })).toBe(false);
  });
  it("recusa sem repetições suficientes", () => {
    expect(canMarkMastered({ proofsDone: 3, proofsTotal: 3, box: 1 })).toBe(false);
  });
  it("aceita com provas completas e ≥2 repetições bem-sucedidas", () => {
    expect(canMarkMastered({ proofsDone: 3, proofsTotal: 3, box: 2 })).toBe(true);
  });
});

describe("pickSession()", () => {
  const keys = ["a", "b", "c", "d", "e", "f", "g"];
  it("vencidas primeiro (mais atrasadas antes), depois novas até ao limite", () => {
    const states = {
      a: { box: 1, due: "2025-03-09", lapses: 0, reviews: 1 },
      b: { box: 1, due: "2025-03-01", lapses: 0, reviews: 1 },
      c: { box: 2, due: "2025-04-01", lapses: 0, reviews: 2 }, // futura
      d: { box: 5, due: "2025-03-01", lapses: 0, reviews: 5 }, // dominada
    };
    expect(pickSession(keys, states, T, { size: 10, maxNew: 2 })).toEqual(["b", "a", "e", "f"]);
  });
  it("respeita o tamanho máximo da sessão", () => {
    expect(pickSession(keys, {}, T, { size: 3, maxNew: 10 })).toHaveLength(3);
  });
});
