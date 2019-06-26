import Redis from "ioredis";

const redis = new Redis();

const REDIS_KEY = "user-push-data";

// TODO: make enviromnmentals
/**
 * This must be either a URL or a 'mailto:' address. For example:
 * 'https://my-site.com/contact' or 'mailto: contact
 */ 
export const vapidSubject = "mailto:community-support@ubnt.com";
/**
 * Keys from "npm run helper:generate-vapid-keys" command
 */
export const publicVapidKey =
  "BMDPcR5Boiz87Q4ia9X26DH_uRmQDVvxzk6LxaKu30mTP2ZWKCtWjp2c5XYWTKxIHwaWhQ2rf9SMQARtDfeP9GE";
export const privateVapidKey = "KnTLz8GtFJWHF3VCEJkiy1iJnD1gKEldyt2JDIDv7dM";

type USVString = string;
export interface PushSubscription {
  endpoint: USVString;
  expirationTime?: DOMHighResTimeStamp;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export function isValidSubscription(body: any) {
  // TODO: implement
  return true;
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

export async function removeSubcription () {
  const rowsRemoved = await redis.del(REDIS_KEY);
  return rowsRemoved === 1;
}
