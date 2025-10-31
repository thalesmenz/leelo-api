import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { CreatePaymentIntentDTO, UpdatePaymentIntentDTO } from '../types/stripe';
import { AuthenticatedRequest } from '../middleware/auth';

export class StripeController {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentData: CreatePaymentIntentDTO = {
        ...req.body,
        user_id: req.user!.id // Usar user_id do token JWT
      };
      
      if (!paymentData.amount) {
        return res.status(400).json({ 
          success: false, 
          message: 'amount é obrigatório.' 
        });
      }

      if (paymentData.amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valor deve ser maior que zero.' 
        });
      }

      const result = await this.stripeService.createPaymentIntent(paymentData);
      
      if (result.success) {
        res.status(201).json({ 
          success: true, 
          message: result.message, 
          data: {
            payment_intent_id: result.payment_intent_id,
            client_secret: result.client_secret
          }
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.message,
          error: result.error
        });
      }
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao criar Payment Intent.' 
      });
    }
  };

  getPaymentIntents = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = {
        ...req.query,
        user_id: req.user!.id // Usar user_id do token JWT
      };
      const paymentIntents = await this.stripeService.getPaymentIntents(filters);
      res.status(200).json({ success: true, data: paymentIntents });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar Payment Intents.' 
      });
    }
  };

  getPaymentIntentById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const paymentIntent = await this.stripeService.getPaymentIntentById(id);
      if (!paymentIntent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment Intent não encontrado.' 
        });
      }
      
      // Verificar se o payment intent pertence ao usuário autenticado
      if (paymentIntent.user_id !== req.user!.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado.' 
        });
      }
      
      res.status(200).json({ success: true, data: paymentIntent });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar Payment Intent.' 
      });
    }
  };

  updatePaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se o payment intent pertence ao usuário autenticado
      const paymentIntent = await this.stripeService.getPaymentIntentById(id);
      if (!paymentIntent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment Intent não encontrado.' 
        });
      }
      
      if (paymentIntent.user_id !== req.user!.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado.' 
        });
      }
      
      const updateData: UpdatePaymentIntentDTO = req.body;
      const updatedPaymentIntent = await this.stripeService.updatePaymentIntent(id, updateData);
      res.status(200).json({ 
        success: true, 
        message: 'Payment Intent atualizado com sucesso!', 
        data: updatedPaymentIntent 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao atualizar Payment Intent.' 
      });
    }
  };

  deletePaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verificar se o payment intent pertence ao usuário autenticado
      const paymentIntent = await this.stripeService.getPaymentIntentById(id);
      if (!paymentIntent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment Intent não encontrado.' 
        });
      }
      
      if (paymentIntent.user_id !== req.user!.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado.' 
        });
      }
      
      await this.stripeService.deletePaymentIntent(id);
      res.status(200).json({ 
        success: true, 
        message: 'Payment Intent excluído com sucesso!' 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao excluir Payment Intent.' 
      });
    }
  };

  getStatistics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const statistics = await this.stripeService.getStatistics(req.user!.id);
      res.status(200).json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar estatísticas.' 
      });
    }
  };

  createCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plan_name, amount, price_id, success_url, cancel_url, billing_period } = req.body;

      if (!plan_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'plan_name é obrigatório.' 
        });
      }

      if (!price_id && !amount) {
        return res.status(400).json({ 
          success: false, 
          message: 'price_id ou amount são obrigatórios.' 
        });
      }

      if (amount && amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Valor deve ser maior que zero.' 
        });
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const session = await this.stripeService.createCheckoutSession({
        user_id: req.user!.id, // Usar user_id do token JWT
        plan_name,
        amount,
        price_id,
        billing_period,
        success_url: success_url || `${baseUrl}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url || `${baseUrl}/plans`,
      });

      res.status(200).json({ 
        success: true, 
        message: 'Checkout Session criada com sucesso!', 
        data: { url: session.url } 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao criar Checkout Session.' 
      });
    }
  };

  verifyCheckoutSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { session_id } = req.params;

      if (!session_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'session_id é obrigatório.' 
        });
      }

      const result = await this.stripeService.verifyCheckoutSession(session_id, req.user!.id);

      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: result.error || 'Erro ao verificar sessão.' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Sessão verificada com sucesso!', 
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao verificar sessão.' 
      });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const sig = req.get('stripe-signature');
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stripe signature ou webhook secret não encontrados.' 
        });
      }

      // Verificar a assinatura do webhook
      const { stripe } = await import('../config/stripe');
      
      // O body deve ser raw para validação do webhook
      // Certifique-se de que o body está como string ou buffer
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

      // Processar o evento
      await this.stripeService.handleWebhookEvent(event);

      res.status(200).json({ success: true, message: 'Webhook processado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao processar webhook:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao processar webhook.' 
      });
    }
  };
}

