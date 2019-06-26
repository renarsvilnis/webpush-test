/* eslint-env serviceworker */

// self.addEventListener('push', (ev) => {
//  // Work until promise inside is resolved
//   ev.waitUntil(() => {
//     self.registration.showNotification('Title', {
//       body: "I'm the message body",
//       icon: 'images/potato.jpeg',
//       tag: 'tag',
//       actions: [
//         {action: 'like', title: 'Like', icon: '...'},
//         {action: 'reshare', title: 'Reshare', icon: '...'}
//       ]
//     })
//   })
// })

// self.registration.showNotification("Title", {
//   body: "I'm the message body",
//   icon: "images/potato.jpeg",
//   tag: "tag",
//   actions: [
//     {
//       action: "like",
//       title: "Like"
//       // icon: "..."
//     },
//     {
//       action: "reshare",
//       title: "Reshare"
//       // icon: "..."
//     }
//   ]
// });

// {"title": "Test", "body": "Hello world", "tag": "tag"}
self.addEventListener("push", ev => {
  if (!ev.data) {
    return;
  }

  let data;
  try {
    data = ev.data.json();
  } catch {
    return;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  // https://stackoverflow.com/a/44025413
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    // group messages for upvotes ett
    tag: data.tag,
    data: {
      url: data.url
    }
  });
});

// const backend = {
//   regiister () {

//   }
// }

// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event
self.addEventListener("pushsubscriptionchange", ev => {
  // remove the entry from DB
  console.debug("pushsubscriptionchange");
  // ev.waitUntil(async () => {
  //   const subscription = await self.registration.pushManager.subscribe(ev.oldSubscription.options);
  // });
});

// https://medium.com/founding-ithaka/implementing-push-notifications-with-create-react-app-bf35cd25d870
self.addEventListener("notificationclose", ev => {
  const notification = ev.notification;
  const data = notification.data || {};
  const primaryKey = data.primaryKey;
  console.debug("Closed notification: " + primaryKey);

  // Alternative: https://youtu.be/_dXBibRO0SM?t=2066
  // event.waitUntil(fethc('/api/close-notif?id=' + data.id))
});

self.addEventListener("notificationclick", ev => {
  const data = ev.notification.data || {};
  const primaryKey = data.primaryKey;
  const action = ev.action;

  // if (action === 'like') {
  //   event.waitUntil(fetch('...'))
  // } ...
  console.debug("Clicked notification: " + primaryKey);
  if (action === "close") {
    console.debug("Notification clicked and closed", primaryKey);
    ev.notification.close();
  } else {
    console.debug("Notification actioned", primaryKey);
    const url = data.url || "/";
    ev.notification.close();
    clients.openWindow(url);
    // clients.openWindow(ev.srcElement.location.origin);
  }
});
