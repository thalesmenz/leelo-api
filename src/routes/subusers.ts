import { Router, Request, Response, NextFunction } from 'express';
import { SubuserController } from '../controllers/SubuserController';
import { SubuserService } from '../services/SubuserService';

const router = Router();
const subuserService = new SubuserService();
const subuserController = new SubuserController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new subuser
router.post('/', asyncHandler(subuserController.createSubuser));

// Get subusers by parent ID
router.get('/parent/:parent_id', asyncHandler(subuserController.getSubusersByParentId));

// Get subuser by ID
router.get('/id/:id', asyncHandler(subuserController.getSubuserById));

// Update subuser
router.put('/id/:id', asyncHandler(subuserController.updateSubuser));

// Delete subuser
router.delete('/id/:id', asyncHandler(subuserController.deleteSubuser));

// Get parent user of a subuser
router.get('/:subuser_id/parent', asyncHandler(subuserController.getParentUser));

// Get subuser transactions
router.get('/:subuser_id/transactions', asyncHandler(subuserController.getSubuserTransactions));

// Get subuser accounts payable
router.get('/:subuser_id/accounts-payable', asyncHandler(subuserController.getSubuserAccountsPayable));

// Get subuser accounts receivable
router.get('/:subuser_id/accounts-receivable', asyncHandler(subuserController.getSubuserAccountsReceivable));

// Get consolidated data for all subusers
router.get('/parent/:parent_id/consolidated', asyncHandler(subuserController.getAllSubusersConsolidatedData));

export default router; 