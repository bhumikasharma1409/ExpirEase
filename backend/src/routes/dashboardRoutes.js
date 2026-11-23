import { Router } from 'express';
import { getDashboard } from '../controllers/productController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const dashboardRouter = Router();

dashboardRouter.get('/', authenticate, getDashboard);

export default dashboardRouter;
