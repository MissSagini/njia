import { NextResponse, type NextRequest } from "next/server";
import { settle } from "@/lib/payments/ledger";
import { validSignature, verifyTransaction } from "@/lib/payments/paystack";

/**
 * Paystack calls this when a payment succeeds or fails. The signature proves it
 * came from Paystack; we then ask Paystack for the transaction ourselves before
 * recording anything, and settle() only records each payment once.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }

  const reference = event.data?.reference;
  // Only our own references; anything else (another integration on the account) is ignored
  if (!reference?.startsWith("njia_") || !["charge.success", "charge.failed"].includes(event.event ?? "")) {
    return NextResponse.json({ ok: true });
  }

  try {
    await settle(reference, await verifyTransaction(reference));
  } catch (error) {
    console.error("paystack webhook: settle failed", (error as Error).message);
    // A 500 makes Paystack retry later
    return NextResponse.json({ error: "not settled" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
