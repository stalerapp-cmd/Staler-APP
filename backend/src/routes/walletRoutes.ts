import { Router } from 'express';
import walletController from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', walletController.getWallet.bind(walletController));
router.get('/transactions', walletController.getTransactions.bind(walletController));
router.post('/transfer', walletController.transfer.bind(walletController));

export default router;
