import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import BankController from '../controllers/bankController';
import autoWithdrawController from '../controllers/autoWithdrawController';
import ReserveController from '../controllers/reserveController';
import DepositController from '../controllers/depositController';


const router = Router();

router.use(authenticateToken);

router.post('/check-balance', BankController.checkBankBalance.bind(BankController));

router.post('/withdraw', BankController.withdrawToWallet.bind(BankController));
router.post('/auto-withdraw', autoWithdrawController.autoWithdraw.bind(autoWithdrawController));

router.get('/info', BankController.getBankInfo.bind(BankController));

router.post('/auto-withdraw', autoWithdrawController.autoWithdraw.bind(autoWithdrawController));
router.post('/deposit', DepositController.depositToBank.bind(DepositController));

router.get('/reserves', ReserveController.list.bind(ReserveController));
router.post('/auto-withdraw/saved', BankController.autoWithdrawWithSavedCreds.bind(BankController));


router.get('/operation/:operationId', BankController.getBankOperation.bind(BankController));
router.post('/withdraw-qr', BankController.withdrawFromBankQR.bind(BankController));
router.post('/link-bank', BankController.linkBankAccount.bind(BankController));
router.get('/linked', BankController.getLinkedBank.bind(BankController));

export default router;
