import { Role } from '../../users/enums/role.enum';

export interface ActiveUserData {
  sub: number;
  email: string;
  exp: number;
  refreshTokenId?: string;
  role: Role;
}
