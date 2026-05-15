import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import extractionsRouter from "./extractions";
import validationsRouter from "./validations";
import reviewsRouter from "./reviews";
import workflowsRouter from "./workflows";
import vendorsRouter from "./vendors";
import exportsRouter from "./exports";
import auditRouter from "./audit";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(extractionsRouter);
router.use(validationsRouter);
router.use(reviewsRouter);
router.use(workflowsRouter);
router.use(vendorsRouter);
router.use(exportsRouter);
router.use(auditRouter);
router.use(analyticsRouter);

export default router;
