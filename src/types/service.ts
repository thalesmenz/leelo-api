export interface UserService {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserServiceDTO {
  user_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active?: boolean;
}

export interface UpdateUserServiceDTO {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  active?: boolean;
} 