import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import configRouter from "./config.js";
import documentsRouter from "./documents.js";
import conversationsRouter from "./conversations.js";
import aiRouter from "./ai.js";
import dashboardRouter from "./dashboard.js";
import profileRouter from "./profile.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(documentsRouter);
router.use(conversationsRouter);
router.use(aiRouter);
router.use(dashboardRouter);
router.use(profileRouter);

export default router;
