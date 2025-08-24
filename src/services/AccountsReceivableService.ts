import { supabase } from '../config/supabase';
import { 
  AccountsReceivable, 
  CreateAccountsReceivableDTO, 
  UpdateAccountsReceivableDTO, 
  AccountsReceivableFilters 
} from '../types/accountsReceivable';
import { TransactionService } from './TransactionService';

export class AccountsReceivableService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async createAccountsReceivable(data: CreateAccountsReceivableDTO): Promise<AccountsReceivable> {
    const { data: receivable, error } = await supabase
      .from('accounts_receivable')
      .insert({
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        receive_date: data.receive_date,
        status: data.status || 'pendente',
        category: data.category
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return receivable;
  }

  async getAccountsReceivable(filters?: AccountsReceivableFilters): Promise<AccountsReceivable[]> {
    let query = supabase
      .from('accounts_receivable')
      .select(`
        *,
        user:users_accounts(name, email)
      `)
      .order('due_date', { ascending: true });

    // user_id é obrigatório para filtrar por usuário
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.start_date) {
      query = query.gte('due_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('due_date', filters.end_date);
    }

    if (filters?.min_amount) {
      query = query.gte('amount', filters.min_amount);
    }

    if (filters?.max_amount) {
      query = query.lte('amount', filters.max_amount);
    }

    const { data: receivables, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return receivables || [];
  }

  async getAccountsReceivableById(id: string): Promise<AccountsReceivable | null> {
    const { data: receivable, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return receivable;
  }

  async updateAccountsReceivable(id: string, data: UpdateAccountsReceivableDTO): Promise<AccountsReceivable> {
    // Se o status está sendo alterado para 'pendente', verificar se existe uma transação para excluir
    if (data.status === 'pendente') {
      try {
        // Verificar se existe uma transação vinculada a esta conta
        const existingTransaction = await this.transactionService.getTransactionByOriginId(id, 'conta_a_receber');
        if (existingTransaction) {
          // Excluir a transação
          await this.transactionService.deleteTransactionByOriginId(id, 'conta_a_receber');
        }
      } catch (transactionError) {
        // Log do erro, mas não falhar a atualização da conta
      }
    }

    const updateData: any = { ...data };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: receivable, error } = await supabase
      .from('accounts_receivable')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return receivable;
  }

  async deleteAccountsReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async markAsReceived(id: string, receive_date?: string): Promise<AccountsReceivable> {
    // Primeiro, buscar a conta a receber para obter os dados necessários
    const receivable = await this.getAccountsReceivableById(id);
    if (!receivable) {
      throw new Error('Conta a receber não encontrada');
    }

    // Atualizar o status da conta a receber
    const { data: updatedReceivable, error } = await supabase
      .from('accounts_receivable')
      .update({
        status: 'recebido',
        receive_date: receive_date || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Criar transação de entrada automaticamente
    try {
      await this.transactionService.createTransaction({
        user_id: receivable.user_id,
        date: receive_date || new Date().toISOString().split('T')[0],
        type: 'entrada',
        origin: 'conta_a_receber',
        origin_id: id,
        description: `Recebimento: ${receivable.name}`,
        amount: receivable.amount
      });
    } catch (transactionError) {
      // Se falhar ao criar a transação, reverter o status da conta
      await supabase
        .from('accounts_receivable')
        .update({
          status: 'pendente',
          receive_date: null
        })
        .eq('id', id);
      
      throw new Error(`Erro ao criar transação: ${transactionError instanceof Error ? transactionError.message : 'Erro desconhecido'}`);
    }

    return updatedReceivable;
  }

  async getStatistics(user_id: string) {
    const { data: receivables, error } = await supabase
      .from('accounts_receivable')
      .select('amount, status, due_date')
      .eq('user_id', user_id);

    if (error) {
      throw new Error(error.message);
    }

    const total = receivables?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const received = receivables?.filter(item => item.status === 'recebido').reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const pending = receivables?.filter(item => item.status === 'pendente').reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    return {
      total,
      received,
      pending,
      count: receivables?.length || 0
    };
  }

  async searchByName(user_id: string, name: string): Promise<AccountsReceivable[]> {
    const { data: receivables, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('user_id', user_id)
      .ilike('name', `%${name}%`)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return receivables || [];
  }
} 