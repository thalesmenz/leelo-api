import { Router, Request, Response, NextFunction } from 'express';
import { AnamneseQuestionController } from '../controllers/AnamneseQuestionController';

const router = Router();
const anamneseQuestionController = new AnamneseQuestionController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn.call(anamneseQuestionController, req, res, next)).catch(next);
  };
}

// Create new anamnese question
router.post('/', asyncHandler(anamneseQuestionController.createAnamneseQuestion));

// Get all anamnese questions with filters
router.get('/', asyncHandler(anamneseQuestionController.getAnamneseQuestions));

// Get anamnese question by ID
router.get('/:id', asyncHandler(anamneseQuestionController.getAnamneseQuestionById));

// Get anamnese questions by user ID
router.get('/user/:user_id', asyncHandler(anamneseQuestionController.getAnamneseQuestionsByUserId));

// Update anamnese question
router.put('/:id', asyncHandler(anamneseQuestionController.updateAnamneseQuestion));

// Delete anamnese question
router.delete('/:id', asyncHandler(anamneseQuestionController.deleteAnamneseQuestion));

// Reorder questions
router.patch('/user/:user_id/reorder', asyncHandler(anamneseQuestionController.reorderQuestions));

// Get questions by category
router.get('/user/:user_id/category/:category', asyncHandler(anamneseQuestionController.getQuestionsByCategory));

// Search questions
router.get('/user/:user_id/search', asyncHandler(anamneseQuestionController.searchQuestions));

// Get statistics by user
router.get('/user/:user_id/statistics', asyncHandler(anamneseQuestionController.getStatistics));

export default router;

