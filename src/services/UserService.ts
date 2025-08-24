import { supabase } from '../config/supabase';
import { UserService, CreateUserServiceDTO, UpdateUserServiceDTO } from '../types/service';

export class UserServiceService {
  async createService(data: CreateUserServiceDTO): Promise<UserService> {
    const { data: service, error } = await supabase
      .from('user_services')
      .insert({
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        active: data.active ?? true
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return service;
  }

  async getServicesByUserId(userId: string): Promise<UserService[]> {
    const { data: services, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return services || [];
  }

  async getServiceById(id: string): Promise<UserService | null> {
    const { data: service, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(error.message);
    }

    return service;
  }

  async updateService(id: string, data: UpdateUserServiceDTO): Promise<UserService> {
    const updateData: any = { ...data };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: service, error } = await supabase
      .from('user_services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return service;
  }

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_services')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async toggleServiceStatus(id: string): Promise<UserService> {
    // First get the current service to toggle the status
    const currentService = await this.getServiceById(id);
    if (!currentService) {
      throw new Error('Serviço não encontrado');
    }

    const { data: service, error } = await supabase
      .from('user_services')
      .update({
        active: !currentService.active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return service;
  }
} 