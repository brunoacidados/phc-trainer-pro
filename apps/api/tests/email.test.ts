import { describe, expect, it } from "vitest";
import { sendEmail, emailConfigWarning, buttonHtml, emailProvider } from "../src/services/email.ts";

describe("email service", () => {
  it("sem transportador → sent:false (não lança)", async () => {
    const r = await sendEmail("x@y.z", "assunto", "<p>olá</p>", "tok123");
    expect(r.sent).toBe(false);
    expect(r.devToken).toBe("tok123");
  });
  it("configWarning deteta APP_URL local", () => {
    const w = emailConfigWarning();
    // em test, APP_URL default é localhost → deve avisar
    expect(w).toBeTruthy();
  });
  it("provider none sem credenciais", () => {
    expect(emailProvider()).toBe("none");
  });
  it("buttonHtml gera âncora com href", () => {
    expect(buttonHtml("https://x/y", "Clica")).toContain('href="https://x/y"');
  });
});
