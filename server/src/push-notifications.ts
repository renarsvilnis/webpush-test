import Redis from "ioredis";
import webpush, { PushSubscription } from "web-push";

const redis = new Redis();

const REDIS_KEY = "user-push-data";

/**
 * This must be either a URL or a 'mailto:' address. For example:
 * 'https://my-site.com/contact' or 'mailto: contact
 */
const vapidSubject = "https://community.ui.com";

/**
 * Keys from "npm run helper:generate-vapid-keys" command
 */
// TODO: make enviromnmentals
const publicVapidKey =
  "BMDPcR5Boiz87Q4ia9X26DH_uRmQDVvxzk6LxaKu30mTP2ZWKCtWjp2c5XYWTKxIHwaWhQ2rf9SMQARtDfeP9GE";
const privateVapidKey = "KnTLz8GtFJWHF3VCEJkiy1iJnD1gKEldyt2JDIDv7dM";

webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

export function isValidSubscription(body: any): boolean {
  return (
    !!body.endpoint && !!body.keys && !!body.keys.p256dh && !!body.keys.auth
  );
}

export async function saveSubscription(subscription: PushSubscription) {
  await redis.set(REDIS_KEY, JSON.stringify(subscription));
}

export async function getSubscription() {
  const subscriptionRaw = await redis.get(REDIS_KEY);

  if (subscriptionRaw) {
    return JSON.parse(subscriptionRaw);
  }
}

export async function removeSubcription() {
  const rowsRemoved = await redis.del(REDIS_KEY);
  return rowsRemoved === 1;
}
