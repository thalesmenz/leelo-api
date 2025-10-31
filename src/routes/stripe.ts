import { Router, Request, Response, NextFunction } from 'express';
import { StripeController } from '../controllers/StripeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const stripeController = new StripeController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new payment intent (requer autenticação)
router.post('/payment-intent', authenticateToken, asyncHandler(stripeController.createPaymentIntent));

// Get all payment intents with filters (requer autenticação)
router.get('/payment-intents', authenticateToken, asyncHandler(stripeController.getPaymentIntents));

// Get payment intent by ID (requer autenticação)
router.get('/payment-intent/:id', authenticateToken, asyncHandler(stripeController.getPaymentIntentById));

// Update payment intent (requer autenticação)
router.put('/payment-intent/:id', authenticateToken, asyncHandler(stripeController.updatePaymentIntent));

// Delete payment intent (requer autenticação)
router.delete('/payment-intent/:id', authenticateToken, asyncHandler(stripeController.deletePaymentIntent));

// Get statistics by user (requer autenticação)
router.get('/statistics', authenticateToken, asyncHandler(stripeController.getStatistics));

// Create checkout session (requer autenticação)
router.post('/checkout-session', authenticateToken, asyncHandler(stripeController.createCheckoutSession));

// Verify checkout session status (requer autenticação)
router.get('/checkout-session/:session_id', authenticateToken, asyncHandler(stripeController.verifyCheckoutSession));

// Stripe webhook endpoint (não requer autenticação - usa assinatura do Stripe)
router.post('/webhook', asyncHandler(stripeController.handleWebhook));

export default router;

