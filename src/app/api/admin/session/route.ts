import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSession,
} from "@/lib/server/admin-auth";
import { getBackendConfig } from "@/lib/server/env";

export async function GET() {
  const session = await getAdminSession();
  const config = getBackendConfig();
  return NextResponse.json({
    authenticated: Boolean(session),
    email: session?.email ?? null,
    status: {
      supabaseConfigured: config.supabaseConfigured,
      supabaseWriteConfigured: config.supabaseWriteConfigured,
      cloudinaryConfigured: config.cloudinaryConfigured,
      defaultAdminEmail: config.adminEmail,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const config = getBackendConfig();

    const email = (body.email ?? "").trim();
    const password = body.password ?? "";

    if (
      email.toLowerCase() !== config.adminEmail.toLowerCase() ||
      password !== config.adminPassword
    ) {
      return NextResponse.json(
        { error: "Invalid admin email or password." },
        { status: 401 },
      );
    }

    const token = createAdminSessionToken(config.adminEmail);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      ok: true,
      email: config.adminEmail,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
