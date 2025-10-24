import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { CreatePaymentIntentDTO, UpdatePaymentIntentDTO } from '../types/stripe';

export class StripeController {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  createPaymentIntent = async (req: Request, res: Response) => {
    try {
      const paymentData: CreatePaymentIntentDTO = req.body;
      if (!paymentData.user_id || !paymentData.amount) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id e amount são obrigatórios.' 
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

  getPaymentIntents = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      if (!filters.user_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id é obrigatório para buscar Payment Intents.' 
        });
      }
      const paymentIntents = await this.stripeService.getPaymentIntents(filters);
      res.status(200).json({ success: true, data: paymentIntents });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar Payment Intents.' 
      });
    }
  };

  getPaymentIntentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const paymentIntent = await this.stripeService.getPaymentIntentById(id);
      if (!paymentIntent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment Intent não encontrado.' 
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

  updatePaymentIntent = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: UpdatePaymentIntentDTO = req.body;
      const paymentIntent = await this.stripeService.updatePaymentIntent(id, updateData);
      res.status(200).json({ 
        success: true, 
        message: 'Payment Intent atualizado com sucesso!', 
        data: paymentIntent 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao atualizar Payment Intent.' 
      });
    }
  };

  deletePaymentIntent = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
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

  getStatistics = async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;
      if (!user_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id é obrigatório para buscar estatísticas.' 
        });
      }
      const statistics = await this.stripeService.getStatistics(user_id);
      res.status(200).json({ success: true, data: statistics });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message || 'Erro ao buscar estatísticas.' 
      });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).json({ 
          success: false, 
          message: 'Stripe signature ou webhook secret não encontrados.' 
        });
      }

      // Verificar a assinatura do webhook
      const { stripe } = await import('../config/stripe');
      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

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
