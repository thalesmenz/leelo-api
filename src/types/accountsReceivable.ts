export interface AccountsReceivable {
  id: string;
  user_id: string;
  name: string;
  description: string;
  amount: number;
  due_date: string;
  receive_date?: string;
  status: 'pendente' | 'recebido';
  category?: string;
  created_at: string;
}

export interface CreateAccountsReceivableDTO {
  user_id: string;
  name: string;
  description: string;
  amount: number;
  due_date: string;
  receive_date?: string;
  status?: 'pendente' | 'recebido';
  category?: string;
}

export interface UpdateAccountsReceivableDTO {
  name?: string;
  description?: string;
  amount?: number;
  due_date?: string;
  receive_date?: string;
  status?: 'pendente' | 'recebido';
  category?: string;
}

export interface AccountsReceivableFilters {
  user_id?: string;
  status?: 'pendente' | 'recebido';
  category?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
} 