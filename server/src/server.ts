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
    // HTTP 410 is returned when push subscription has unsubscribed or expired
    if (err.statusCode === 410) {
      await removeSubcription();
      res.sendStatus(410);
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
