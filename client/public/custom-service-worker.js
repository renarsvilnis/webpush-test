/* eslint-disable no-restricted-globals */
/* eslint-env serviceworker */

// Called ONLY once per service sorker
// If event handler throws execption, service worker is thrown out
self.addEventListener("install", ev => {
  console.log('Service worker "install" event');
  console.log("New service worker");

  // Skip waiting phase and force new service-worker
  // Not: recommended! Rather show button "update available"
  self.skipWaiting();

  // event.waitUntil(
  //   // caching etc
  // );
});

// Once your service worker is ready to control clients and handle functional
// events like push and sync, you'll get an activate event. But that doesn't
// mean the page that called .register() will be controlled.
self.addEventListener("activate", ev => {
  // I see a lot of people including clients.claim() as boilerplate, but I
  // rarely do so myself. It only really matters on the very first load, and due
  // to progressive enhancement the page is usually working happily without
  // service worker anyway.
  console.log('Service worker "activate" event');

  // Migrating databases and/or clear caches here as runned on install or after
  // "old" service worker is removed
  // ⚠️Due to how service worker updates work while waiting for the new serice
  // worker to update (similar to chrome updates) new service worker multiple
  // versions might happend so "migration" needs to handle that a skipped
  // version
});

self.addEventListener("update", ev => {
  console.log("Service worker 'update' event");
});

self.addEventListener("push", ev => {
  ev.waitUntil(
    (async () => {
      /**
       * As we send all required info inside of the push notification exit early
       * if it isn't present
       */
      if (!ev.data) {
        return;
      }

      let data;
      try {
        data = ev.data.json();
      } catch {
        return;
      }

      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      let clientIsFocused = false;
      for (let i = 0, l = windowClients.length; i < l; i++) {
        if (windowClients[i].focused) {
          clientIsFocused = true;
          break;
        }
      }

      // TODO: Maybe add additional boolean from backend that indicates wheter
      //       to force notification
      if (clientIsFocused) {
        windowClients.forEach(windowClient => {
          windowClient.postMessage({
            type: "PUSH_NOTIFICATION",
            time: new Date().toString(),
            data
          });
        });
        // TODO: maybe don't send notification
      } else {
        // Doc:
        // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
        // https://web-push-book.gauntface.com/chapter-05/02-display-a-notification
        await self.registration.showNotification(data.title, {
          // lang: 'en
          body: data.body,
          icon: data.icon,
          /**
           * As of writing only for chrome on Android
           * Size: >= 72x72px (multiplies of 24px)
           */
          badge: data.badge,
          // group messages for upvotes ett
          // An ID for a given notification that allows you to find, replace, or remove the notification using a script if necessary.
          // tag: data.tag,
          tag: data.tag,
          /**
           * If renotify is true, it must also have a tag
           */
          renotify: data.renotify || false,
          requireInteraction: data.requireInteraction || false,

          // const supportsActions = 'actions' in Notification.prototype;
          // actions: []

          data: {
            // TODO: Maybe add unique id?
            // id: data.id
            url: data.url
          }
        });
      }
    })()
  );
});

setInterval(async () => {
  const credentials = await getCredentials();
  console.log("Service worker read credentials:", credentials);
}, 5000);

async function subscribe(pushSubscription) {
  // TODO: send request to backend
  // pushSubscription.toJSON()
}

/**
 * Trigged when there is a change in push subscription that was triggered
 * outside the application's control. This may occur if the subscription was
 * refreshed by the browser, but it may also happen if the subscription has been
 * revoked or lost.
 *
 * Docs: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event
 */
self.addEventListener("pushsubscriptionchange", ev => {
  console.log("pushsubscriptionchange", ev.oldSubscription, ev);

  // https://stackoverflow.com/questions/36602136/how-can-i-test-pushsubscriptionchange-event-handling-code

  ev.waitUntil(
    (async () => {
      try {
        const pushSubscription = await self.registration.pushManager.subscribe(ev.oldSubscription.options);
        await subscribe(pushSubscription);
      } catch {
        return;
      }
    })()
  );
});

