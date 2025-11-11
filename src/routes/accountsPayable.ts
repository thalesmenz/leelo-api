import { Router, Request, Response, NextFunction } from 'express';
import { AccountsPayableController } from '../controllers/AccountsPayableController';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const accountsPayableController = new AccountsPayableController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de contas a pagar
// Create new accounts payable
router.post('/', authenticateToken, requireSubscription, asyncHandler(accountsPayableController.createAccountsPayable));

// Get all accounts payable with filters
router.get('/', authenticateToken, asyncHandler(accountsPayableController.getAccountsPayable));

// Get accounts payable by ID
router.get('/:id', authenticateToken, asyncHandler(accountsPayableController.getAccountsPayableById));

// Update accounts payable
router.put('/:id', authenticateToken, requireSubscription, asyncHandler(accountsPayableController.updateAccountsPayable));

// Delete accounts payable
router.delete('/:id', authenticateToken, requireSubscription, asyncHandler(accountsPayableController.deleteAccountsPayable));

// Mark as paid
router.patch('/:id/pay', authenticateToken, requireSubscription, asyncHandler(accountsPayableController.markAsPaid));

// Get statistics by user
router.get('/user/:user_id/statistics', authenticateToken, asyncHandler(accountsPayableController.getStatistics));

// Search by name
router.get('/user/:user_id/search', authenticateToken, asyncHandler(accountsPayableController.searchByName));

export default router; 