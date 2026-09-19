import { Router } from "express";
import { User } from "../models/User.ts";
import { Team } from "../models/Team.ts";
import { getOrCreateProgress } from "../models/Progress.ts";
import { Assignment } from "../models/Assignment.ts";
import { requireUser } from "../middleware/auth.ts";
import { addDays, dueCardsN, dueLabs, todayISO, type ProgressState } from "@phc/shared";

export interface Notification {
  id: string;
  kind: "review" | "cards" | "assignment" | "member" | "team";
  severity: "info" | "warn" | "alert";
  text: string;
  href: string;
}

export const notificationsRouter = Router();
notificationsRouter.use(requireUser);

/** GET /api/notifications — derivadas (sem storage): revisões, cartas, prazos, membros parados */
notificationsRouter.get("/", async (req, res) => {
  const uid = req.auth!.sub;
  const progress = await getOrCreateProgress(uid);
  const state: ProgressState = progress.state;
  const today = todayISO();
  const out: Notification[] = [];

  // pessoais
  const due = dueLabs(state, today);
  if (due.length) out.push({ id: "rev", kind: "review", severity: "warn", text: `${due.length} missão(ões) com revisão vencida (${due.slice(0, 4).join(", ")}${due.length > 4 ? "…" : ""})`, href: "/" });
  const cards = dueCardsN(state, today);
  if (cards > 0) out.push({ id: "cards", kind: "cards", severity: "info", text: `${cards} carta(s) para rever hoje`, href: "/praticar?tab=cartas" });

  // atribuições do utilizador (prazo <=3 dias ou vencidas, incompletas)
  const me = await User.findById(uid);
  if (me?.teamId) {
    const soon = addDays(today, 3);
    const all = await Assignment.find({ teamId: me.teamId });
    for (const a of all) {
      const mine = a.memberIds.length === 0 || a.memberIds.some((m) => String(m) === uid);
      if (!mine) continue;
      const done = a.labIds.filter((lid) => (state.labs[lid]?.c ?? 0) > 0 || state.labs[lid]?.mem).length;
      if (done >= a.labIds.length) continue;
      if (a.dueDate <= soon) {
        const overdue = a.dueDate < today;
        out.push({ id: `asg-${a.id}`, kind: "assignment", severity: overdue ? "alert" : "warn", text: `${overdue ? "VENCIDA: " : "Prazo ${a.dueDate}: "}${a.title} (${done}/${a.labIds.length})`.replace("${a.dueDate}", a.dueDate), href: "/" });
      }
    }

    // formador/dono: membros parados há >7 dias
    if (me.role === "trainer" || me.role === "admin") {
      const cutoff = new Date(Date.now() - 7 * 86400_000);
      const members = await User.find({ teamId: me.teamId, _id: { $ne: uid } });
      const stalled = members.filter((m) => !m.lastActiveAt || m.lastActiveAt < cutoff);
      if (stalled.length) out.push({ id: "stalled", kind: "member", severity: "warn", text: `${stalled.length} membro(s) sem atividade há +7 dias (${stalled.slice(0, 3).map((s) => s.name).join(", ")}${stalled.length > 3 ? "…" : ""})`, href: "/equipa" });
    }
  }

  res.json({ notifications: out });
});
