import { User, LoginCredentials, AuthResponse } from './@auth';

export interface AuthApiError {
  error: string;
  code?: string;
}

export type LoginApiFunction = (credentials: LoginCredentials) => Promise<AuthResponse>;
export type LogoutApiFunction = () => Promise<void>;
export type CheckAuthApiFunction = () => Promise<User | null>;

export interface AuthApiInterface {
  login: LoginApiFunction;
  logout: LogoutApiFunction;
  checkAuth: CheckAuthApiFunction;
} 