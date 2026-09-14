import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";

export type Session = { userId: string; role: UserRole };

const sessionCookie = "digital-cafe-session";

function secret() {
  return process.env.SESSION_SECRET ?? "local-development-only";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): Session | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return session.userId && (session.role === "CUSTOMER" || session.role === "ADMIN") ? session : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(sessionCookie)?.value;
  return value ? decodeSession(value) : null;
}

export async function requireRole(role: UserRole): Promise<Session> {
  const session = await getSession();
  if (!session || (role === "ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export { sessionCookie };
