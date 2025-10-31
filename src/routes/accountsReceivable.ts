import { Router, Request, Response, NextFunction } from 'express';
import { AccountsReceivableController } from '../controllers/AccountsReceivableController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const accountsReceivableController = new AccountsReceivableController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de contas a receber
// Create new accounts receivable
router.post('/', authenticateToken, asyncHandler(accountsReceivableController.createAccountsReceivable));

// Get all accounts receivable with filters
router.get('/', authenticateToken, asyncHandler(accountsReceivableController.getAccountsReceivable));

// Get accounts receivable by ID
router.get('/:id', authenticateToken, asyncHandler(accountsReceivableController.getAccountsReceivableById));

// Update accounts receivable
router.put('/:id', authenticateToken, asyncHandler(accountsReceivableController.updateAccountsReceivable));

// Delete accounts receivable
router.delete('/:id', authenticateToken, asyncHandler(accountsReceivableController.deleteAccountsReceivable));

// Mark as received
router.patch('/:id/receive', authenticateToken, asyncHandler(accountsReceivableController.markAsReceived));

// Get statistics by user
router.get('/user/:user_id/statistics', authenticateToken, asyncHandler(accountsReceivableController.getStatistics));

// Search by name
router.get('/user/:user_id/search', authenticateToken, asyncHandler(accountsReceivableController.searchByName));

export default router; 