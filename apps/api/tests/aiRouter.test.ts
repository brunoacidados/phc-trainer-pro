import { afterEach, describe, expect, it, vi } from "vitest";
import { __test, routeChat } from "../src/services/aiRouter.ts";
import { defaultOrder } from "../src/services/providers.ts";

const KEYS = {
  groq: "gsk_teste",
  gemini: "gm_teste",
  nvidia: "nvapi_teste",
  mistral: "ms_teste",
};

function mockJsonResponse(body: unknown, status = 200) {
  return vi.fn(
    async () =>
      ({
        ok: status < 400,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
      }) as unknown as globalThis.Response,
  );
}

afterEach(() => {
  __test.cooldowns.clear();
  vi.unstubAllGlobals();
});

describe("routeChat", () => {
  const msgs = [{ role: "user", content: "diga OK" }];

  it("usa o 1º fornecedor saudável com chave", async () => {
    vi.stubGlobal(
      "fetch",
      mockJsonResponse({ choices: [{ message: { content: "OK via groq" } }] }),
    );
    const r = await routeChat({ scope: "team:t1", keys: KEYS, messages: msgs });
    expect(r.provider).toBe("groq");
    expect(r.text).toBe("OK via groq");
  });

  it("402 põe em pausa (3h) e salta para o seguinte", async () => {
    const responses = [
      { ok: false, status: 402, json: async () => ({}), text: async () => "payment required" },
      {
        ok: true,
        status: 200,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "OK via gemini" }] } }] }),
        text: async () => "",
      },
    ];
    let i = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => responses[Math.min(i++, 1)] as unknown as globalThis.Response),
    );
    const r = await routeChat({ scope: "team:t2", keys: KEYS, messages: msgs });
    expect(r.provider).toBe("gemini");
    expect(__test.isHealthy("team:t2", "groq")).toBe(false);
  });

  it("sem chaves (e fallback a falhar) → 502 com diagnóstico", async () => {
    // força TODOS os endpoints (incl. o fallback Bynara) a falhar p/ isolar o caso "sem chaves"
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}), text: async () => "bad gateway" }) as unknown as globalThis.Response),
    );
    await expect(routeChat({ scope: "team:t3", keys: {}, messages: msgs })).rejects.toMatchObject({
      status: 502,
    });
  });

  it("modo código prioriza mistral/nvidia", async () => {
    vi.stubGlobal(
      "fetch",
      mockJsonResponse({ choices: [{ message: { content: "select top 10 * from ft" } }] }),
    );
    const r = await routeChat({ scope: "team:t4", keys: KEYS, messages: msgs, code: true });
    expect(["mistral", "nvidia"]).toContain(r.provider);
  });

  it("ordem por omissão começa nos rápidos", () => {
    expect(defaultOrder()[0]).toBe("groq");
    expect(defaultOrder()).toContain("nvidia");
  });
});

describe("testOneProvider", () => {
  it("sem chave → status 'sem-chave' (sem chamar rede)", async () => {
    const { testOneProvider } = await import("../src/services/aiRouter.ts");
    const r = await testOneProvider("groq", {});
    expect(r.status).toBe("sem-chave");
    expect(r.ok).toBe(false);
  });

  it("chave + resposta OK → ok com latência", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({ choices: [{ message: { content: "OK" } }] }),
            text: async () => "",
          }) as unknown as globalThis.Response,
      ),
    );
    const { testOneProvider } = await import("../src/services/aiRouter.ts");
    const r = await testOneProvider("groq", { groq: "gsk_x" });
    expect(r.ok).toBe(true);
    expect(r.status).toBe("ok");
    expect(typeof r.ms).toBe("number");
  });

  it("chave inválida → status 'erro' com httpStatus", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 401,
            json: async () => ({}),
            text: async () => "invalid api key",
          }) as unknown as globalThis.Response,
      ),
    );
    const { testOneProvider } = await import("../src/services/aiRouter.ts");
    const r = await testOneProvider("groq", { groq: "gsk_errada" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe("erro");
    expect(r.httpStatus).toBe(401);
  });
});

describe("ordem e fallback", () => {
  it("bynara é sempre o último da ordem", async () => {
    const { defaultOrder } = await import("../src/services/providers.ts");
    const o = defaultOrder();
    expect(o[o.length - 1]).toBe("bynara");
  });
  it("code prefere mistral/nvidia/openrouter no início", async () => {
    const { routeChat } = await import("../src/services/aiRouter.ts");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "code" } }] }), text: async () => "" }) as unknown as globalThis.Response),
    );
    const r = await routeChat({ scope: "t", keys: { mistral: "m", groq: "g" }, messages: [{ role: "user", content: "sql" }], code: true });
    expect(["mistral", "nvidia", "openrouter"]).toContain(r.provider);
  });
});
