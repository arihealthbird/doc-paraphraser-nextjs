import { pgTable, text, timestamp, integer, jsonb, serial } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  documentId: text('document_id').notNull().unique(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paraphraseJobs = pgTable('paraphrase_jobs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull().unique(),
  documentId: text('document_id').notNull(),
  status: text('status').notNull(), // pending, processing, completed, failed
  progress: integer('progress').default(0).notNull(),
  currentChunk: integer('current_chunk').default(0).notNull(),
  totalChunks: integer('total_chunks').default(0).notNull(),
  config: jsonb('config').notNull(), // paraphrase config
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paraphraseResults = pgTable('paraphrase_results', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull().unique(),
  result: text('result').notNull(),
  hallucinationScore: integer('hallucination_score'), // 0-100, higher = more hallucination
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
