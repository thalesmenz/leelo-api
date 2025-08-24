import { supabase } from '../config/supabase';
import { 
  Appointment, 
  CreateAppointmentDTO, 
  UpdateAppointmentDTO, 
  AppointmentWithService,
  AppointmentFilters 
} from '../types/appointment';

export class AppointmentService {
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    // Validar e normalizar as datas
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    // Garantir que as datas estão no formato correto
    const normalizedStartTime = startTime.toISOString();
    const normalizedEndTime = endTime.toISOString();

    const { data: appointment, error } = await supabase
      .from('user_appointments')
      .insert({
        user_id: data.user_id,
        service_id: data.service_id,
        patient_cpf: data.patient_cpf,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return appointment;
  }

  async createAppointmentWithoutConflictCheck(data: CreateAppointmentDTO): Promise<Appointment> {
    // Validar e normalizar as datas
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    // Garantir que as datas estão no formato correto
    const normalizedStartTime = startTime.toISOString();
    const normalizedEndTime = endTime.toISOString();

    const { data: appointment, error } = await supabase
      .from('user_appointments')
      .insert({
        user_id: data.user_id,
        service_id: data.service_id,
        patient_cpf: data.patient_cpf,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return appointment;
  }

  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentWithService[]> {
    let query = supabase
      .from('user_appointments')
      .select(`
        *,
        service:user_services(
          id,
          name,
          description,
          duration,
          price
        )
      `);

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.service_id) {
      query = query.eq('service_id', filters.service_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.patient_cpf) {
      query = query.eq('patient_cpf', filters.patient_cpf);
    }

    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('start_time', filters.end_date);
    }

    const { data: appointments, error } = await query.order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return appointments || [];
  }

  async getAppointmentById(id: string): Promise<AppointmentWithService | null> {
    const { data: appointment, error } = await supabase
      .from('user_appointments')
      .select(`
        *,
        service:user_services(
          id,
          name,
          description,
          duration,
          price
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return appointment;
  }

  async getAppointmentsByUserId(userId: string): Promise<AppointmentWithService[]> {
    return this.getAppointments({ user_id: userId });
  }

  async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<Appointment> {
    const updateData: any = { ...data };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: appointment, error } = await supabase
      .from('user_appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return appointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_appointments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'canceled' | 'completed'): Promise<{ appointment: Appointment; transactionInfo?: { action: 'created' | 'deleted' | 'none'; error?: string } }> {
    const { data: appointment, error } = await supabase
      .from('user_appointments')
      .update({
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

        let transactionInfo: { action: 'created' | 'deleted' | 'none'; error?: string } = { action: 'none' };

    // Se o status foi alterado para 'completed', criar uma transação automaticamente
    if (status === 'completed') {
      try {
        // Verificar se já existe uma transação para este agendamento
        const { data: existingTransaction, error: checkError } = await supabase
          .from('transactions')
          .select('id')
          .eq('origin', 'agendamento')
          .eq('origin_id', String(id))
          .maybeSingle(); // Usar maybeSingle para não falhar se não encontrar

        // Se já existe uma transação, não criar outra
        if (existingTransaction) {
          transactionInfo = { action: 'none' };
        } else {
          // Buscar o agendamento com os dados do serviço para obter o preço
          const appointmentWithService = await this.getAppointmentById(id);
          
          if (appointmentWithService && appointmentWithService.service) {
            // Criar transação de entrada (receita)
            const { data: transaction, error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: String(appointment.user_id),
                date: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
                type: 'entrada',
                origin: 'agendamento',
                origin_id: String(id),
                description: `Agendamento - ${appointmentWithService.service.name || 'Serviço'} - ${appointmentWithService.patient_name || 'Paciente'}`,
                amount: Number(appointmentWithService.service.price)
              })
              .select()
              .single();

            if (transactionError) {
              transactionInfo = { action: 'none', error: transactionError.message };
            } else {
              transactionInfo = { action: 'created' };
            }
          }
        }
      } catch (error: any) {
        transactionInfo = { action: 'none', error: error.message };
      }
    }

    // Se o status foi alterado para 'pending', 'canceled' ou 'confirmed', excluir a transação se existir
    if (status === 'pending' || status === 'canceled' || status === 'confirmed') {
      try {
        // Buscar e excluir a transação relacionada a este agendamento
        const { data: existingTransaction, error: checkError } = await supabase
          .from('transactions')
          .select('id')
          .eq('origin', 'agendamento')
          .eq('origin_id', String(id))
          .maybeSingle();

        if (existingTransaction) {
          // Excluir a transação
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', existingTransaction.id);

          if (deleteError) {
            transactionInfo = { action: 'none', error: deleteError.message };
          } else {
            transactionInfo = { action: 'deleted' };
          }
        } else {
          transactionInfo = { action: 'none' };
        }
      } catch (error: any) {
        transactionInfo = { action: 'none', error: error.message };
      }
    }

    return { appointment, transactionInfo };
  }

  async getAvailableSlots(userId: string, date: string, serviceId?: string): Promise<{ start_time: string; end_time: string }[]> {
    try {
      // 1. Buscar a configuração de horário para o dia da semana
      // Corrigir problema de fuso horário - criar data no fuso horário local
      const [year, month, day] = date.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11
      const weekday = targetDate.getDay(); // 0 = domingo, 1 = segunda, etc.
      const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const dayName = dayNames[weekday];

      // Buscar configuração do dia
      const { data: schedule, error: scheduleError } = await supabase
        .from('user_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('day_of_week', dayName)
        .single();

      if (scheduleError || !schedule || !schedule.is_active) {
        return []; // Dia não configurado ou inativo
      }

      // 2. Buscar duração do serviço se especificado
      let serviceDuration = 60; // padrão 60 minutos
      if (serviceId) {
        const { data: service, error: serviceError } = await supabase
          .from('user_services')
          .select('duration')
          .eq('id', serviceId)
          .single();
        
        if (!serviceError && service) {
          serviceDuration = service.duration || 60;
        }
      }

      // 3. Buscar agendamentos existentes para a data
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('user_appointments')
        .select('start_time, end_time, status')
        .eq('user_id', userId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed', 'completed']); // Apenas agendamentos ativos

      if (appointmentsError) {
        throw new Error('Erro ao buscar agendamentos existentes');
      }

      // 4. Gerar slots disponíveis
      const slots: { start_time: string; end_time: string }[] = [];
      const slotInterval = schedule.slot_interval || 30; // intervalo configurável pelo usuário (padrão 30 min)
      
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      
      let currentSlot = new Date(startTime);
      
      while (currentSlot < endTime) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(currentSlot.getHours(), currentSlot.getMinutes(), 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
        
        // Verificar se o slot cabe no horário de trabalho
        const slotEndTime = new Date(`2000-01-01T${slotEnd.toTimeString().slice(0, 5)}`);
        if (slotEndTime > endTime) {
          break;
        }
        
        // Verificar se há pausa para almoço
        let isLunchBreak = false;
        if (schedule.has_lunch_break && schedule.lunch_start_time && schedule.lunch_end_time) {
          const lunchStart = new Date(`2000-01-01T${schedule.lunch_start_time}`);
          const lunchEnd = new Date(`2000-01-01T${schedule.lunch_end_time}`);
          const slotStartTime = new Date(`2000-01-01T${slotStart.toTimeString().slice(0, 5)}`);
          
          if (slotStartTime < lunchEnd && slotEndTime > lunchStart) {
            isLunchBreak = true;
          }
        }
        
        // Verificar conflitos com agendamentos existentes
        let hasConflict = false;
        if (existingAppointments && existingAppointments.length > 0) {
          for (const appointment of existingAppointments) {
            const apptStart = new Date(appointment.start_time);
            const apptEnd = new Date(appointment.end_time);
            
            // Verificar sobreposição: se o novo slot se sobrepõe a um agendamento existente
            // Um conflito acontece quando:
            // - O início do novo slot é antes do fim do agendamento existente E
            // - O fim do novo slot é depois do início do agendamento existente
            if (slotStart < apptEnd && slotEnd > apptStart) {
              hasConflict = true;
              break;
            }
          }
        }
        
        // Se não há conflitos e não é pausa de almoço, adicionar o slot
        if (!hasConflict && !isLunchBreak) {
          slots.push({
            start_time: slotStart.toISOString(),
            end_time: slotEnd.toISOString()
          });
        }
        
        // Avançar para o próximo slot usando o intervalo configurado
        currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval);
      }
      
      return slots;
    } catch (error) {
      return [];
    }
  }

  async checkConflicts(userId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('user_appointments')
      .select('id, start_time, end_time')
      .eq('user_id', userId)
      .not('status', 'eq', 'canceled');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!appointments || appointments.length === 0) {
      return false;
    }

    // Verificar conflitos manualmente
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    for (const appointment of appointments) {
      const existingStart = new Date(appointment.start_time);
      const existingEnd = new Date(appointment.end_time);

      // Verificar se há sobreposição
      if (newStart < existingEnd && newEnd > existingStart) {
        return true; // Há conflito
      }
    }

    return false; // Não há conflitos
  }
} 