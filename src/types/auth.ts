export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  is_subuser?: boolean;
  parent_id?: string | null;
}

export interface SignUpDTO {
  email: string;
  password: string;
  name: string;
  is_subuser?: boolean;
  parent_id?: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface TokenPayload {
  id: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
} 