export interface AccountsPayable {
  id: string;
  user_id: string;
  name: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pendente' | 'pago';
  category?: string;
  created_at: string;
}

export interface CreateAccountsPayableDTO {
  user_id: string;
  name: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status?: 'pendente' | 'pago';
  category?: string;
}

export interface UpdateAccountsPayableDTO {
  name?: string;
  description?: string;
  amount?: number;
  due_date?: string;
  payment_date?: string;
  status?: 'pendente' | 'pago';
  category?: string;
}

export interface AccountsPayableFilters {
  user_id?: string;
  status?: 'pendente' | 'pago';
  category?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
} 