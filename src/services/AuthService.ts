import { SignUpDTO, SignInDTO, AuthResponse, AuthUser } from '../types/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  async signUp({ email, password, name }: SignUpDTO): Promise<AuthResponse> {
    // Verifica se o usuário já existe
    const { data: existing } = await supabase
      .from('users_accounts')
      .select('id')
      .eq('email', email)
      .single();
    if (existing) throw new Error('E-mail já cadastrado.');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    const { data: user, error } = await supabase
      .from('users_accounts')
      .insert({
        email,
        name,
        password: hashedPassword,
      })
      .select()
      .single();
    if (error) throw new Error(error.message || 'Erro ao cadastrar usuário.');

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
      }
    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      session: {
        access_token: token,
        refresh_token: '',
      },
    };
  }

  async signIn({ email, password }: SignInDTO): Promise<AuthResponse> {
    // Busca o usuário pelo e-mail
    const { data: user, error } = await supabase
      .from('users_accounts')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user) throw new Error('E-mail ou senha inválidos.');

    // Compara a senha
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('E-mail ou senha inválidos.');

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
      }

    // Gera o token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      session: {
        access_token: token,
        refresh_token: '',
      },
    };
  }

  async signOut(): Promise<void> {
    // JWT é stateless, não há nada a fazer
    return;
  }

  async getCurrentUser(token: string): Promise<AuthUser | null> {
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
      }
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const { data: user } = await supabase
        .from('users_accounts')
        .select('*')
        .eq('id', decoded.id)
        .single();
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      };
    } catch {
      return null;
    }
  }
} 