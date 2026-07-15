import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { FarmModel } from "../lib/farm.model";
import { type AuthRequest } from "../middleware/auth";
import { fetchForecast } from "../lib/weather";
import { GetAnalyticsParams, GetAnalyticsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const WATER_COST_PER_LITER = 0.002;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

router.get("/analytics/:farmId", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetAnalyticsParams.safeParse(req.params);
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

  const moneySaved = farm.waterSavedLiters * WATER_COST_PER_LITER;

  const irrigationEfficiency =
    farm.irrigationEvents + farm.skippedEvents > 0
      ? farm.skippedEvents / (farm.irrigationEvents + farm.skippedEvents)
      : 0.5;
  const cropHealthIndex = Math.min(
    100,
    Math.round(farm.currentMoisture * 0.6 + irrigationEfficiency * 40)
  );

  let weeklyUsage: { day: string; traditional: number; optimized: number; rainfall: number }[] = [];

  try {
    const forecast = await fetchForecast(farm.location);
    const dayMap = new Map<string, { rainfall: number; pop: number }>();
    for (const item of forecast.items) {
      const date = new Date(item.timestamp);
      const day = DAYS[date.getDay()];
      const existing = dayMap.get(day);
      const rainfallMm = item.rainProbability > 50 ? item.rainProbability * 0.5 : 0;
      if (!existing || item.rainProbability > existing.pop) {
        dayMap.set(day, { rainfall: rainfallMm, pop: item.rainProbability });
      }
    }

    const today = new Date();
    weeklyUsage = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 3 + i);
      const dayName = DAYS[d.getDay()];
      const dayData = dayMap.get(dayName);
      const rainfall = dayData?.rainfall ?? 0;
      const traditional = 450 + Math.random() * 100;
      const optimized = rainfall > 10 ? 0 : traditional * (0.5 + Math.random() * 0.3);
      return {
        day: dayName,
        traditional: Math.round(traditional),
        optimized: Math.round(optimized),
        rainfall: Math.round(rainfall),
      };
    });
  } catch {
    weeklyUsage = DAYS.slice(0, 7).map((day) => ({
      day,
      traditional: Math.round(400 + Math.random() * 150),
      optimized: Math.round(180 + Math.random() * 120),
      rainfall: Math.round(Math.random() * 20),
    }));
  }

  res.json(
    GetAnalyticsResponse.parse({
      farmId: farm._id.toString(),
      totalWaterSavedLiters: farm.waterSavedLiters,
      moneySaved: parseFloat(moneySaved.toFixed(2)),
      cropHealthIndex,
      irrigationEvents: farm.irrigationEvents,
      skippedEvents: farm.skippedEvents,
      weeklyUsage,
    })
  );
});

export default router;
