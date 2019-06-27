import axios from "axios";

// TODO: make it as environmental
const PUBLIC_VAPID_KEY =
  "BMDPcR5Boiz87Q4ia9X26DH_uRmQDVvxzk6LxaKu30mTP2ZWKCtWjp2c5XYWTKxIHwaWhQ2rf9SMQARtDfeP9GE";

const pushNotificationOptions = {
  /**
   * Symbolic agreement with the browser that the web app will show a notification every time a push is received
   * Always true
   */
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
};

// https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
export const supportsServiceWorkers = "serviceWorker" in navigator;
/**
 * Firefox in incognito  doesn't support service worker but it as PushManager.
 * So in order to validate actual support service worker must be supported
 */
export const supportsPushManager =
  supportsServiceWorkers && "PushManager" in window;
export const supportsNotifications = "Notification" in window;
export const canEnablePushNotifications =
  supportsPushManager && Notification.permission !== "denied";

/**
 * https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function apiSubscribeToPushNotifications(
  pushSubscription: PushSubscription
): Promise<boolean> {
  const res = await axios.post(
    "http://localhost:3000/push-notifications/subscribe",
    pushSubscription.toJSON()
  );

  // TODO: check actual backend stuff
  return res.status === 201;
}

async function apiUnsubscribeToPushNotifications(
  pushSubscription: PushSubscription
): Promise<boolean> {
  const res = await axios.post(
    "/push-notifications/unsubscribe",
    pushSubscription.toJSON()
  );

  // TODO: check actual backend stuff
  return res.status === 201;
}

export async function arePushNotificationsEnabled(): Promise<boolean> {
  /**
   * Do browser feature detection first
   */
  if (!supportsNotifications || !supportsPushManager) {
    return false;
  }
  /**
   * Push notifications and standard notifications share the same permission,
   * to improve the lookup time we can be sure if Notifications aren't allowed
   * then push notifications aren't allowed aswell
   */
  if (Notification.permission !== "granted") {
    return false;
  }

  // Check for registed service worker
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    return false;
  }

  //  Check push manager subscription
  const subscription = await reg.pushManager.getSubscription();
  return !!subscription;
}

export async function subscribe(): Promise<boolean> {
  if (!supportsPushManager) {
    return false;
  }

  const reg = await navigator.serviceWorker.getRegistration();

  if (!reg || !reg.pushManager) {
    return false;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
  let subscription: PushSubscription;

  try {
    subscription = await reg.pushManager.subscribe(pushNotificationOptions);
  } catch (err) {
    return false;
  }

  return await apiSubscribeToPushNotifications(subscription);
}

export async function unsubscribe(): Promise<boolean> {
  if (!supportsPushManager) {
    return false;
  }

  // https://stackoverflow.com/a/28805951
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !reg.pushManager) {
    return false;
  }

  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    return false;
  }

  let unsubscribed: boolean;

  try {
    unsubscribed = await subscription.unsubscribe();
  } catch {
    unsubscribed = false;
  }

  if (!unsubscribed) {
    return false;
  }

  // TEMP: Example Sent message to service worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(
      "Hello service worker, this is website!"
    );
  }

  return await apiUnsubscribeToPushNotifications(subscription);
}
