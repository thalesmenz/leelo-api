export interface MedicalRecord {
  id: string;
  patient_id: string;
  professional_id: string;
  notes: string;
  created_at: string;
}

export interface CreateMedicalRecordDTO {
  patient_id: string;
  professional_id: string;
  notes: string;
}

export interface UpdateMedicalRecordDTO {
  patient_id?: string;
  professional_id?: string;
  notes?: string;
}

export interface MedicalRecordFilters {
  patient_id?: string;
  professional_id?: string;
  created_at_from?: string;
  created_at_to?: string;
}

export interface MedicalRecordWithPatient {
  id: string;
  patient_id: string;
  professional_id: string;
  notes: string;
  created_at: string;
  patient_name: string;
  patient_cpf: string;
  professional_name: string;
}

export interface MedicalRecordStatistics {
  total_records: number;
  records_by_patient: Record<string, number>;
  records_by_professional: Record<string, number>;
  recent_records: number;
}

