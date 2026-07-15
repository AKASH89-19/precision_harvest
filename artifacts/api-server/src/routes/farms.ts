import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { FarmModel } from "../lib/farm.model";
import { type AuthRequest } from "../middleware/auth";
import {
  ListFarmsResponse,
  GetFarmParams,
  GetFarmResponse,
  CreateFarmBody,
  UpdateFarmParams,
  UpdateFarmBody,
  UpdateFarmResponse,
  DeleteFarmParams,
  TogglePumpParams,
  TogglePumpBody,
  TogglePumpResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function farmToResponse(farm: InstanceType<typeof FarmModel>) {
  return {
    id: (farm._id as mongoose.Types.ObjectId).toString(),
    name: farm.name,
    location: farm.location,
    cropType: farm.cropType,
    pumpStatus: farm.pumpStatus,
    currentMoisture: farm.currentMoisture,
    waterSavedLiters: farm.waterSavedLiters,
    notificationEmail: farm.notificationEmail ?? null,
    notificationPhone: farm.notificationPhone ?? null,
    createdAt: farm.createdAt.toISOString(),
  };
}

router.get("/farms", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const farms = await FarmModel.find({ userId }).sort({ createdAt: -1 });
  res.json(ListFarmsResponse.parse(farms.map(farmToResponse)));
});

router.post("/farms", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Validate city name with OpenWeather before saving
  if (parsed.data.location) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const checkRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(parsed.data.location)}&appid=${apiKey}`
      );
      if (!checkRes.ok) {
        res.status(422).json({
          error: `"${parsed.data.location}" is not a valid city name. Please enter a city that exists.`,
        });
        return;
      }
    }
  }

  const farm = await FarmModel.create({ ...parsed.data, userId });
  res.status(201).json(GetFarmResponse.parse(farmToResponse(farm)));
});

router.get("/farms/:id", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = GetFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.id)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOne({ _id: params.data.id, userId });
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  res.json(GetFarmResponse.parse(farmToResponse(farm)));
});

router.patch("/farms/:id", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = UpdateFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateFarmBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.id)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  // Validate city name with OpenWeather before saving
  if (body.data.location) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const checkRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(body.data.location)}&appid=${apiKey}`
      );
      if (!checkRes.ok) {
        res.status(422).json({
          error: `"${body.data.location}" is not a valid city name. Please enter a city that exists.`,
        });
        return;
      }
    }
  }

  const farm = await FarmModel.findOneAndUpdate(
    { _id: params.data.id, userId },
    body.data,
    { new: true }
  );
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  res.json(UpdateFarmResponse.parse(farmToResponse(farm)));
});

router.delete("/farms/:id", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = DeleteFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.id)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOneAndDelete({ _id: params.data.id, userId });
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/farms/:id/pump", async (req, res): Promise<void> => {
  const { userId } = req as AuthRequest;
  const params = TogglePumpParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = TogglePumpBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.data.id)) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const farm = await FarmModel.findOneAndUpdate(
    { _id: params.data.id, userId },
    { pumpStatus: body.data.status },
    { new: true }
  );
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  res.json(TogglePumpResponse.parse(farmToResponse(farm)));
});

export default router;
