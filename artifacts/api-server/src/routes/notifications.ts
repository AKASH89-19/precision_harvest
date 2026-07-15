import { Router, type IRouter } from "express";
import { sendIrrigationAlert } from "../lib/notifications";
import { SendTestNotificationBody, SendTestNotificationResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/notifications/test", async (req, res): Promise<void> => {
  const parsed = SendTestNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await sendIrrigationAlert(
    parsed.data.email,
    parsed.data.farmName,
    parsed.data.message
  );

  res.json(
    SendTestNotificationResponse.parse({
      sent: result.sent,
      method: result.method,
      error: result.error ?? null,
    })
  );
});

export default router;
