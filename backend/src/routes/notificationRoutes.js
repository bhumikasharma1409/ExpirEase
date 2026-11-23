import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get('/', getNotifications);
notificationRouter.patch('/:id/read', markNotificationRead);

export default notificationRouter;
