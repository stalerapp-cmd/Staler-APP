
import { Router } from 'express';
import storeController from '../controllers/storeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/products', storeController.getAllProducts.bind(storeController));
router.get('/products/:productId', storeController.getProductById.bind(storeController));

router.use(authenticateToken);
router.post('/orders', storeController.createOrder.bind(storeController));
router.post('/payment', storeController.processPayment.bind(storeController));
router.get('/orders', storeController.getUserOrders.bind(storeController));
router.get('/orders/:orderId', storeController.getOrderDetails.bind(storeController));

router.get('/download/:orderId/:itemId', storeController.downloadDigitalProduct.bind(storeController));

export default router;