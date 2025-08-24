import { supabase } from '../config/supabase';
import { 
  AnamneseAnswer, 
  CreateAnamneseAnswerDTO, 
  UpdateAnamneseAnswerDTO, 
  AnamneseAnswerFilters,
  AnamneseAnswerStatistics 
} from '../types/anamneseAnswer';

export class AnamneseAnswerService {
  async createAnamneseAnswer(data: CreateAnamneseAnswerDTO): Promise<AnamneseAnswer> {
    // Verificar se já existe uma anamnese para este paciente
    const { data: existingAnswers, error: checkError } = await supabase
      .from('anamnese_answers')
      .select('id, question_id')
      .eq('patient_id', data.patient_id);

    if (checkError) {
      throw new Error(`Erro ao verificar anamnese existente: ${checkError.message}`);
    }

    // Se já existir respostas, verificar se é a mesma questão sendo respondida
    if (existingAnswers && existingAnswers.length > 0) {
      const existingQuestion = existingAnswers.find(answer => answer.question_id === data.question_id);
      if (existingQuestion) {
        throw new Error(`Já existe uma resposta para esta questão na anamnese deste paciente.`);
      }
    }

    const { data: answer, error } = await supabase
      .from('anamnese_answers')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar resposta de anamnese: ${error.message}`);
    }

    return answer;
  }

  async getAnamneseAnswers(filters?: AnamneseAnswerFilters): Promise<AnamneseAnswer[]> {
    let query = supabase
      .from('anamnese_answers')
      .select('*')
      .order('answered_at', { ascending: false });

    if (filters) {
      if (filters.question_id) {
        query = query.eq('question_id', filters.question_id);
      }
      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }
      if (filters.appointment_id) {
        query = query.eq('appointment_id', filters.appointment_id);
      }
      if (filters.answered_at_from) {
        query = query.gte('answered_at', filters.answered_at_from);
      }
      if (filters.answered_at_to) {
        query = query.lte('answered_at', filters.answered_at_to);
      }
    }

    const { data: answers, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar respostas de anamnese: ${error.message}`);
    }

    return answers || [];
  }

  async getAnamneseAnswerById(id: string): Promise<AnamneseAnswer> {
    const { data: answer, error } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar resposta de anamnese: ${error.message}`);
    }

    if (!answer) {
      throw new Error('Resposta de anamnese não encontrada');
    }

    return answer;
  }

  async getAnamneseAnswersByPatientId(patient_id: string): Promise<AnamneseAnswer[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('patient_id', patient_id)
      .order('answered_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar respostas do paciente: ${error.message}`);
    }

    return answers || [];
  }

  async getAnamneseAnswersByQuestionId(question_id: string): Promise<AnamneseAnswer[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('question_id', question_id)
      .order('answered_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar respostas da questão: ${error.message}`);
    }

    return answers || [];
  }

  async getAnamneseAnswersByAppointmentId(appointment_id: string): Promise<AnamneseAnswer[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('appointment_id', appointment_id)
      .order('answered_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar respostas do agendamento: ${error.message}`);
    }

    return answers || [];
  }

  async updateAnamneseAnswer(id: string, data: UpdateAnamneseAnswerDTO): Promise<AnamneseAnswer> {
    const { data: answer, error } = await supabase
      .from('anamnese_answers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar resposta de anamnese: ${error.message}`);
    }

    if (!answer) {
      throw new Error('Resposta de anamnese não encontrada');
    }

    return answer;
  }

  async deleteAnamneseAnswer(id: string): Promise<void> {
    const { error } = await supabase
      .from('anamnese_answers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir resposta de anamnese: ${error.message}`);
    }
  }

  async getAnamneseAnswersWithQuestions(patient_id: string): Promise<any[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select(`
        *,
        anamnese_questions (
          id,
          question,
          type,
          options,
          is_required,
          "order"
        )
      `)
      .eq('patient_id', patient_id);

    if (error) {
      throw new Error(`Erro ao buscar respostas com questões: ${error.message}`);
    }

    // Ordenar respostas pela ordem da pergunta
    const sortedAnswers = (answers || []).sort((a, b) => 
      (a.anamnese_questions?.order || 0) - (b.anamnese_questions?.order || 0)
    );

    return sortedAnswers;
  }

  async getAnamneseAnswersByPatientAndAppointment(patient_id: string, appointment_id: string): Promise<AnamneseAnswer[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('appointment_id', appointment_id)
      .order('answered_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar respostas do paciente e agendamento: ${error.message}`);
    }

    return answers || [];
  }

  async getAnamneseAnswersByUserId(user_id: string): Promise<any[]> {
    const { data: answers, error } = await supabase
      .from('anamnese_answers')
      .select(`
        *,
        patients!inner (
          id,
          name,
          cpf,
          user_id
        ),
        anamnese_questions!inner (
          id,
          question,
          user_id
        )
      `)
      .eq('patients.user_id', user_id)
      .eq('anamnese_questions.user_id', user_id)
      .order('answered_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar anamneses do usuário: ${error.message}`);
    }

    // Agrupar respostas por paciente para formar anamneses
    const anamnesesMap = new Map();
    
    answers?.forEach(answer => {
      const patientId = answer.patient_id;
      const patient = answer.patients;
      
      if (!anamnesesMap.has(patientId)) {
        anamnesesMap.set(patientId, {
          id: patientId,
          patient_name: patient.name,
          patient_cpf: patient.cpf,
          created_at: answer.answered_at,
          last_updated: answer.answered_at,
          status: 'completa', // Por enquanto, sempre completa
          answers_count: 0
        });
      }
      
      const anamnese = anamnesesMap.get(patientId);
      anamnese.answers_count++;
      anamnese.last_updated = answer.answered_at;
    });

    return Array.from(anamnesesMap.values());
  }

  async getAnamneseWithAnswers(patientId: string): Promise<any> {
    // Primeiro, buscar as respostas do paciente
    const { data: answers, error: answersError } = await supabase
      .from('anamnese_answers')
      .select('*')
      .eq('patient_id', patientId)
      .order('answered_at', { ascending: false });

    if (answersError) {
      throw new Error(`Erro ao buscar respostas: ${answersError.message}`);
    }

    if (!answers || answers.length === 0) {
      throw new Error('Anamnese não encontrada');
    }

    // Buscar informações do paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, cpf, user_id')
      .eq('id', patientId)
      .single();

    if (patientError) {
      throw new Error(`Erro ao buscar paciente: ${patientError.message}`);
    }

    // Buscar as questões para cada resposta
    const questionIds = [...new Set(answers.map(a => a.question_id))];
    const { data: questions, error: questionsError } = await supabase
      .from('anamnese_questions')
      .select('*')
      .in('id', questionIds)
      .order('order', { ascending: true });

    if (questionsError) {
      throw new Error(`Erro ao buscar questões: ${questionsError.message}`);
    }

    // Criar um mapa de questões para acesso rápido
    const questionsMap = new Map(questions.map(q => [q.id, q]));

    // Estruturar a anamnese
    const anamnese = {
      id: patientId,
      patient_name: patient.name,
      patient_cpf: patient.cpf,
      created_at: answers[0].answered_at,
      last_updated: answers[answers.length - 1].answered_at,
      status: 'completa',
      answers_count: answers.length,
      answers: answers
        .map(answer => {
          const question = questionsMap.get(answer.question_id);
          return {
            id: answer.id,
            question_id: answer.question_id,
            answer: answer.answer,
            answered_at: answer.answered_at,
            question: question || null
          };
        })
        .sort((a, b) => (a.question?.order || 0) - (b.question?.order || 0))
    };

    return anamnese;
  }

  async getStatistics(): Promise<AnamneseAnswerStatistics> {
    // Total de respostas
    const { count: total_answers, error: totalError } = await supabase
      .from('anamnese_answers')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw new Error(`Erro ao buscar estatísticas: ${totalError.message}`);
    }

    // Respostas por questão
    const { data: answersByQuestion, error: questionError } = await supabase
      .from('anamnese_answers')
      .select('question_id')
      .not('question_id', 'is', null);

    if (questionError) {
      throw new Error(`Erro ao buscar estatísticas por questão: ${questionError.message}`);
    }

    const answers_by_question: Record<string, number> = {};
    answersByQuestion?.forEach(answer => {
      answers_by_question[answer.question_id] = (answers_by_question[answer.question_id] || 0) + 1;
    });

    // Respostas por paciente
    const { data: answersByPatient, error: patientError } = await supabase
      .from('anamnese_answers')
      .select('patient_id')
      .not('patient_id', 'is', null);

    if (patientError) {
      throw new Error(`Erro ao buscar estatísticas por paciente: ${patientError.message}`);
    }

    const answers_by_patient: Record<string, number> = {};
    answersByPatient?.forEach(answer => {
      answers_by_patient[answer.patient_id] = (answers_by_patient[answer.patient_id] || 0) + 1;
    });

    // Respostas recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recent_answers, error: recentError } = await supabase
      .from('anamnese_answers')
      .select('*', { count: 'exact', head: true })
      .gte('answered_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw new Error(`Erro ao buscar respostas recentes: ${recentError.message}`);
    }

    return {
      total_answers: total_answers || 0,
      answers_by_question,
      answers_by_patient,
      recent_answers: recent_answers || 0
    };
  }

  async bulkCreateAnamneseAnswers(answers: CreateAnamneseAnswerDTO[]): Promise<AnamneseAnswer[]> {
    if (answers.length === 0) {
      throw new Error('Nenhuma resposta fornecida');
    }

    const patientId = answers[0].patient_id;
    
    // Verificar se já existe uma anamnese para este paciente
    const { data: existingAnswers, error: checkError } = await supabase
      .from('anamnese_answers')
      .select('id')
      .eq('patient_id', patientId);

    if (checkError) {
      throw new Error(`Erro ao verificar anamnese existente: ${checkError.message}`);
    }

    // Se já existir respostas, impedir a criação de uma nova anamnese
    if (existingAnswers && existingAnswers.length > 0) {
      throw new Error(`Já existe uma anamnese para este paciente. Cada paciente pode ter apenas uma anamnese.`);
    }

    // Criar as novas respostas
    const { data: createdAnswers, error } = await supabase
      .from('anamnese_answers')
      .insert(answers)
      .select();

    if (error) {
      throw new Error(`Erro ao criar respostas em lote: ${error.message}`);
    }

    return createdAnswers || [];
  }

  async deleteAnamneseAnswersByPatientId(patient_id: string): Promise<void> {
    // Primeiro, buscar quantas respostas existem para este paciente
    const { count: answersCount, error: countError } = await supabase
      .from('anamnese_answers')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patient_id);

    if (countError) {
      throw new Error(`Erro ao contar respostas: ${countError.message}`);
    }

    // Excluir todas as respostas do paciente
    const { error } = await supabase
      .from('anamnese_answers')
      .delete()
      .eq('patient_id', patient_id);

    if (error) {
      throw new Error(`Erro ao excluir respostas do paciente: ${error.message}`);
    }
  }

  async deleteAnamneseAnswersByAppointmentId(appointment_id: string): Promise<void> {
    const { error } = await supabase
      .from('anamnese_answers')
      .delete()
      .eq('appointment_id', appointment_id);

    if (error) {
      throw new Error(`Erro ao excluir respostas do agendamento: ${error.message}`);
    }
  }
}

