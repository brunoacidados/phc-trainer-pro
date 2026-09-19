import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
  labId?: string;
}

export interface IChatHistory {
  userId: Types.ObjectId;
  messages: IChatMsg[];
  updatedAt: Date;
}

export type ChatHistoryDoc = HydratedDocument<IChatHistory>;

const MAX_MSGS = 60;

const chatHistorySchema = new Schema<IChatHistory, Model<IChatHistory>>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    messages: {
      type: [
        {
          role: { type: String, enum: ["user", "assistant"], required: true },
          content: { type: String, required: true },
          ts: { type: Number, default: () => Date.now() },
          labId: { type: String },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const ChatHistory = model<IChatHistory, Model<IChatHistory>>(
  "ChatHistory",
  chatHistorySchema,
);

/** acrescenta uma mensagem (user/assistant) ao histórico do utilizador, limitado a MAX_MSGS */
export async function appendChat(userId: string, msg: Omit<IChatMsg, "ts">): Promise<void> {
  await ChatHistory.updateOne(
    { userId },
    {
      $push: { messages: { $each: [{ ...msg, ts: Date.now() }], $slice: -MAX_MSGS } },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );
}

export async function getChat(userId: string): Promise<IChatMsg[]> {
  const doc = await ChatHistory.findOne({ userId });
  return doc?.messages ?? [];
}
