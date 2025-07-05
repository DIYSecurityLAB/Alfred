import { RemoteDataSource } from '@/data/datasource/Remote.datasource';
import { AuthRepository } from '@/data/repositories/Auth.repository';
import { axiosInstance } from '@/infrastructure/api/axiosInstance';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export type AuthUser = {
  id: string;
  username: string;
  acessToken: string;
  refreshToken: string;
  level: number;
  levelName: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: (
    userId: string,
    refreshToken: string,
  ) => Promise<{ acessToken: string }>;
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

const apiKey = import.meta.env.VITE_API_KEY;

const remoteDataSource = new RemoteDataSource(import.meta.env.VITE_API_URL, {
  'x-api-key': apiKey,
});
const authRepository = new AuthRepository(remoteDataSource);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Erro ao parsear o usuário do localStorage', error);
        return null;
      }
    }
    return null;
  });


  useEffect(() => {
    if (user?.acessToken) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${user.acessToken}`;
    }
  }, [user]);

  const refreshAccessToken = useCallback(
    async (
      userId: string,
      refreshToken: string,
    ): Promise<{ acessToken: string }> => {
      const result = await authRepository.refreshToken(userId, refreshToken);
      if (!result) {
        throw new Error('Erro ao atualizar o token: resposta nula.');
      }

      const newAcessToken = result.acessToken;
      if (newAcessToken && typeof newAcessToken === 'string') {

        if (user) {
          const updatedUser: AuthUser = {
            ...user,
            acessToken: newAcessToken,
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAcessToken}`;
        }
        return { acessToken: newAcessToken };
      }
      throw new Error('Erro ao atualizar o token: resposta inválida.');
    },
    [user],
  );

  useEffect(() => {
    if (user) {
      const interval = setInterval(
        () => {
          refreshAccessToken(user.id, user.refreshToken);
        },
        5 * 60 * 1000,
      );
      return () => clearInterval(interval);
    }
  }, [user, refreshAccessToken]);

  const login = async (username: string, password: string) => {
    try {
      const result = await authRepository.login(username, password);
      if (!result || !result.acessToken || !result.refreshToken || !result.id) {
        throw new Error('Dados de login incompletos recebidos do backend');
      }
      const loggedUser: AuthUser = {
        id: result.id,
        username,
        acessToken: result.acessToken,
        refreshToken: result.refreshToken,
        level: result.level || 0,
        levelName: result.levelName || 'Madeira',
      };
      setUser(loggedUser);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${loggedUser.acessToken}`;
      console.log('Usuário logado:', loggedUser);
      console.log(
        'Header Authorization:',
        axiosInstance.defaults.headers.common.Authorization,
      );
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const result = await authRepository.register(username, password);
      console.log('Registro realizado:', result);
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axiosInstance.defaults.headers.common.Authorization;
    console.log('Usuário deslogado e token removido do header.');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, refreshAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
