import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authenticateToken } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const router = Router();
const transactionController = new TransactionController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de transações
// Create new transaction
router.post('/', authenticateToken, requireSubscription, asyncHandler(transactionController.createTransaction));

// Get all transactions with filters
router.get('/', authenticateToken, asyncHandler(transactionController.getTransactions));

// Get transaction by ID
router.get('/:id', authenticateToken, asyncHandler(transactionController.getTransactionById));

// Update transaction
router.put('/:id', authenticateToken, requireSubscription, asyncHandler(transactionController.updateTransaction));

// Delete transaction
router.delete('/:id', authenticateToken, requireSubscription, asyncHandler(transactionController.deleteTransaction));

// Get statistics by user
router.get('/user/:user_id/statistics', authenticateToken, asyncHandler(transactionController.getStatistics));

// Get historical data by user
router.get('/user/:user_id/historical', authenticateToken, asyncHandler(transactionController.getHistoricalData));

// Search by description
router.get('/user/:user_id/search', authenticateToken, asyncHandler(transactionController.searchByDescription));

export default router; 