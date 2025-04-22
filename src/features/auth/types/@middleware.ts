import { UserRole } from './@auth';

export interface JwtPayload {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
} 