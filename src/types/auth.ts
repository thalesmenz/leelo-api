export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

export interface SignUpDTO {
  email: string;
  password: string;
  name: string;
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
  };
} 