import { SignUpDTO, SignInDTO, AuthResponse, AuthUser, RefreshTokenResponse, TokenPayload } from '../types/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

export class AuthService {
  async signUp({ email, password, name, is_subuser = false, parent_id }: SignUpDTO): Promise<AuthResponse> {
    // Validações adicionais
    if (!email || !password || !name) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
    }

    // Verifica se o usuário já existe
    const { data: existing } = await supabase
      .from('users_accounts')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (existing) throw new Error('E-mail já cadastrado.');

    // Se for um subusuário, verifica se o parent_id existe
    if (is_subuser && parent_id) {
      const { data: parentUser } = await supabase
        .from('users_accounts')
        .select('id')
        .eq('id', parent_id)
        .single();
      if (!parentUser) throw new Error('Usuário pai não encontrado.');
    }

    // Hash da senha com salt mais forte
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cria o usuário
    const { data: user, error } = await supabase
      .from('users_accounts')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        is_subuser,
        parent_id: is_subuser ? parent_id : null
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message || 'Erro ao cadastrar usuário.');

    // Revoga todos os tokens antigos do usuário (caso existam)
    await supabase
      .from('user_refresh_tokens')
      .update({ is_revoked: true })
      .eq('user_id', user.id);

    // Gera tokens
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        type: 'access'
      } as TokenPayload, 
      JWT_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        type: 'refresh'
      } as TokenPayload, 
      JWT_REFRESH_SECRET!, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Salva o refresh token no banco
    await supabase
      .from('user_refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        is_revoked: false
      });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        is_subuser: user.is_subuser,
        parent_id: user.parent_id
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7 * 24 * 60 * 60, // 7 dias em segundos
      },
    };
  }

  async signIn({ email, password }: SignInDTO): Promise<AuthResponse> {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios');
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
    }

    // Busca o usuário pelo e-mail
    const { data: user, error } = await supabase
      .from('users_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (error || !user) throw new Error('E-mail ou senha inválidos.');

    // Compara a senha
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('E-mail ou senha inválidos.');

    // Revoga todos os tokens antigos do usuário antes de gerar novos
    await supabase
      .from('user_refresh_tokens')
      .update({ is_revoked: true })
      .eq('user_id', user.id);

    // Gera tokens
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        type: 'access'
      } as TokenPayload, 
      JWT_SECRET, 
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        type: 'refresh'
      } as TokenPayload, 
      JWT_REFRESH_SECRET!, 
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Salva o refresh token no banco
    await supabase
      .from('user_refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_revoked: false
      });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        is_subuser: user.is_subuser,
        parent_id: user.parent_id
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 7 * 24 * 60 * 60, // 7 dias em segundos
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      if (!JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET não está definido');
      }

      // Verifica se o refresh token é válido
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      // Verifica se o token não foi revogado
      const { data: tokenRecord } = await supabase
        .from('user_refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .eq('is_revoked', false)
        .single();

      if (!tokenRecord) {
        throw new Error('Token revogado');
      }

      // Verifica se não expirou
      if (new Date(tokenRecord.expires_at) < new Date()) {
        throw new Error('Token expirado');
      }

      // Busca dados do usuário
      const { data: user } = await supabase
        .from('users_accounts')
        .select('id, email')
        .eq('id', decoded.id)
        .single();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Gera novo access token
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          type: 'access'
        } as TokenPayload, 
        JWT_SECRET!, 
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      return {
        access_token: newAccessToken,
        expires_in: 7 * 24 * 60 * 60
      };
    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  }

  async signOut(refreshToken: string): Promise<void> {
    try {
      // Revoga o refresh token
      await supabase
        .from('user_refresh_tokens')
        .update({ is_revoked: true })
        .eq('token', refreshToken);
    } catch (error) {
      // Não falha se não conseguir revogar
    }
  }

  async signOutAll(userId: string): Promise<void> {
    try {
      // Revoga todos os refresh tokens do usuário
      await supabase
        .from('user_refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', userId);
    } catch (error) {
      // Não falha se não conseguir revogar
    }
  }

  async getCurrentUser(token: string): Promise<AuthUser | null> {
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não está definido nas variáveis de ambiente!');
      }

      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Token inválido');
      }

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
        is_subuser: user.is_subuser,
        parent_id: user.parent_id
      };
    } catch {
      return null;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      if (!JWT_SECRET) return false;
      
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded.type === 'access';
    } catch {
      return false;
    }
  }
} 