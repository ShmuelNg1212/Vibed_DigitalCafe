import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";

export type Session = { userId: string; role: UserRole };

const sessionCookie = "digital-cafe-session";

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Session;
    return session.userId && session.role ? session : null;
  } catch {
    return null;
  }
}

export async function requireRole(role: UserRole): Promise<Session> {
  const session = await getSession();
  if (!session || (role === "ADMIN" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export { sessionCookie };
