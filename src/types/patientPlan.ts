export interface PatientPlan {
  id: string;
  user_id: string;
  name: string;
  plan_type: 'recorrente' | 'sessoes';
  sessions_monthly?: number;
  sessions_max?: number;
  price: number;
  notes?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

export interface CreatePatientPlanDTO {
  user_id: string;
  userId?: string;
  name: string;
  plan_type: 'recorrente' | 'sessoes';
  sessions_monthly?: number;
  sessions_max?: number;
  price: number;
  notes?: string;
  status: 'ativo' | 'inativo';
}

export interface UpdatePatientPlanDTO {
  name?: string;
  plan_type?: 'recorrente' | 'sessoes';
  sessions_monthly?: number;
  sessions_max?: number;
  price?: number;
  notes?: string;
  status?: 'ativo' | 'inativo';
}

export interface PatientPlanFilters {
  user_id?: string;
  userId?: string;
  name?: string;
} 