import { z } from 'zod';
import { RemoteDataSource } from '../datasource/Remote.datasource';

const LoginResponseSchema = z.object({
  id: z.string(), // id retornado pelo backend
  acessToken: z.string(),
  refreshToken: z.string(),
  userLevel: z.number(),
});

const RegisterResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
});

// Schema "cru" que aceita tanto "accessToken" quanto "acessToken" sem usar transform/refine
const RawRefreshResponseSchema = z.object({
  accessToken: z.string().optional(),
  acessToken: z.string().optional(),
});

export class AuthRepository {
  constructor(private remote: RemoteDataSource) {}

  async login(username: string, password: string) {
    return this.remote.post({
      url: '/auth/login',
      body: { username, password },
      model: LoginResponseSchema,
    });
  }

  async register(username: string, password: string) {
    return this.remote.post({
      url: '/auth/register',
      body: { username, password },
      model: RegisterResponseSchema,
    });
  }

  async refreshToken(userId: string, refreshToken: string) {
    // Usa o schema "cru" para validar a resposta sem gerar efeitos
    const rawResult = await this.remote.post({
      url: '/auth/refresh',
      body: { userId, refreshToken },
      model: RawRefreshResponseSchema,
    });
    if (!rawResult) {
      throw new Error('Resposta nula ao atualizar o token.');
    }
    // Realiza a transformação manual: extrai a propriedade que existir e mapeia para "acessToken"
    const newAcessToken = rawResult.accessToken ?? rawResult.acessToken;
    if (!newAcessToken) {
      throw new Error('Token é obrigatório');
    }
    return { acessToken: newAcessToken };
  }
}
