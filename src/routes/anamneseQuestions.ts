import { Router, Request, Response, NextFunction } from 'express';
import { AnamneseQuestionController } from '../controllers/AnamneseQuestionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const anamneseQuestionController = new AnamneseQuestionController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn.call(anamneseQuestionController, req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de perguntas de anamnese
// Create new anamnese question
router.post('/', authenticateToken, asyncHandler(anamneseQuestionController.createAnamneseQuestion));

// Get all anamnese questions with filters
router.get('/', authenticateToken, asyncHandler(anamneseQuestionController.getAnamneseQuestions));

// Get anamnese question by ID
router.get('/:id', authenticateToken, asyncHandler(anamneseQuestionController.getAnamneseQuestionById));

// Get anamnese questions by user ID
router.get('/user/:user_id', authenticateToken, asyncHandler(anamneseQuestionController.getAnamneseQuestionsByUserId));

// Update anamnese question
router.put('/:id', authenticateToken, asyncHandler(anamneseQuestionController.updateAnamneseQuestion));

// Delete anamnese question
router.delete('/:id', authenticateToken, asyncHandler(anamneseQuestionController.deleteAnamneseQuestion));

// Reorder questions
router.patch('/user/:user_id/reorder', authenticateToken, asyncHandler(anamneseQuestionController.reorderQuestions));

// Get questions by category
router.get('/user/:user_id/category/:category', authenticateToken, asyncHandler(anamneseQuestionController.getQuestionsByCategory));

// Search questions
router.get('/user/:user_id/search', authenticateToken, asyncHandler(anamneseQuestionController.searchQuestions));

// Get statistics by user
router.get('/user/:user_id/statistics', authenticateToken, asyncHandler(anamneseQuestionController.getStatistics));

export default router;

