import { NextRequest, NextResponse } from "next/server";
import { sendDueReminderEmails } from "@/lib/reminder-emails";

// Scheduled-job-friendly endpoint (Milestone 7 Batch 4): an external
// scheduler (Vercel Cron, a hosted cron service, etc.) calls this on a
// schedule with `Authorization: Bearer <CRON_SECRET>` — the same
// bearer-token convention Vercel Cron uses natively. No schedule is wired
// up in this batch; this route is the mechanism a schedule would call.
//
// CRON_SECRET is required, not optional — this endpoint sends real email to
// real users, so it must never be reachable unauthenticated, including in
// environments where the operator forgot to set the secret.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueReminderEmails();
  return NextResponse.json(result);
}
