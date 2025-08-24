import { supabase } from '../config/supabase';
import { 
  AccountsPayable, 
  CreateAccountsPayableDTO, 
  UpdateAccountsPayableDTO, 
  AccountsPayableFilters 
} from '../types/accountsPayable';
import { TransactionService } from './TransactionService';

export class AccountsPayableService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async createAccountsPayable(data: CreateAccountsPayableDTO): Promise<AccountsPayable> {
    const { data: payable, error } = await supabase
      .from('accounts_payable')
      .insert({
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        payment_date: data.payment_date,
        status: data.status || 'pendente',
        category: data.category
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return payable;
  }

  async getAccountsPayable(filters?: AccountsPayableFilters): Promise<AccountsPayable[]> {
    let query = supabase
      .from('accounts_payable')
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

    const { data: payables, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return payables || [];
  }

  async getAccountsPayableById(id: string): Promise<AccountsPayable | null> {
    const { data: payable, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return payable;
  }

  async updateAccountsPayable(id: string, data: UpdateAccountsPayableDTO): Promise<AccountsPayable> {
    // Se o status está sendo alterado para 'pendente', verificar se existe uma transação para excluir
    if (data.status === 'pendente') {
      try {
        // Verificar se existe uma transação vinculada a esta conta
        const existingTransaction = await this.transactionService.getTransactionByOriginId(id, 'conta_a_pagar');
        if (existingTransaction) {
          // Excluir a transação
          await this.transactionService.deleteTransactionByOriginId(id, 'conta_a_pagar');
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

    const { data: payable, error } = await supabase
      .from('accounts_payable')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return payable;
  }

  async deleteAccountsPayable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async markAsPaid(id: string, payment_date?: string): Promise<AccountsPayable> {
    // Primeiro, buscar a conta a pagar para obter os dados necessários
    const payable = await this.getAccountsPayableById(id);
    if (!payable) {
      throw new Error('Conta a pagar não encontrada');
    }

    // Atualizar o status da conta a pagar
    const { data: updatedPayable, error } = await supabase
      .from('accounts_payable')
      .update({
        status: 'pago',
        payment_date: payment_date || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Criar transação de saída automaticamente
    try {
      await this.transactionService.createTransaction({
        user_id: payable.user_id,
        date: payment_date || new Date().toISOString().split('T')[0],
        type: 'saida',
        origin: 'conta_a_pagar',
        origin_id: id,
        description: `Pagamento: ${payable.name}`,
        amount: payable.amount
      });
    } catch (transactionError) {
      // Se falhar ao criar a transação, reverter o status da conta
      await supabase
        .from('accounts_payable')
        .update({
          status: 'pendente',
          payment_date: null
        })
        .eq('id', id);
      
      throw new Error(`Erro ao criar transação: ${transactionError instanceof Error ? transactionError.message : 'Erro desconhecido'}`);
    }

    return updatedPayable;
  }

  async getStatistics(user_id: string) {
    const { data: payables, error } = await supabase
      .from('accounts_payable')
      .select('amount, status, due_date')
      .eq('user_id', user_id);

    if (error) {
      throw new Error(error.message);
    }

    const total = payables?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const paid = payables?.filter(item => item.status === 'pago').reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const pending = payables?.filter(item => item.status === 'pendente').reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    return {
      total,
      paid,
      pending,
      count: payables?.length || 0
    };
  }

  async searchByName(user_id: string, name: string): Promise<AccountsPayable[]> {
    const { data: payables, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('user_id', user_id)
      .ilike('name', `%${name}%`)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return payables || [];
  }
} 