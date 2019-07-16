## Setup

```bash
# 1. Clone repo
git clone git@github.com:renarsvilnis/webpush-test.git

# 2. Start frontend
# In one terminal window launch client (frontend)
cd webpush-test/client
yarn
yarn start

# 3. Start backend
# In another terminal window launch server (backend)
cd webpush-test/server
npm i
npm start

# 4. Visit: http://localhost:3000/
```

## Service Workers

- https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle

## Push Notifications

- https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
- https://serviceworke.rs/push-payload_demo.html
- https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription

- Tools:

  - [Notification creator](https://tests.peter.sh/notification-generator/#title=2;;icon=7;;badge=1;;timestamp=1)
  - [web-push](https://github.com/web-push-libs/web-push)

- Tutorials:

  - [Mozilla Push examples](https://serviceworke.rs/push-get-payload_server_doc.html)
  - [Push Notifications Using Node.js & Service Worker](https://www.youtube.com/watch?v=HlYFW2zaYQM)
  - [Custom service worker in
    creat-react-app](https://stackoverflow.com/a/55062427)

* Might need later:

  - https://web-push-book.gauntface.com/chapter-05/04-common-notification-patterns/#merging-notifications
  - https://web-push-book.gauntface.com/chapter-05/03-notification-behaviour/#tag
  - https://web-push-book.gauntface.com/chapter-05/03-notification-behaviour/#renotify
  - https://web-push-book.gauntface.com/chapter-05/02-display-a-notification/#timestamp

## IndexDB

- https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices
