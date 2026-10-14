import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/server/store-repository";
import { sendPasswordResetEmail } from "@/lib/server/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const resetReq = await createPasswordResetRequest(email);
    if (!resetReq.ok) {
      return NextResponse.json({ ok: false, error: resetReq.error }, { status: 404 });
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetUrl = `${protocol}://${host}/reset-password?token=${encodeURIComponent(resetReq.token)}`;

    const emailResult = await sendPasswordResetEmail({
      to: resetReq.email,
      name: resetReq.name,
      resetUrl,
      resetCode: resetReq.code,
    });

    return NextResponse.json({
      ok: true,
      message: `A password reset link and verification code have been sent to ${email}.`,
      devMode: emailResult.devMode,
      devPreview: emailResult.devMode
        ? {
            code: resetReq.code,
            token: resetReq.token,
            resetUrl,
          }
        : undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to process forgot password request.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
