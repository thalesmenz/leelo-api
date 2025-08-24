export interface Appointment {
  id: string;
  user_id: string;
  service_id: string;
  patient_cpf: string;
  patient_name: string;
  patient_phone?: string;
  start_time: Date;
  end_time: Date;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface CreateAppointmentDTO {
  user_id: string;
  service_id: string;
  patient_cpf: string;
  patient_name: string;
  patient_phone?: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
}

export interface UpdateAppointmentDTO {
  service_id?: string;
  patient_cpf?: string;
  patient_name?: string;
  patient_phone?: string;
  start_time?: string; // ISO string
  end_time?: string; // ISO string
  status?: 'pending' | 'confirmed' | 'canceled' | 'completed';
}

export interface AppointmentWithService extends Appointment {
  service: {
    id: string;
    name: string;
    description?: string;
    duration: string;
    price: number;
  };
}

export interface AppointmentFilters {
  user_id?: string;
  service_id?: string;
  status?: 'pending' | 'confirmed' | 'canceled' | 'completed';
  start_date?: string; // ISO string
  end_date?: string; // ISO string
  patient_cpf?: string;
} 