import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IAssignment {
  teamId: Types.ObjectId;
  title: string;
  /** missões atribuídas (ids L##) */
  labIds: string[];
  /** prazo (ISO date) */
  dueDate: string;
  /** membros alvo; vazio = toda a equipa */
  memberIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
}
export type AssignmentDoc = HydratedDocument<IAssignment>;

const schema = new Schema<IAssignment, Model<IAssignment>>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    labIds: { type: [String], required: true },
    dueDate: { type: String, required: true },
    memberIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Assignment = model<IAssignment, Model<IAssignment>>("Assignment", schema);
