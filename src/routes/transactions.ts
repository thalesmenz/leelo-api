import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const router = Router();
const transactionController = new TransactionController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new transaction
router.post('/', asyncHandler(transactionController.createTransaction));

// Get all transactions with filters
router.get('/', asyncHandler(transactionController.getTransactions));

// Get transaction by ID
router.get('/:id', asyncHandler(transactionController.getTransactionById));

// Update transaction
router.put('/:id', asyncHandler(transactionController.updateTransaction));

// Delete transaction
router.delete('/:id', asyncHandler(transactionController.deleteTransaction));

// Get statistics by user
router.get('/user/:user_id/statistics', asyncHandler(transactionController.getStatistics));

// Get historical data by user
router.get('/user/:user_id/historical', asyncHandler(transactionController.getHistoricalData));

// Search by description
router.get('/user/:user_id/search', asyncHandler(transactionController.searchByDescription));

export default router; 