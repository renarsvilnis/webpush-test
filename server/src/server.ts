import { Request, Response, default as express } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import webpush, { PushSubscription } from "web-push";

import {
  isValidSubscription,
  saveSubscription,
  getSubscription,
  removeSubcription
} from "./push-notifications";

const app = express();

app.use(morgan("tiny"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.post("/push-notifications/subscribe", (req: Request, res: Response) => {
  if (!isValidSubscription(req.body)) {
    res.status(201).json({ data: { success: false } });
    return;
  }

  const pushSubscription: PushSubscription = req.body;
  // Each device and browser combination will make a new subscription
  saveSubscription(pushSubscription).then(() => {
    console.log(JSON.stringify(pushSubscription, null, "  "));
    res.status(201).json({ data: { success: true } });
  });
});

app.post(
  "/push-notifications/unsubscribe",
  async (req: Request, res: Response) => {
    const success = await removeSubcription();
    res.status(201).json({ data: { success } });
  }
);

app.post("/push-notifications/test", async (req: Request, res: Response) => {
  const subscription = await getSubscription();

  if (!subscription) {
    console.log("Push notifications not enabled!");
    res.sendStatus(404);
    return;
  }

  const payload = JSON.stringify(req.body);
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (err) {
    /**
     * HTTP 404 - Not Found. This is an indication that the subscription is expired and can't be used. In this case you should delete the `PushSubscription` and wait for the client to resubscribe the user.
     * HTTP 410 - Gone. The subscription is no longer valid and should be removed from application server. This can be reproduced by calling `unsubscribe()` on a `PushSubscription`.
     * Source: https://developers.google.com/web/fundamentals/push-notifications/sending-messages-with-web-push-libraries#sending_push_messages
     */
    if (err.statusCode === 404 || err.statusCode === 410) {
      await removeSubcription();
      res.sendStatus(err.statusCode);

      // TODO: Handle Other HTTP headers:
      // List of all responses: https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol#everything_together
      // Too many requests. Meaning your application server has reached a rate limit with a push service. The push service should include a 'Retry-After' header to indicate how long before another request can be made.
    } else if (err.statusCode === 429) {
      // TODO: what to do
      res.sendStatus(500);
    } else {
      console.error(err);
      res.sendStatus(500);
    }
    return;
  }

  res.sendStatus(201);
});

app.use((req: Request, res: Response) => {
  res.sendStatus(404);
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🌍 Server listening on http://localhost:${PORT} 🌍 `);
});
