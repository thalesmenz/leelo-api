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

  async handleWebhookEvent(event: any): Promise<void> {
    try {
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
    } catch (error: any) {
      console.error('Erro ao processar webhook do Stripe:', error);
      throw error;
    }
  }
}
