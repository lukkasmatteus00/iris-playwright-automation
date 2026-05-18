import { z } from "zod";

export const createSessionResponseSchema = z
  .object({
    id: z.string(),
    subject_id: z.string(),
    chamber_id: z.string(),
    observer_role_id: z.string().nullable(),
    scheduled_for: z.string(),
    state: z.string(),
    completed_at: z.string().nullable()
  })
  .strict();

export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
