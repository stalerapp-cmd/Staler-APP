
import { Router }       from 'express';
import ctrl             from '../controllers/messagesController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/search-users',                                  ctrl.searchUsers);

router.get('/conversations',                                 ctrl.getConversations);
router.post('/conversations',                                ctrl.createConversation);
router.patch('/conversations/:conversationId/close',         ctrl.closeConversation);

router.get('/conversations/:conversationId/messages',        ctrl.getMessages);
router.post('/conversations/:conversationId/messages',       ctrl.sendMessage);
router.patch('/messages/:messageId',                         ctrl.editMessage);
router.delete('/messages/:messageId',                        ctrl.deleteMessage);

router.get('/unread-count',                                  ctrl.getUnreadCount);

export default router;