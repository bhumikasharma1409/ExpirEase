import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getMe, login, register, updateMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/me', authenticate, updateMe);

export default authRouter;
