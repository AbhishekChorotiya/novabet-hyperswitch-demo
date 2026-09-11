import { HYPERSWITCH_BASE_URL } from "@/lib/hyperswitch.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Config sanity check. Reports only whether keys EXIST, never their values. */
export async function GET() {
  return Response.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: {
      baseUrl: HYPERSWITCH_BASE_URL,
      hasSecretKey: !!process.env.HYPERSWITCH_SECRET_KEY,
      hasPublishableKey: !!process.env.HYPERSWITCH_PUBLISHABLE_KEY,
      hasProfileId: !!process.env.PROFILE_ID,
    },
  });
}
