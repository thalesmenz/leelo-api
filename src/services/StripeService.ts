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
  // ===================== SUBSCRIPTIONS =====================
  private mapStripeSubscriptionStatus(status: string): string {
    // Mantemos o status original para simplicidade e compatibilidade com enum criado
    return status;
  }

  private async upsertSubscriptionFromStripeObject(stripeSub: any, userId?: string, planName?: string) {
    const subscriptionId: string = stripeSub.id;
    const customerId: string = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id;
    const status: string = this.mapStripeSubscriptionStatus(stripeSub.status);
    const currentPeriodStart = stripeSub.current_period_start ? new Date(stripeSub.current_period_start * 1000).toISOString() : null;
    const currentPeriodEnd = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000).toISOString() : null;
    const cancelAtPeriodEnd = Boolean(stripeSub.cancel_at_period_end);
    const canceledAt = stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000).toISOString() : null;

    // Tentar descobrir user_id via metadata quando não informado
    const resolvedUserId = userId || stripeSub.metadata?.user_id || null;

    if (!resolvedUserId) {
      console.warn('⚠️ Subscription sem user_id no metadata. Pulando persistência:', subscriptionId);
      return;
    }

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    const payload: any = {
      user_id: resolvedUserId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      plan_name: planName || stripeSub.metadata?.plan_name || 'Plano',
      status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: canceledAt,
      metadata: stripeSub.metadata || null,
    };

    if (existing) {
      const { error: updError } = await supabase
        .from('subscriptions')
        .update(payload)
        .eq('stripe_subscription_id', subscriptionId);
      if (updError) {
        console.error('❌ Erro ao atualizar subscription:', updError);
      } else {
        console.log('✅ Subscription atualizada no banco:', subscriptionId);
      }
    } else {
      const { error: insError } = await supabase
        .from('subscriptions')
        .insert(payload);
      if (insError) {
        console.error('❌ Erro ao criar subscription:', insError);
      } else {
        console.log('✅ Subscription criada no banco:', subscriptionId);
      }
    }
  }

  async getSubscriptionByUserId(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data || null;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) throw new Error('Assinatura não encontrada para o usuário.');

    // Cancelar na Stripe ao final do período
    const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await this.upsertSubscriptionFromStripeObject(updated, userId);
    return { cancel_at_period_end: true };
  }
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
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!paymentIntent) {
      console.warn(`⚠️ Payment Intent ${stripePaymentIntentId} não encontrado para update. Ignorando.`);
      // Retornar objeto fake só para manter assinatura do método
      return {
        id: '', user_id: '', stripe_payment_intent_id: stripePaymentIntentId,
        amount: 0, currency: 'brl', status, created_at: new Date().toISOString(),
      } as unknown as PaymentIntent;
    }
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
        // Garantir que a Subscription receba o metadata quando for recorrente
        ...(mode === 'subscription'
          ? {
              subscription_data: {
                metadata: {
                  user_id: data.user_id,
                  plan_name: data.plan_name,
                },
              },
            }
          : {}),
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📥 Webhook recebido: ${event.type}`);
      console.log(`🆔 Event ID: ${event.id}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Processar eventos de Payment Intent
      if (event.type.startsWith('payment_intent.')) {
        const paymentIntent = event.data.object;
        const stripePaymentIntentId = paymentIntent.id;

        console.log(`💳 Payment Intent ID: ${stripePaymentIntentId}`);
        console.log(`📊 Status: ${paymentIntent.status}`);
        console.log(`💰 Amount: ${paymentIntent.amount / 100}`);

        // Atualizar status no banco de dados
        await this.updatePaymentIntentStatus(stripePaymentIntentId, paymentIntent.status);
        console.log(`✅ Payment Intent atualizado no banco de dados`);
      }

      // Processar eventos de Checkout Session
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { user_id, plan_name } = session.metadata || {};

        console.log(`🛒 Checkout Session ID: ${session.id}`);
        console.log(`👤 User ID: ${user_id || 'N/A'}`);
        console.log(`📦 Plan: ${plan_name || 'N/A'}`);
        console.log(`💳 Payment Status: ${session.payment_status}`);
        console.log(`📊 Session Status: ${session.status}`);

        // Verificar se o pagamento foi bem-sucedido
        if (session.payment_status === 'paid' || session.status === 'complete') {
          const amount = session.amount_total ? session.amount_total / 100 : (session.amount_subtotal ? session.amount_subtotal / 100 : 0);
          console.log(`💰 Amount Total: R$ ${amount}`);
          
          // Buscar ou criar Payment Intent no banco
          const paymentIntentId = session.payment_intent || `checkout_${session.id}`;
          
          // Verificar se já existe
          const existingPaymentIntent = await this.getPaymentIntentByStripeId(paymentIntentId);
          
          if (!existingPaymentIntent) {
            // Criar novo Payment Intent no banco
            const { error } = await supabase.from('payment_intents').insert({
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
            
            if (error) {
              console.error(`❌ Erro ao criar Payment Intent:`, error);
            } else {
              console.log(`✅ Payment Intent criado no banco: ${paymentIntentId}`);
            }
          } else {
            // Atualizar status se já existir
            await this.updatePaymentIntentStatus(paymentIntentId, 'succeeded');
            console.log(`✅ Payment Intent atualizado no banco: ${paymentIntentId}`);
          }
        }
      }

      // Processar eventos de Subscription (criação/atualização/cancelamento)
      if (event.type === 'customer.subscription.created' ||
          event.type === 'customer.subscription.updated' ||
          event.type === 'customer.subscription.deleted') {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id; // se foi passada adiante
        const planName = sub.metadata?.plan_name;
        await this.upsertSubscriptionFromStripeObject(sub, userId, planName);
      }

      // Renovação paga com sucesso (atualiza período)
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await this.upsertSubscriptionFromStripeObject(sub);
        }
      }
      
      console.log(`✅ Webhook processado com sucesso`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error: any) {
      console.error('❌ Erro ao processar webhook do Stripe:', error);
      console.error('📋 Stack trace:', error.stack);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }
}
