import { Schema, model, type HydratedDocument, type Model } from "mongoose";

export interface IChunk {
  /** origem: encyclopedia | glossary | schema | mission | guide | circuit */
  source: string;
  /** identificador dentro da origem (ex.: nome da função, id da missão) */
  refId: string;
  title: string;
  text: string;
  /** vetor de embedding (normalizado) */
  vector: number[];
  dims: number;
  /** modelo de embedding usado */
  model: string;
}

export type ChunkDoc = HydratedDocument<IChunk>;

const chunkSchema = new Schema<IChunk, Model<IChunk>>({
  source: { type: String, required: true, index: true },
  refId: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  vector: { type: [Number], required: true },
  dims: { type: Number, required: true },
  model: { type: String, default: "" },
});

// índice único por (source, refId) para upserts idempotentes no seed
chunkSchema.index({ source: 1, refId: 1 }, { unique: true });

export const Chunk = model<IChunk, Model<IChunk>>("Chunk", chunkSchema);
