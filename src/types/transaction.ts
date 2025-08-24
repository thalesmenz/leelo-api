export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: 'entrada' | 'saida';
  origin: 'agendamento' | 'conta_a_receber' | 'conta_a_pagar' | 'manual';
  origin_id?: string | null;
  description?: string;
  amount: number;
  created_at: string;
}

export type CreateTransactionDTO = Omit<Transaction, 'id' | 'created_at'>;
export type UpdateTransactionDTO = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>; 