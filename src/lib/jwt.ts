import jwt from 'jsonwebtoken';
import { Rol } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  rol: Rol;
  nombre: string;
}

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

if (!secret) {
  throw new Error('JWT_SECRET env variable not set');
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret as string, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret as string) as JwtPayload;
}
