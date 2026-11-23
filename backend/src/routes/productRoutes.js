import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getExpiredProducts,
  getProduct,
  getProducts,
  getProductsExpiringSoon,
  getProductsExpiringToday,
  getPriorityProducts,
  getSafeProducts,
  markProductConsumed,
  markProductDiscarded,
  updateProduct,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const productRouter = Router();

productRouter.use(authenticate);
productRouter.post('/', createProduct);
productRouter.get('/', getProducts);
productRouter.get('/expired', getExpiredProducts);
productRouter.get('/expiring/today', getProductsExpiringToday);
productRouter.get('/expiring/soon', getProductsExpiringSoon);
productRouter.get('/safe', getSafeProducts);
productRouter.get('/priority', getPriorityProducts);
productRouter.get('/:id', getProduct);
productRouter.put('/:id', updateProduct);
productRouter.delete('/:id', deleteProduct);
productRouter.patch('/:id/consumed', markProductConsumed);
productRouter.patch('/:id/discarded', markProductDiscarded);

export default productRouter;
