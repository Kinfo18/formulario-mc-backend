import jwt from 'jsonwebtoken';
import { Rol } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  rol: Rol;
  nombre: string;
}

const secret = process.env.JWT_SECRET;

const rawExpires = process.env.JWT_EXPIRES_IN ?? '8h';
const VALID_EXPIRES = /^\d+[smhd]$/;
if (!VALID_EXPIRES.test(rawExpires)) {
  throw new Error(`JWT_EXPIRES_IN inválido: "${rawExpires}". Use formato: 8h, 1d, 30m, etc.`);
}

if (!secret) {
  throw new Error('JWT_SECRET env variable not set');
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret as string, { expiresIn: rawExpires } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret as string) as JwtPayload;
}
