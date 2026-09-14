import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const userInputSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(100),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
