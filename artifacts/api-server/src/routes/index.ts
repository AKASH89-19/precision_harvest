import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import farmsRouter from "./farms";
import weatherRouter from "./weather";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use(farmsRouter);
router.use(weatherRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);

export default router;
