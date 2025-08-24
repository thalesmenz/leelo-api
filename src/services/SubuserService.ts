import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

export class SubuserService {
  async createSubuser(subuserData: any) {
    if (!subuserData.parent_id) {
      throw new Error('parent_id é obrigatório para criar um subusuário.');
    }

    // Verifica se o usuário pai existe
    const { data: parentUser } = await supabase
      .from('users_accounts')
      .select('id')
      .eq('id', subuserData.parent_id)
      .single();
    
    if (!parentUser) {
      throw new Error('Usuário pai não encontrado.');
    }

    // Verifica se o e-mail já está cadastrado
    const { data: existing } = await supabase
      .from('users_accounts')
      .select('id')
      .eq('email', subuserData.email)
      .single();
    
    if (existing) {
      throw new Error('E-mail já cadastrado.');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(subuserData.password, 10);

    // Cria o subusuário
    const { data, error } = await supabase
      .from('users_accounts')
      .insert({
        email: subuserData.email,
        name: subuserData.name,
        password: hashedPassword,
        is_subuser: true,
        parent_id: subuserData.parent_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao criar subusuário.');
    }

    return data;
  }

  async getSubusersByParentId(parentId: string) {
    const { data, error } = await supabase
      .from('users_accounts')
      .select('id, email, name, created_at, is_subuser, parent_id')
      .eq('parent_id', parentId)
      .eq('is_subuser', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Erro ao buscar subusuários.');
    }

    return data || [];
  }

  async getSubuserById(id: string) {
    const { data, error } = await supabase
      .from('users_accounts')
      .select('id, email, name, created_at, is_subuser, parent_id')
      .eq('id', id)
      .eq('is_subuser', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message || 'Erro ao buscar subusuário.');
    }

    return data;
  }

  async updateSubuser(id: string, subuserData: any) {
    // Verifica se o subusuário existe
    const existingSubuser = await this.getSubuserById(id);
    if (!existingSubuser) {
      throw new Error('Subusuário não encontrado.');
    }

    // Se estiver atualizando o e-mail, verifica se já existe
    if (subuserData.email && subuserData.email !== existingSubuser.email) {
      const { data: existing } = await supabase
        .from('users_accounts')
        .select('id')
        .eq('email', subuserData.email)
        .single();
      
      if (existing) {
        throw new Error('E-mail já cadastrado.');
      }
    }

    const { data, error } = await supabase
      .from('users_accounts')
      .update(subuserData)
      .eq('id', id)
      .eq('is_subuser', true)
      .select('id, email, name, created_at, is_subuser, parent_id')
      .single();

    if (error) {
      throw new Error(error.message || 'Erro ao atualizar subusuário.');
    }

    return data;
  }

  async deleteSubuser(id: string) {
    // Verifica se o subusuário existe
    const existingSubuser = await this.getSubuserById(id);
    if (!existingSubuser) {
      throw new Error('Subusuário não encontrado.');
    }

    const { error } = await supabase
      .from('users_accounts')
      .delete()
      .eq('id', id)
      .eq('is_subuser', true);

    if (error) {
      throw new Error(error.message || 'Erro ao excluir subusuário.');
    }

    return true;
  }

  async getParentUser(subuserId: string) {
    const { data: subuser, error } = await supabase
      .from('users_accounts')
      .select('parent_id')
      .eq('id', subuserId)
      .eq('is_subuser', true)
      .single();

    if (error || !subuser?.parent_id) {
      return null;
    }

    const { data: parentUser, error: parentError } = await supabase
      .from('users_accounts')
      .select('id, email, name, created_at, is_subuser, parent_id')
      .eq('id', subuser.parent_id)
      .single();

    if (parentError) {
      return null;
    }

    return parentUser;
  }
} 