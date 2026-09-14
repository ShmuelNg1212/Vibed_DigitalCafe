"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";

import { encodeSession, sessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { registrationSchema, type RegistrationInput } from "@/lib/validation/auth";

export async function registerUser(input: RegistrationInput) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check the registration details and try again" };
  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return { ok: false as const, error: "An account with that email already exists" };
  const passwordHash = await hash(parsed.data.password, 12);
  const user = await db.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: "CUSTOMER" }, select: { id: true, role: true } });
  (await cookies()).set(sessionCookie, encodeSession({ userId: user.id, role: user.role }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return { ok: true as const };
}
