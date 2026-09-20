import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IAuditLog {
  actorId: Types.ObjectId | null;
  actorEmail: string;
  action: string;
  targetId: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}
export type AuditLogDoc = HydratedDocument<IAuditLog>;

const schema = new Schema<IAuditLog, Model<IAuditLog>>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    targetId: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog, Model<IAuditLog>>("AuditLog", schema);

export async function logAudit(
  actor: { sub: string; email?: string } | null,
  action: string,
  targetId = "",
  meta: Record<string, unknown> = {},
) {
  try {
    await AuditLog.create({
      actorId: actor?.sub ?? null,
      actorEmail: actor?.email ?? "",
      action,
      targetId,
      meta,
    });
  } catch {
    /* nunca bloqueia a operação */
  }
}
