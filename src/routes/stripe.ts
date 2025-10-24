import { Router, Request, Response, NextFunction } from 'express';
import { StripeController } from '../controllers/StripeController';

const router = Router();
const stripeController = new StripeController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Create new payment intent
router.post('/payment-intent', asyncHandler(stripeController.createPaymentIntent));

// Get all payment intents with filters
router.get('/payment-intents', asyncHandler(stripeController.getPaymentIntents));

// Get payment intent by ID
router.get('/payment-intent/:id', asyncHandler(stripeController.getPaymentIntentById));

// Update payment intent
router.put('/payment-intent/:id', asyncHandler(stripeController.updatePaymentIntent));

// Delete payment intent
router.delete('/payment-intent/:id', asyncHandler(stripeController.deletePaymentIntent));

// Get statistics by user
router.get('/user/:user_id/statistics', asyncHandler(stripeController.getStatistics));

// Stripe webhook endpoint
router.post('/webhook', asyncHandler(stripeController.handleWebhook));

export default router;
