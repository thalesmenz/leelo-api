import { supabase } from '../config/supabase';
import { 
  AnamneseQuestion, 
  CreateAnamneseQuestionDTO, 
  UpdateAnamneseQuestionDTO, 
  AnamneseQuestionFilters 
} from '../types/anamneseQuestion';

export class AnamneseQuestionService {
  async createAnamneseQuestion(data: CreateAnamneseQuestionDTO): Promise<AnamneseQuestion> {
    // Validar se o tipo é múltipla escolha e tem opções
    if (data.type === 'multiple_choice' && (!data.options || !Array.isArray(data.options))) {
      throw new Error('Questões de múltipla escolha devem ter opções válidas.');
    }

    // Se não foi especificado order, buscar o próximo número disponível
    if (!data.order) {
      const { data: lastQuestion } = await supabase
        .from('anamnese_questions')
        .select('order')
        .eq('user_id', data.user_id)
        .order('order', { ascending: false })
        .limit(1)
        .single();

      data.order = (lastQuestion?.order || 0) + 1;
    }

    const { data: question, error } = await supabase
      .from('anamnese_questions')
      .insert({
        user_id: data.user_id,
        question: data.question,
        category: data.category,
        type: data.type,
        options: data.options,
        is_required: data.is_required || false,
        order: data.order
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return question;
  }

  async getAnamneseQuestions(filters?: AnamneseQuestionFilters): Promise<AnamneseQuestion[]> {
    let query = supabase
      .from('anamnese_questions')
      .select('*')
      .order('order', { ascending: true });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.is_required !== undefined) {
      query = query.eq('is_required', filters.is_required);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return questions || [];
  }

  async getAnamneseQuestionById(id: string): Promise<AnamneseQuestion | null> {
    const { data: question, error } = await supabase
      .from('anamnese_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return question;
  }

  async getAnamneseQuestionsByUserId(userId: string): Promise<AnamneseQuestion[]> {
    return this.getAnamneseQuestions({ user_id: userId });
  }

  async updateAnamneseQuestion(id: string, data: UpdateAnamneseQuestionDTO): Promise<AnamneseQuestion> {
    // Validar se o tipo está sendo alterado para múltipla escolha e tem opções
    if (data.type === 'multiple_choice' && (!data.options || !Array.isArray(data.options))) {
      throw new Error('Questões de múltipla escolha devem ter opções válidas.');
    }

    const updateData: any = { ...data };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: question, error } = await supabase
      .from('anamnese_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return question;
  }

  async deleteAnamneseQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('anamnese_questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async reorderQuestions(userId: string, questionIds: string[]): Promise<AnamneseQuestion[]> {
    // Verificar se todas as questões pertencem ao usuário
    const { data: existingQuestions, error: checkError } = await supabase
      .from('anamnese_questions')
      .select('id')
      .eq('user_id', userId)
      .in('id', questionIds);

    if (checkError) {
      throw new Error(checkError.message);
    }

    if (existingQuestions?.length !== questionIds.length) {
      throw new Error('Algumas questões não pertencem ao usuário.');
    }

    // Atualizar a ordem das questões
    const updates = questionIds.map((id, index) => ({
      id,
      order: index + 1
    }));

    const { data: updatedQuestions, error } = await supabase
      .from('anamnese_questions')
      .upsert(updates, { onConflict: 'id' })
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return updatedQuestions || [];
  }

  async getQuestionsByCategory(userId: string, category: string): Promise<AnamneseQuestion[]> {
    const { data: questions, error } = await supabase
      .from('anamnese_questions')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return questions || [];
  }

  async searchQuestions(userId: string, searchTerm: string): Promise<AnamneseQuestion[]> {
    const { data: questions, error } = await supabase
      .from('anamnese_questions')
      .select('*')
      .eq('user_id', userId)
      .ilike('question', `%${searchTerm}%`)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return questions || [];
  }

  async getStatistics(userId: string) {
    const { data: questions, error } = await supabase
      .from('anamnese_questions')
      .select('type, is_required, category')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    const totalQuestions = questions?.length || 0;
    const requiredQuestions = questions?.filter(q => q.is_required).length || 0;
    const optionalQuestions = totalQuestions - requiredQuestions;

    // Contar por tipo
    const typeCounts = questions?.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Contar por categoria
    const categoryCounts = questions?.reduce((acc, q) => {
      const category = q.category || 'Sem categoria';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalQuestions,
      requiredQuestions,
      optionalQuestions,
      typeCounts,
      categoryCounts
    };
  }
}


