import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../lib/user.model";
import { signToken } from "../lib/jwt";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { SignupBody, SigninBody, SigninResponse, GetMeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { name, email, password, farmLocation } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Conflict", message: "An account with this email already exists" });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ name, email, password: hashed, farmLocation });

  const token = signToken({ userId: String(user._id), email: user.email });

  const response = SigninResponse.parse({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      farmLocation: user.farmLocation ?? null,
    },
  });

  res.status(201).json(response);
});

router.post("/auth/signin", async (req: Request, res: Response) => {
  const parsed = SigninBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: String(user._id), email: user.email });

  const response = SigninResponse.parse({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      farmLocation: user.farmLocation ?? null,
    },
  });

  res.status(200).json(response);
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await UserModel.findById(req.userId).lean();
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }

  const response = GetMeResponse.parse({
    id: String(user._id),
    name: user.name,
    email: user.email,
    farmLocation: user.farmLocation ?? null,
  });

  res.json(response);
});

export default router;
