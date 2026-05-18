import { z } from "zod";

export const loginResponseSchema = z
  .object({
    role: z
      .object({
        id: z.number().int(),
        slug: z.string(),
        name: z.string(),
        documented: z.boolean()
      })
      .strict()
  })
  .strict();

export const loginErrorResponseSchema = z
  .object({
    detail: z.object({
      message: z.string(),
      attempts_remaining: z.number().int().nullable(),
      lockout_seconds_remaining: z.number().int().nullable()
    })
  })
  .strict();

export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LoginErrorResponse = z.infer<typeof loginErrorResponseSchema>;
