import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

import {
  arePushNotificationsEnabled,
  supportsServiceWorkers,
  supportsPushManager,
  supportsNotifications,
  unsubscribe,
  subscribe
} from "./push-notifications";

const notificationExamples = [
  {
    title: "When someone comments on my question",
    notification: {
      title: 'New comment on "UniFi Login Open on Public Facing IP"'
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
    }
    // notification: { title: "@ferganavalley sent you message" }
  }
];

const App: React.FC = () => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    false
  );

  useEffect(() => {
    arePushNotificationsEnabled().then(enabled => {
      console.log({ enabled });
      setLoadingStatus(false);
      setPushNotificationsEnabled(enabled);
    });
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
      <p>{`Push notifications enabled: ${
        loadingStatus ? "?" : pushNotificationsEnabled ? "✔" : "╳"
      }`}</p>
      <p>
        <button
          disabled={!supportsPushManager || pushNotificationsEnabled}
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
          disabled={!supportsPushManager || !pushNotificationsEnabled}
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

      <h2>Example notifications</h2>
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