/**
 * Triggered when clicking the "close" button of the notification instead of
 * any action or body. Can be used to update analytics etc.
 */
self.addEventListener("notificationclose", ev => {
  console.log("Closed notification");

  // const data = ev.notification.data;
  // Alternative: https://youtu.be/_dXBibRO0SM?t=2066
  // event.waitUntil(fetch('/api/close-notif?id=' + data.id))
});

const addTrailingSlashIfNeeded = url => `${url}${url.endsWith("/") ? "" : "/"}`;

/**
 * Triggered when clicking on the notification body or any of it's custom actions
 */
self.addEventListener("notificationclick", ev => {
  ev.waitUntil(
    (async () => {
      ev.notification.close();

      /**
       * Find all opened windows "tabs" of the site, must also include the
       * uncontrolled ones as otherwise if user has only one "tab" and it
       * initializes the service worker it won't be included in the matchAll() response.
       * Source: https://stackoverflow.com/a/35108844
       * Docs: https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow#Examples
       */
      const clientsArr = await clients.matchAll({
        includeUncontrolled: true,
        type: "window"
      });

      /**
       * Need to add a trailing slash as clients.matchAll() result client.url
       * properties contain url with a trailing slash
       */
      const urlToVisit = addTrailingSlashIfNeeded(
        (ev.notification.data && ev.notification.data.url) || ev.srcElement.location.origin
      );
      // Alternative way: https://developers.google.com/web/fundamentals/push-notifications/common-notification-patterns#focus_an_existing_window
      // const urlToOpen = new URL(examplePage, self.location.origin).href;

      /**
       * clients.matchAll() returns clients in most recently focused order,
       * correct as per spec so stop looping at first match.
       */
      let foundClient;
      for (let i = 0, l = clientsArr.length; i < l; i++) {
        // TODO: you can also detect if window client is focued by lookit at clientsArr[i].focused

        if (clientsArr[i].url === urlToVisit) {
          foundClient = clientsArr[i];
          break;
        }
      }

      if (foundClient) {
        // We already have a window to use, focus it.
        foundClient.postMessage({
          type: "PUSH_NOTIFICATION",
          url: urlToVisit
        });
        foundClient.focus();
      } else {
        // Create a new window.
        await clients.openWindow(urlToVisit);
      }
    })()
  );
});

self.addEventListener("message", messageEvent => {
  console.log("Service Worker recieved message:", messageEvent);
});

// #############################################################################
// #############################################################################
// #############################################################################
// Now the credentials library code is inline as this file
// `custom-service-worker.js` isn't transpiled
// TODO: import credentials.ts
// import { getCredentials } from "./credentials";
// #############################################################################
// #############################################################################
// #############################################################################

const DB_NAME = "community";
const DB_VERSION = 1;

const ACCESS_TOKEN_STORE_NAME = "credentials";

// Cached connection instance
let cachedDb;

function getDatabase() {
  return new Promise((resolve, reject) => {
    if (cachedDb) {
      resolve(cachedDb);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase
    request.onupgradeneeded = ev => {
      const db = request.result;

      // Version 1 is the first version of the database.
      if (ev.oldVersion < 1) {
        db.createObjectStore(ACCESS_TOKEN_STORE_NAME);
      }
      // Other migrations go here
    };

    request.onerror = ev => {
      reject(request.error);
    };

    request.onsuccess = ev => {
      cachedDb = request.result;

      cachedDb.onclose = () => {
        cachedDb = undefined;
      };

      resolve(cachedDb);
    };
  });
}

function getCredentials() {
  return new Promise(async (resolve, reject) => {
    const db = await getDatabase();
    const transaction = db.transaction([ACCESS_TOKEN_STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(ACCESS_TOKEN_STORE_NAME);
    const request = objectStore.getAll();

    transaction.onerror = ev => {
      reject(transaction.error);
    };
    transaction.oncomplete = ev => {
      const results = request.result;
      resolve({
        accessToken: results[0],
        refreshToken: results[1]
      });
    };
  });
}
