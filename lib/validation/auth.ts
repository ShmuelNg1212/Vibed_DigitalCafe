import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const userInputSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(100),
});
