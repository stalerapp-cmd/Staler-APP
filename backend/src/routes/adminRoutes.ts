
import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import adminController from '../controllers/adminController';
import authController from '../controllers/authController';

const router = Router();

router.use(authenticateToken);

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

router.use(isAdmin);


router.get('/stats', adminController.getStats.bind(adminController));

router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserById.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));
router.post('/users/:userId/reset-password', adminController.resetUserPassword.bind(adminController)); // ✅ ADD THIS!
router.patch('/change-role/:id', adminController.changeUserRole.bind(adminController));
router.delete('/users/:userId', adminController.deleteUser.bind(adminController));

router.post('/create-user', authController.createVerifiedUser.bind(authController));


router.post('/create-bank-account', adminController.createUserBankAccount.bind(adminController));
router.post('/fund-wallet', adminController.fundUserWallet.bind(adminController));

router.get('/stores', adminController.listStores.bind(adminController));
router.patch('/stores/:storeId', adminController.updateStore.bind(adminController));
router.delete('/stores/:storeId', adminController.deleteStore.bind(adminController));


router.get('/settings', adminController.getSettings.bind(adminController));
router.put('/settings', adminController.updateSettings.bind(adminController));

router.get('/pending-users',              adminController.getPendingUsers.bind(adminController));
router.delete('/pending-users/:pendingId', adminController.deletePendingUser.bind(adminController));
router.patch('/pending-users/:pendingId',  adminController.updatePendingUser.bind(adminController));
router.delete('/pending-users',            adminController.clearExpiredPending.bind(adminController));
export default router;