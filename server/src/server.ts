import { Request, Response, default as express } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import webpush from "web-push";
import path from "path";

import {
  PushSubscription,
  isValidSubscription,
  saveSubscription,
  getSubscription,
  removeSubcription,
  vapidSubject,
  publicVapidKey,
  privateVapidKey
} from "./push-notifications";

webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);

const app = express();

app.use(morgan("tiny"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// setInterval(async () => {
//   const subscription = await getSubscription();

//   if (!subscription) {
//     console.log("Push notifications not enabled!");
//     return;
//   }

//   const payload  = JSON.stringify({
//     title: 'Hello world'
//   })
//   await webpush.sendNotification(subscription, payload);

//   // console.info("TODO: send notification", subscriptionData);
// }, 10000);

app.post("/push-notifications/subscribe", (req: Request, res: Response) => {
  if (!isValidSubscription(req.body)) {
    res.sendStatus(400);
    return;
  }

  const pushSubscription: PushSubscription = req.body;
  // Each device and browser combination will make a new subscription
  saveSubscription(pushSubscription).then(() => {
    console.log(JSON.stringify(pushSubscription, null, "  "));
    res.status(201).json({ data: { success: true } });
  });
});

app.post('/push-notifications/unsubscribe', async (req: Request, res: Response) => {
  const success = await removeSubcription();
  res.json({data: {success}});
})

app.post("/push-notifications/test", async (req: Request, res: Response) => {
  const subscription = await getSubscription();

  if (!subscription) {
    console.log("Push notifications not enabled!");
    res.sendStatus(404);
    return;
  }

  const payload = JSON.stringify(req.body);
  await webpush.sendNotification(subscription, payload);

  res.sendStatus(200)
});

app.use((req: Request, res: Response) => {
  res.sendStatus(404);
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🌍 Server listening on http://localhost:${PORT} 🌍 `);
});
