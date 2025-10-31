import { Router, Request, Response, NextFunction } from 'express';
import { WorkScheduleController } from '../controllers/WorkScheduleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new WorkScheduleController();

function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Aplicar autenticação em todas as rotas de horários de trabalho
// Lista toda a configuração semanal do usuário
router.get('/:user_id', authenticateToken, asyncHandler(controller.getAll.bind(controller)));
// Busca a configuração de um dia específico
router.get('/:user_id/:weekday', authenticateToken, asyncHandler(controller.getDay.bind(controller)));
// Upsert de todos os dias (array)
router.put('/:user_id', authenticateToken, asyncHandler(controller.upsertMany.bind(controller)));
// Atualiza um dia específico
router.patch('/:user_id/:weekday', authenticateToken, asyncHandler(controller.updateDay.bind(controller)));
// Remove um dia específico
router.delete('/:user_id/:weekday', authenticateToken, asyncHandler(controller.deleteDay.bind(controller)));

export default router; 