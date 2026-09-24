import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Perfis de aluno. Identificação simples por cookie (código de recuperação = id).
 * Para produção multi-equipa, trocar por autenticação real (ver docs/DOSSIE-MELHORIAS.md).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** meta diária de micro-ações (predefinição 3 — pequena de propósito) */
  dailyGoal: integer("daily_goal").notNull().default(3),
  /** modo livre: todos os níveis abertos */
  freeMode: boolean("free_mode").notNull().default(false),
  timeZone: text("time_zone").notNull().default("Europe/Lisbon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missionProgress = pgTable(
  "mission_progress",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    missionId: text("mission_id").notNull(),
    steps: jsonb("steps").$type<number[]>().notNull().default([]),
    proofs: jsonb("proofs").$type<number[]>().notNull().default([]),
    notes: text("notes").notNull().default(""),
    box: integer("box").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    /** próxima revisão AAAA-MM-DD */
    due: text("due"),
    mastered: boolean("mastered").notNull().default(false),
    lastRep: text("last_rep"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.missionId] })],
);

export const cardProgress = pgTable(
  "card_progress",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** chave estável (hash da frente) — não o índice no array */
    cardKey: text("card_key").notNull(),
    box: integer("box").notNull().default(0),
    due: text("due").notNull(),
    lapses: integer("lapses").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.cardKey] })],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    correct: integer("correct").notNull(),
    total: integer("total").notNull(),
    pct: integer("pct").notNull(),
    passed: boolean("passed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quiz_attempts_profile_idx").on(t.profileId, t.level)],
);

/** Registo de micro-ações (passo, prova, repetição, carta, teste) — alimenta a meta diária. */
export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    kind: text("kind").notNull(),
    ref: text("ref").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_profile_day_idx").on(t.profileId, t.day)],
);

export type Profile = typeof profiles.$inferSelect;
