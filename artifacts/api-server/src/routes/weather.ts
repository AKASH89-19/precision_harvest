import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { FarmModel } from "../lib/farm.model";
import { type AuthRequest } from "../middleware/auth";
import { fetchWeatherWithForecast, fetchForecast } from "../lib/weather";
import { sendIrrigationAlert } from "../lib/notifications";
import {
  GetWeatherParams,
  GetWeatherResponse,
  GetWeatherForecastParams,
  GetWeatherForecastResponse,
  RunIrrigationAutomationParams,
  RunIrrigationAutomationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/weather/:farmId", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetWeatherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.farmId)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOne({ _id: params.data.farmId, userId });
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  try {
    const weather = await fetchWeatherWithForecast(farm.location);
    res.json(GetWeatherResponse.parse(weather));
  } catch (err) {
    const message = (err as Error).message;
    res.status(422).json({ error: message });
  }
});

router.get("/weather/:farmId/forecast", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetWeatherForecastParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.farmId)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOne({ _id: params.data.farmId, userId });
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  try {
    const forecast = await fetchForecast(farm.location);
    res.json(GetWeatherForecastResponse.parse(forecast));
  } catch (err) {
    const message = (err as Error).message;
    res.status(422).json({ error: message });
  }
});

router.post("/weather/:farmId/automate", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = RunIrrigationAutomationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.farmId)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOne({ _id: params.data.farmId, userId });
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  let weather;
  try {
    weather = await fetchWeatherWithForecast(farm.location);
  } catch (err) {
    const message = (err as Error).message;
    res.status(422).json({ error: message });
    return;
  }

  let action: string;
  let newPumpStatus: "ON" | "OFF" | "PAUSED_BY_AI";
  let waterSavedThisRun = 0;
  let notificationSent = false;

  const LITERS_PER_CYCLE = 450;

  const alertEmail = farm.notificationEmail ?? process.env.ALERT_EMAIL ?? null;

  if (!weather.shouldIrrigate) {
    action = "PAUSED_BY_AI";
    newPumpStatus = "PAUSED_BY_AI";
    waterSavedThisRun = LITERS_PER_CYCLE;

    await FarmModel.findOneAndUpdate(
      { _id: farm._id, userId },
      { pumpStatus: "PAUSED_BY_AI", $inc: { waterSavedLiters: waterSavedThisRun, skippedEvents: 1 } }
    );

    if (alertEmail) {
      const msg = `AI Evaluation complete for ${farm.name}. Rain probability: ${Math.round(weather.rainProbability)}% — irrigation has been PAUSED. Estimated water saved: ${waterSavedThisRun} Liters.`;
      const notifResult = await sendIrrigationAlert(alertEmail, farm.name, msg);
      notificationSent = notifResult.sent;
    }
  } else {
    action = "IRRIGATED";
    newPumpStatus = "ON";
    const actualLiters = LITERS_PER_CYCLE * weather.pumpDurationMultiplier;

    await FarmModel.findOneAndUpdate(
      { _id: farm._id, userId },
      { pumpStatus: "ON", $inc: { irrigationEvents: 1 }, currentMoisture: Math.min(100, farm.currentMoisture + 15) }
    );

    setTimeout(async () => {
      await FarmModel.findOneAndUpdate({ _id: farm._id, userId }, { pumpStatus: "OFF" });
    }, 5000);

    req.log.info(
      { farmId: farm._id, liters: actualLiters, multiplier: weather.pumpDurationMultiplier },
      "Irrigation cycle started"
    );

    if (alertEmail) {
      const msg = `AI Evaluation complete for ${farm.name}. Conditions are good — irrigation STARTED (${actualLiters.toFixed(0)} L, ${weather.pumpDurationMultiplier}x multiplier). ${weather.recommendation}`;
      const notifResult = await sendIrrigationAlert(alertEmail, farm.name, msg);
      notificationSent = notifResult.sent;
    }
  }

  res.json(
    RunIrrigationAutomationResponse.parse({
      farmId: farm._id.toString(),
      action,
      reason: weather.recommendation,
      waterSavedLiters: waterSavedThisRun,
      notificationSent,
    })
  );
});

export default router;
