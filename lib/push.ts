import webpush from "web-push";
import { createServerClient } from "@/lib/supabase";

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export async function sendPushToTenant(
  tenantId: string,
  payload: PushPayload,
): Promise<void> {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const db = createServerClient();
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("tenant_id", tenantId);

  if (!subs?.length) return;

  const staleIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        // 410 Gone / 404 = subscription expired — mark for cleanup
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          staleIds.push(row.id);
        }
      }
    }),
  );

  if (staleIds.length) {
    await db.from("push_subscriptions").delete().in("id", staleIds);
  }
}
