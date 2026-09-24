/**
 * Esquema normalizado. Diferença-chave face ao original (MongoDB, um documento
 * `ProgressState` inteiro reescrito a cada ação): aqui cada missão/carta é uma linha,
 * atualizada atomicamente → sem "último a escrever ganha" entre dispositivos,
 * e consultas como "quantas cartas vencidas" são um COUNT, não carregar tudo.
 */
import { boolean, date, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const missionProgress = pgTable(
  "mission_progress",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    missionId: text("mission_id").notNull(),
    steps: jsonb("steps").$type<number[]>().notNull().default([]),
    proofs: jsonb("proofs").$type<number[]>().notNull().default([]),
    reps: integer("reps").notNull().default(0),
    due: date("due", { mode: "string" }),
    mastered: boolean("mastered").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.missionId] })],
);

export const cardProgress = pgTable(
  "card_progress",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    box: integer("box").notNull().default(0),
    due: date("due", { mode: "string" }),
    lapses: integer("lapses").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.cardId] }), index("card_due_idx").on(t.learnerId, t.due)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    correct: integer("correct").notNull(),
    total: integer("total").notNull(),
    pct: integer("pct").notNull(),
    passed: boolean("passed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("quiz_learner_idx").on(t.learnerId, t.level)],
);

/** micro-ações do dia (passo, prova, carta, repetição, teste, exemplo) — alimenta meta diária e "dias ativos" */
export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    kind: text("kind").notNull(),
    ref: text("ref").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_learner_day_idx").on(t.learnerId, t.day)],
);
