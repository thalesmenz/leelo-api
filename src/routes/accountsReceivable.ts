import { Router, Request, Response, NextFunction } from 'express';
import { AccountsReceivableController } from '../controllers/AccountsReceivableController';

const router = Router();
const accountsReceivableController = new AccountsReceivableController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new accounts receivable
router.post('/', asyncHandler(accountsReceivableController.createAccountsReceivable));

// Get all accounts receivable with filters
router.get('/', asyncHandler(accountsReceivableController.getAccountsReceivable));

// Get accounts receivable by ID
router.get('/:id', asyncHandler(accountsReceivableController.getAccountsReceivableById));

// Update accounts receivable
router.put('/:id', asyncHandler(accountsReceivableController.updateAccountsReceivable));

// Delete accounts receivable
router.delete('/:id', asyncHandler(accountsReceivableController.deleteAccountsReceivable));

// Mark as received
router.patch('/:id/receive', asyncHandler(accountsReceivableController.markAsReceived));

// Get statistics by user
router.get('/user/:user_id/statistics', asyncHandler(accountsReceivableController.getStatistics));

// Search by name
router.get('/user/:user_id/search', asyncHandler(accountsReceivableController.searchByName));

export default router; 