import { Router, Request, Response, NextFunction } from 'express';
import { AccountsPayableController } from '../controllers/AccountsPayableController';

const router = Router();
const accountsPayableController = new AccountsPayableController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new accounts payable
router.post('/', asyncHandler(accountsPayableController.createAccountsPayable));

// Get all accounts payable with filters
router.get('/', asyncHandler(accountsPayableController.getAccountsPayable));

// Get accounts payable by ID
router.get('/:id', asyncHandler(accountsPayableController.getAccountsPayableById));

// Update accounts payable
router.put('/:id', asyncHandler(accountsPayableController.updateAccountsPayable));

// Delete accounts payable
router.delete('/:id', asyncHandler(accountsPayableController.deleteAccountsPayable));

// Mark as paid
router.patch('/:id/pay', asyncHandler(accountsPayableController.markAsPaid));

// Get statistics by user
router.get('/user/:user_id/statistics', asyncHandler(accountsPayableController.getStatistics));

// Search by name
router.get('/user/:user_id/search', asyncHandler(accountsPayableController.searchByName));

export default router; 