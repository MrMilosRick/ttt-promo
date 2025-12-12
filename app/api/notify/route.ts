import { NextResponse } from "next/server";

type Payload = {
  result: "win" | "lose";
  code?: string;
};

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Payload;

    const text =
      body.result === "win"
        ? `Победа! Промокод выдан: ${body.code ?? "-----"}`
        : "Проигрыш";

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    const tgJson = await tgRes.json();
    if (!tgRes.ok || !tgJson?.ok) {
      return NextResponse.json(
        { ok: false, error: "Telegram sendMessage failed", details: tgJson },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
