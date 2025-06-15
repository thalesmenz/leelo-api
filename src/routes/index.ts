import { Router } from 'express';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router; 