import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

import {
  isIndexDBSupported,
  setCredentials,
  getCredentials,
  clearCredentials
} from "./credentials";

import {
  arePushNotificationsEnabled,
  supportsServiceWorkers,
  supportsPushManager,
  supportsNotifications,
  unsubscribe,
  subscribe,
  canEnablePushNotifications
} from "./push-notifications";

(async () => {
  const supportsIndexDB = await isIndexDBSupported();
  console.log({ supportsIndexDB });

  const supportsIndexDB2 = await isIndexDBSupported();
  console.log({ supportsIndexDB });

  await setCredentials("test-accesstoken", Date.now().toString());

  const credentials = await getCredentials();
  console.log({ credentials });

  await clearCredentials();

  const credentialsAfter = await getCredentials();
  console.log({ credentialsAfter });

  await setCredentials("test-accesstoken-asfter", Date.now().toString());
})();

const notificationExamples = [
  {
    title: "When someone comments on my question",
    notification: {
      title: 'New comment on "UniFi Login Open on Public Facing IP"',
      body:
        '@ferganavalley wrote "Maybe try to do somehing else than flashing"',
      url:
        "https://community.ui.com/stories/Replacing-a-34dBi-AirFiber-Dish-with-a-MonsterDish/3f9a63ad-edd2-4465-98e9-4ac1cf94b6fd#comment/2519fcf2-b6c7-4d77-8828-02f1cb8241c1"
    }
  },
  { title: "When someone upvotes my question", notification: {} },
  {
    title: "When someone mentions me in comment",
    // notification: { title: '@ferganavalley mentioned you on a comment' }
    notification: {
      title:
        '@ferganavalley mentioned you on "UniFi Login Open on Public Facing IP"'
    }
  },
  { title: "When my question is marked as answered", notification: {} },
  {
    title: "When someone sends me a message",
    notification: {
      title: "New Message from @ferganavalley",
      url: "https://community.ui.com/messages"
      // icon: 'icons/potato.jpeg'
    }
    // notification: { title: "@ferganavalley sent you message" }
  }
];

const App: React.FC = () => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [indexDbSupported, setIndexDbSupported] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    false
  );

  useEffect(() => {
    Promise.all([arePushNotificationsEnabled(), isIndexDBSupported()]).then(
      ([pushNotificationsEnabled, indexDbSuported]) => {
        setLoadingStatus(false);
        setPushNotificationsEnabled(pushNotificationsEnabled);
        setIndexDbSupported(indexDbSuported);
      }
    );
  }, []);

  // TODO: add check if "blocked", do custom emssage to show user how to change
  // the settings

  return (
    <div className="App">
      <p>{`Web Notifications supported: ${
        loadingStatus ? "?" : supportsNotifications ? "✔" : "╳"
      }`}</p>
      <p>{`Service worker supported: ${
        loadingStatus ? "?" : supportsServiceWorkers ? "✔" : "╳"
      }`}</p>
      <p>{`Push notifications supported: ${
        loadingStatus ? "?" : supportsPushManager ? "✔" : "╳"
      }`}</p>
      <p>{`Can prompt to show notifications: ${
        loadingStatus ? "?" : canEnablePushNotifications ? "✔" : "╳"
      }`}</p>
      <p>{`Push notifications enabled: ${
        loadingStatus ? "?" : pushNotificationsEnabled ? "✔" : "╳"
      }`}</p>
      <p>{`Supports IndexDB: ${
        loadingStatus ? "?" : indexDbSupported ? "✔" : "╳"
      }`}</p>
      <p>
        <button
          disabled={
            !canEnablePushNotifications ||
            !supportsPushManager ||
            pushNotificationsEnabled
          }
          onClick={async () => {
            const success = await subscribe();
            if (success) {
              setPushNotificationsEnabled(true);
            }
          }}
        >
          Subscribe to Push notifications
        </button>
        <button
          disabled={
            !canEnablePushNotifications ||
            !supportsPushManager ||
            !pushNotificationsEnabled
          }
          onClick={async () => {
            const success = await unsubscribe();
            if (success) {
              setPushNotificationsEnabled(false);
            }
          }}
        >
          Unsubscribe to Push notifications
        </button>
      </p>

      <h2>Example Push Notifications</h2>
      {notificationExamples.map((example, i) => {
        return (
          <p key={i}>
            <button
              disabled={!pushNotificationsEnabled}
              onClick={async () => {
                await axios.post(
                  `/push-notifications/test`,
                  example.notification
                );
              }}
            >
              {example.title}
            </button>
          </p>
        );
      })}
    </div>
  );
};

export default App;
