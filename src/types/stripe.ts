export interface PaymentIntent {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  description?: string;
  metadata?: Record<string, string>;
  created_at: string;
}

export interface CreatePaymentIntentDTO {
  user_id: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface UpdatePaymentIntentDTO {
  amount?: number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentFilters {
  user_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface PaymentResult {
  success: boolean;
  payment_intent_id?: string;
  client_secret?: string;
  error?: string;
  message?: string;
}
