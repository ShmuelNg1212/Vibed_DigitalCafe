import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { encodeSession, sessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const result = credentialsSchema.safeParse(await request.json());
  if (!result.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: result.data.email } });
  if (!user?.passwordHash || !(await compare(result.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ id: user.id, role: user.role });
  response.cookies.set(sessionCookie, encodeSession({ userId: user.id, role: user.role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
