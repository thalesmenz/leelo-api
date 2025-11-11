import { Router, Request, Response, NextFunction } from 'express';
import { SubuserController } from '../controllers/SubuserController';
import { SubuserService } from '../services/SubuserService';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const subuserService = new SubuserService();
const subuserController = new SubuserController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de subusuários
// Create new subuser
router.post('/', authenticateToken, requireSubscription, asyncHandler(subuserController.createSubuser));

// Get subusers by parent ID
router.get('/parent/:parent_id', authenticateToken, asyncHandler(subuserController.getSubusersByParentId));

// Get subuser by ID
router.get('/id/:id', authenticateToken, asyncHandler(subuserController.getSubuserById));

// Update subuser
router.put('/id/:id', authenticateToken, requireSubscription, asyncHandler(subuserController.updateSubuser));

// Delete subuser
router.delete('/id/:id', authenticateToken, requireSubscription, asyncHandler(subuserController.deleteSubuser));

// Get parent user of a subuser
router.get('/:subuser_id/parent', authenticateToken, asyncHandler(subuserController.getParentUser));

// Get subuser transactions
router.get('/:subuser_id/transactions', authenticateToken, asyncHandler(subuserController.getSubuserTransactions));

// Get subuser accounts payable
router.get('/:subuser_id/accounts-payable', authenticateToken, asyncHandler(subuserController.getSubuserAccountsPayable));

// Get subuser accounts receivable
router.get('/:subuser_id/accounts-receivable', authenticateToken, asyncHandler(subuserController.getSubuserAccountsReceivable));

// Get consolidated data for all subusers
router.get('/parent/:parent_id/consolidated', authenticateToken, asyncHandler(subuserController.getAllSubusersConsolidatedData));

export default router; 