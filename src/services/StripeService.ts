import { stripe } from '../config/stripe';
import { supabase } from '../config/supabase';
import { 
  PaymentIntent, 
  CreatePaymentIntentDTO, 
  UpdatePaymentIntentDTO, 
  PaymentIntentFilters,
  PaymentResult 
} from '../types/stripe';

export class StripeService {
  async createPaymentIntent(data: CreatePaymentIntentDTO): Promise<PaymentResult> {
    try {
      // Criar Payment Intent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount * 100, // Converter para centavos
        currency: data.currency || 'brl',
        description: data.description,
        metadata: {
          user_id: data.user_id,
          ...data.metadata
        }
      });

      // Salvar no banco de dados
      const { data: savedPaymentIntent, error } = await supabase
        .from('payment_intents')
        .insert({
          user_id: data.user_id,
          stripe_payment_intent_id: paymentIntent.id,
          amount: data.amount,
          currency: data.currency || 'brl',
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          description: data.description,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        payment_intent_id: savedPaymentIntent.id,
        client_secret: paymentIntent.client_secret || undefined,
        message: 'Payment Intent criado com sucesso'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Erro ao criar Payment Intent'
      };
    }
  }

  async getPaymentIntents(filters: PaymentIntentFilters = {}): Promise<PaymentIntent[]> {
    let query = supabase
      .from('payment_intents')
      .select(`
        *,
        user:users_accounts(name, email)
      `);

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.start_date) query = query.gte('created_at', filters.start_date);
    if (filters.end_date) query = query.lte('created_at', filters.end_date);
    if (filters.min_amount) query = query.gte('amount', filters.min_amount);
    if (filters.max_amount) query = query.lte('amount', filters.max_amount);

    query = query.order('created_at', { ascending: false });

    const { data: paymentIntents, error } = await query;
    if (error) throw new Error(error.message);
    return paymentIntents || [];
  }

  async getPaymentIntentById(id: string): Promise<PaymentIntent | null> {
    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return paymentIntent;
  }

  async getPaymentIntentByStripeId(stripePaymentIntentId: string): Promise<PaymentIntent | null> {
    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return paymentIntent;
  }

  async updatePaymentIntent(id: string, data: UpdatePaymentIntentDTO): Promise<PaymentIntent> {
    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return paymentIntent;
  }

  async updatePaymentIntentStatus(stripePaymentIntentId: string, status: string): Promise<PaymentIntent> {
    const { data: paymentIntent, error } = await supabase
      .from('payment_intents')
      .update({ status })
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return paymentIntent;
  }

  async deletePaymentIntent(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_intents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getStatistics(user_id: string) {
    const { data: paymentIntents, error } = await supabase
      .from('payment_intents')
      .select('amount, status, created_at')
      .eq('user_id', user_id);

    if (error) throw new Error(error.message);

    const totalAmount = paymentIntents?.reduce((sum, pi) => sum + pi.amount, 0) || 0;
    const succeededAmount = paymentIntents
      ?.filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + pi.amount, 0) || 0;
    const pendingAmount = paymentIntents
      ?.filter(pi => ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(pi.status))
      .reduce((sum, pi) => sum + pi.amount, 0) || 0;

    return {
      total_amount: totalAmount,
      succeeded_amount: succeededAmount,
      pending_amount: pendingAmount,
      success_rate: totalAmount > 0 ? (succeededAmount / totalAmount) * 100 : 0,
      count: paymentIntents?.length || 0
    };
  }

  async createCheckoutSession(data: {
    user_id: string;
    plan_name: string;
    amount?: number;
    price_id?: string; // Price ID da Stripe
    success_url: string;
    cancel_url: string;
    billing_period?: 'monthly' | 'yearly';
  }): Promise<{ url: string }> {
    try {
      const lineItems: any[] = [];

      // Se tiver price_id, usar ele (planos criados na Stripe)
      if (data.price_id) {
        lineItems.push({
          price: data.price_id,
          quantity: 1,
        });
      } else if (data.amount) {
        // Se não tiver price_id, criar dinamicamente (fallback)
        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: {
              name: data.plan_name,
            },
            unit_amount: Math.round(data.amount * 100), // Converter para centavos
            recurring: data.billing_period === 'yearly' 
              ? { interval: 'year' } 
              : data.billing_period === 'monthly'
              ? { interval: 'month' }
              : undefined,
          },
          quantity: 1,
        });
      } else {
        throw new Error('price_id ou amount são obrigatórios');
      }

      // Se usar price_id, verificar se é subscription ou payment único
      let mode: 'payment' | 'subscription' = 'payment';
      if (data.price_id) {
        // Tentar buscar o price para verificar se é recurring
        try {
          const price = await stripe.prices.retrieve(data.price_id);
          mode = price.type === 'recurring' ? 'subscription' : 'payment';
        } catch (error) {
          // Se falhar, usar billing_period como fallback
          mode = data.billing_period ? 'subscription' : 'payment';
        }
      } else if (data.billing_period) {
        mode = 'subscription';
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode,
        success_url: data.success_url,
        cancel_url: data.cancel_url,
        metadata: {
          user_id: data.user_id,
          plan_name: data.plan_name,
        },
      });

      return { url: session.url || '' };
    } catch (error: any) {
      throw new Error(`Erro ao criar Checkout Session: ${error.message}`);
    }
  }

  async verifyCheckoutSession(sessionId: string, userId: string): Promise<{
    success: boolean;
    status?: string;
    payment_status?: string;
    amount_total?: number;
    currency?: string;
    customer_email?: string;
    plan_name?: string;
    subscription_id?: string;
    error?: string;
  }> {
    try {
      // Buscar sessão no Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verificar se a sessão pertence ao usuário
      if (session.metadata?.user_id !== userId) {
        return {
          success: false,
          error: 'Sessão não pertence ao usuário autenticado'
        };
      }

      // Retornar dados da sessão
      return {
        success: true,
        status: session.status || undefined,
        payment_status: session.payment_status,
        amount_total: session.amount_total ? session.amount_total / 100 : undefined,
        currency: session.currency || undefined,
        customer_email: session.customer_email || session.customer_details?.email || undefined,
        plan_name: session.metadata?.plan_name || undefined,
        subscription_id: session.subscription as string || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao verificar sessão'
      };
    }
  }

  async handleWebhookEvent(event: any): Promise<void> {
    try {
      // Processar eventos de Payment Intent
      if (event.type.startsWith('payment_intent.')) {
        const paymentIntent = event.data.object;
        const stripePaymentIntentId = paymentIntent.id;

        // Atualizar status no banco de dados
        await this.updatePaymentIntentStatus(stripePaymentIntentId, paymentIntent.status);

        // Se o pagamento foi bem-sucedido, criar transação automaticamente
        if (paymentIntent.status === 'succeeded') {
          const localPaymentIntent = await this.getPaymentIntentByStripeId(stripePaymentIntentId);
          
          if (localPaymentIntent) {
            // Importar TransactionService aqui para evitar dependência circular
            const { TransactionService } = await import('./TransactionService');
            const transactionService = new TransactionService();

            await transactionService.createTransaction({
              user_id: localPaymentIntent.user_id,
              date: new Date().toISOString().split('T')[0],
              type: 'entrada',
              origin: 'stripe_payment' as any,
              origin_id: localPaymentIntent.id,
              description: `Pagamento Stripe - ${localPaymentIntent.description || 'Pagamento online'}`,
              amount: localPaymentIntent.amount
            });
          }
        }
      }

      // Processar eventos de Checkout Session
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { user_id, plan_name } = session.metadata || {};

        // Verificar se o pagamento foi bem-sucedido
        if (session.payment_status === 'paid' || session.status === 'complete') {
          const amount = session.amount_total ? session.amount_total / 100 : (session.amount_subtotal ? session.amount_subtotal / 100 : 0);
          
          // Buscar ou criar Payment Intent no banco
          const paymentIntentId = session.payment_intent || `checkout_${session.id}`;
          
          // Verificar se já existe
          const existingPaymentIntent = await this.getPaymentIntentByStripeId(paymentIntentId);
          
          if (!existingPaymentIntent) {
            // Criar novo Payment Intent no banco
            await supabase.from('payment_intents').insert({
              user_id: user_id || '',
              stripe_payment_intent_id: paymentIntentId,
              amount,
              currency: session.currency || 'brl',
              status: 'succeeded',
              client_secret: null,
              description: plan_name || `Pagamento Stripe - Checkout Session`,
              metadata: {
                checkout_session_id: session.id,
                ...(plan_name && { plan_name }),
                mode: session.mode,
              }
            });
          } else {
            // Atualizar status se já existir
            await this.updatePaymentIntentStatus(paymentIntentId, 'succeeded');
          }

          // Criar transação automaticamente
          if (user_id && amount > 0) {
            const { TransactionService } = await import('./TransactionService');
            const transactionService = new TransactionService();

            await transactionService.createTransaction({
              user_id,
              date: new Date().toISOString().split('T')[0],
              type: 'entrada',
              origin: 'stripe_payment' as any,
              origin_id: paymentIntentId,
              description: plan_name || `Pagamento Stripe - Checkout Session`,
              amount
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar webhook do Stripe:', error);
      throw error;
    }
  }
}
