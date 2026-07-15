import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getIsConnected } from "./lib/mongodb";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, mongo: getIsConnected() });
});

app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  if (!getIsConnected()) {
    res.status(503).json({
      error: "Database unavailable",
      message:
        "MongoDB is not connected. Please update MONGODB_URI in Replit Secrets with your correct Atlas password and restart the API server.",
    });
    return;
  }
  next();
});

app.use("/api", router);

export default app;
