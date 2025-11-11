import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { StripeService } from '../services/StripeService';

const stripeService = new StripeService();

/**
 * Middleware que verifica se o usuário possui uma assinatura ativa.
 * Retorna 403 se não tiver assinatura ou se estiver inativa.
 */
export const requireSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado.'
      });
      return;
    }

    // Buscar subscription do usuário
    const subscription = await stripeService.getSubscriptionByUserId(req.user.id);

    // Verificar se existe e está ativa
    if (!subscription) {
      res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Assinatura necessária para acessar este recurso. Por favor, assine um plano para continuar.'
      });
      return;
    }

    // Status válidos: active, trialing
    // Status inválidos: canceled, past_due, incomplete, incomplete_expired, unpaid
    const validStatuses = ['active', 'trialing'];
    
    if (!validStatuses.includes(subscription.status)) {
      res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: `Sua assinatura está com status "${subscription.status}". Por favor, regularize sua assinatura para continuar acessando.`
      });
      return;
    }

    // Verificar se está marcada para cancelar ao final do período (ainda válida até lá)
    // Se cancel_at_period_end = true mas ainda está no período, permite acesso
    if (subscription.cancel_at_period_end) {
      const periodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end) 
        : null;
      const now = new Date();

      // Se já passou do período de fim, não permite acesso
      if (periodEnd && now > periodEnd) {
        res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Sua assinatura foi cancelada. Por favor, assine um novo plano para continuar.'
        });
        return;
      }
    }

    // Tudo OK, permite acesso
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar assinatura.'
    });
  }
};

