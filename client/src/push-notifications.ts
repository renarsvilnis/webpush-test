import axios from "axios";

// TODO: Import as environmental
const PUBLIC_VAPID_KEY =
  "BMDPcR5Boiz87Q4ia9X26DH_uRmQDVvxzk6LxaKu30mTP2ZWKCtWjp2c5XYWTKxIHwaWhQ2rf9SMQARtDfeP9GE";

const pushNotificationOptions = {
  // If we send notifications,we must show something
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
};

// https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
export const supportsServiceWorkers = "serviceWorker" in navigator;
export const supportsPushManager = "PushManager" in window;
export const supportsNotifications = "Notification" in window;

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

export async function arePushNotificationsEnabled(): Promise<boolean> {
  /**
   * Do browser feature detection first
   */
  if (
    !supportsNotifications ||
    !supportsPushManager ||
    !supportsServiceWorkers
  ) {
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
  if (!supportsServiceWorkers || !supportsPushManager) {
    return false;
  }

  console.log(
    "Notification Permission Before request:",
    Notification.permission
  );

  const reg = await navigator.serviceWorker.getRegistration();

  if (reg && reg.pushManager) {
    // https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
    let subscription: PushSubscription | undefined;

    try {
      subscription = await reg.pushManager.subscribe(pushNotificationOptions);
      console.log({subscription});
      
    } catch (err) {
      if (Notification.permission === "denied") {
        console.info("Permission for notifications was denied");
      } else {
        console.info("Unable to subscribe to push", err);
      }
      return false;
    }

    console.log(
      "Push subscription client side:",
      subscription,
      subscription.toJSON()
    );

    const res = await axios.post(
      "http://localhost:3000/push-notifications/subscribe",
      subscription.toJSON()
    );
    console.log("Backend response:", res.status);

    return res.status === 201;
  }

  return false;
}

export async function unsubscribe(): Promise<boolean> {
  if (!supportsServiceWorkers || !supportsPushManager) {
    return false;
  }

  const reg = await navigator.serviceWorker.getRegistration();
  if (reg && reg.pushManager) {
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      await axios.post("/push-notifications/unsubscribe");
      // TODO: call backend
      console.log("Unsubscribe Results:", unsubscribed);
      return unsubscribed;
    } else {
      console.log("Nothing to unsubscribe to");
      return false;
    }
  }

  return false;
}
